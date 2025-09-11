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
    
        // always UTC seconds; no manual -3 hours
        const fromSec = Math.floor(startDate.getTime() / 1000);
        const toSec = Math.floor(endDate.getTime() / 1000);
    
        const [existingTransactions, transactionsFromApi] = await Promise.all([
            this.transactionRepository.find({
                where: {
                    time: Between(String(fromSec), String(toSec)), // time stored as unix seconds (string)
                    user: { id: userId },
                    cardId,
                },
                relations: ['user'],
            }),
            this.monobankService.getTransactions(
                monobankToken,
                cardId,
                fromSec, // pass seconds; внутри сервиса, если нужно, умножь на 1000 для внешнего API
                toSec
            ),
        ]);
    
        if (transactionsFromApi.status === 429) {
            return {
                data: existingTransactions,
                status: 429,
                message: 'Too many requests to monobank api',
            };
        }
    
        const incoming = (transactionsFromApi.data ?? []).map((t) => ({
            ...t,
            user: { id: userId },
            cardId,
            // ensure all critical fields are normalized here if нужны (amount, currencyCode, hold, isHidden)
        })) as Transaction[];
    
        // ✅ Upsert по id (+ cardId, если id не глобально уникален)
        // Обновляем amount/hold/description/mcc/time и т.д.
        await this.transactionRepository.upsert(incoming, {
            conflictPaths: ['id'], // или ['id', 'cardId'] если id уникален только в рамках карты
            skipUpdateIfNoValuesChanged: true,
        });
    
        // Берем уже консистентные данные из БД, тем же диапазоном
        const fresh = await this.transactionRepository.find({
            where: {
                time: Between(String(fromSec), String(toSec)),
                user: { id: userId },
                cardId,
            },
            relations: ['user'],
            order: { time: 'DESC' },
        });
    
        return {
            data: fresh,
            status: 200,
            message: 'Transactions synced',
        };
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
