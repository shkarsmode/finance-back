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
    ): Promise<ITransaction[]> {
        const { startDate, endDate } =
            this.getStartAndEndDateBasedOnMonthNumber(month, year);

        const [existingTransactions, transactionsFromApi]: [
            ITransaction[],
            { data: ITransaction[]; status: number },
        ] = await Promise.all([
            this.transactionRepository.find({
                where: {
                    time: Between(
                        startDate.setHours(startDate.getHours() - 3).toString(),
                        endDate.setHours(endDate.getHours() - 3).toString(),
                    ),
                    user: { id: userId },
                    cardId,
                },
                relations: ['user'],
            }),
            this.monobankService.getTransactions(
                monobankToken,
                cardId,
                startDate.getTime(),
                endDate.getTime(),
            ),
        ]);

        // const updateTimeToCheck = new Date().getTime() - 120000;
        // console.log('existingTransactions', existingTransactions.length);

        if (transactionsFromApi.status === 200 && transactionsFromApi.data.length === 0) {
            console.log('[TransactionService] transactions from api is empty');
            return existingTransactions
        }

        if (
            transactionsFromApi.status === 200 &&
            transactionsFromApi.data.length &&
            transactionsFromApi.data.length === existingTransactions.length
        ) {
            console.log(
                '[TransactionService] transactions from api is equal to existing transactions',
            );
            return existingTransactions;
        }

        if (transactionsFromApi.status === 429) {
            console.log('[TransactionService] Too many requests to monobank api');
            return existingTransactions;
        }

        if (
            transactionsFromApi.status === 200 &&
            transactionsFromApi.data.length > existingTransactions.length
        ) {
            console.log('[TransactionService] New transactions from api found');
        }

        const updatedTransactions: Transaction[] = transactionsFromApi.data.map(
            (t) => ({
                ...t,
                user: { id: userId },
                cardId,
            }),
        ) as Transaction[];

        const existingIds = new Set(existingTransactions.map((t) => t.id));

        const newTransactions = updatedTransactions.filter(
            (t) => !existingIds.has(t.id),
        );

        if (newTransactions.length > 0) {
            this.transactionRepository.save(newTransactions).catch((err) => {
                console.error(
                    '[TransactionService] Failed to save transactions',
                    err,
                );
            });
        }

        return updatedTransactions.sort((a, b) => +b.time - +a.time);
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
