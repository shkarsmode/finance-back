import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ITransaction } from 'src/interfaces';
import { Between, Repository } from 'typeorm';
import { MonobankService } from '../../services/monobank/monobank.service';
import { User } from '../user/entities/user.entity';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        private readonly monobankService: MonobankService,
    ) {}

    public async get(
        userId: number,
        monobankToken: string,
        cardId: string,
        month?: number,
        year?: number,
    ): Promise<{ data: ITransaction[]; status: number; message: string }> {
        const { startDate, endDate } = this.getStartAndEndDateBasedOnMonthNumber(month, year);
    
        const fromSec = Math.floor(startDate.getTime() / 1000);
        const toSec = Math.floor(endDate.getTime() / 1000);

        const [existingTransactions, transactionsFromApi] = await Promise.all([
            this.transactionRepository.find({
                where: {
                    time: Between(String(fromSec), String(toSec)),
                    user: { id: userId },
                    cardId,
                },
                relations: ['user'],
            }),
            this.monobankService.getTransactions(monobankToken, cardId, fromSec, toSec),
        ]);

        if (transactionsFromApi.status === 429) {
            return {
                data: existingTransactions,
                status: 429,
                message: `Too many requests to monobank api`,
            };
        }

        const incoming: Transaction[] = (transactionsFromApi.data ?? []).map((t) => ({
            ...t,
            user: { id: userId },
            cardId,
        })) as Transaction[];

        // build fast lookup by id
        const existingById = new Map(existingTransactions.map(t => [t.id, t]));

        // partition: new vs changed
        const toInsert: Transaction[] = [];
        const toReplace: Transaction[] = [];

        for (const inc of incoming) {
            const prev = existingById.get(inc.id);
            if (!prev) {
                toInsert.push(inc);
                continue;
            }
            if (shouldReplace(prev, inc)) {
                toReplace.push(inc);
            }
        }

        // apply changes atomically
        await this.transactionRepository.manager.transaction(async (em) => {
            if (toReplace.length) {
                const ids = toReplace.map(t => t.id);
                await em.createQueryBuilder()
                    .delete()
                    .from(Transaction)
                    .where(`"userId" = :userId AND "cardId" = :cardId AND "id" IN (:...ids)`, { userId, cardId, ids })
                    .execute();

                await em.createQueryBuilder()
                    .insert()
                    .into(Transaction)
                    .values(toReplace)
                    .execute();
            }

            if (toInsert.length) {
                await em.createQueryBuilder()
                    .insert()
                    .into(Transaction)
                    .values(toInsert)
                    .execute();
            }
        });

        // re-read fresh month from DB to return consistent data
        const fresh = await this.transactionRepository.find({
            where: {
                time: Between(String(fromSec), String(toSec)),
                user: { id: userId },
                cardId,
            },
            relations: ['user'],
            order: { time: 'DESC' } as any,
        });

        return {
            data: fresh,
            status: 200,
            message: `Transactions synced (inserted: ${toInsert.length}, replaced: ${toReplace.length})`,
        };

        /** Decide whether to replace existing row with incoming one */
        function shouldReplace(prev: Transaction, inc: Transaction): boolean {
            // Normalize primitives for robust comparison
            const norm = (v: any) => (v === undefined || v === null ? '' : String(v));

            // Critical fields that actually change on settle or corrections
            const changedHold = Boolean((prev as any).hold) !== Boolean((inc as any).hold);
            if (changedHold) return true;

            const changedAmount = norm((prev as any).amount) !== norm((inc as any).amount);
            if (changedAmount) return true;

            const changedOpAmount = norm((prev as any).operationAmount) !== norm((inc as any).operationAmount);
            if (changedOpAmount) return true;

            // Time can change between auth and settle in some providers
            const changedTime = norm((prev as any).time) !== norm((inc as any).time);
            if (changedTime) return true;

            // Optional: keep your DB in full sync with API
            const changedCurrency = norm((prev as any).currencyCode) !== norm((inc as any).currencyCode);
            const changedDesc     = norm((prev as any).description)  !== norm((inc as any).description);
            const changedMcc      = norm((prev as any).mcc)          !== norm((inc as any).mcc);
            const changedComment  = norm((prev as any).comment)      !== norm((inc as any).comment);
            const changedBalance  = norm((prev as any).balance)      !== norm((inc as any).balance);

            return changedCurrency || changedDesc || changedMcc || changedComment || changedBalance;
        }
    }

    private getStartAndEndDateBasedOnMonthNumber(
        month?: number,
        year?: number,
    ): {
        startDate: Date;
        endDate: Date;
    } {
        const currentDate = new Date();
        const startDate = new Date(
            year ?? currentDate.getFullYear(),
            month ? month - 1 : currentDate.getMonth(),
            1,
        );
        const endDate = new Date(
            year ?? currentDate.getFullYear(),
            month ? month : currentDate.getMonth() + 1,
            0,
            23,
            59,
            59,
        );

        return { startDate, endDate };
    }
}
