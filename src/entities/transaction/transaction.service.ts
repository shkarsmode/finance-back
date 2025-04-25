import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
    ): Promise<Transaction[]> {
        const { startDate, endDate } =
            this.getStartAndEndDateBasedOnMonthNumber(month, year);

        // Запрос существующих транзакций параллельно с запросом через API
        const [existingTransactions, transactionsFromApi] = await Promise.all([
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

        const updateTimeToCheck = new Date().getTime() - 120000; // 2 минуты
        console.log('existingTransactions', existingTransactions.length);

        // Если прошло достаточно времени, обновляем данные
        // if (
        //     this.monobankService.lastRequestTransactionsTime < updateTimeToCheck
        // ) {
            console.log(
                '[TransactionService] transactions info can be updated',
            );

            const updatedTransactions: Transaction[] = [];

            // Если транзакции совпадают по количеству, возвращаем старые
            if (transactionsFromApi?.length === existingTransactions?.length) {
                return existingTransactions;
            }

            // Обработка новых транзакций
            for (const transactionFromApi of transactionsFromApi) {
                const existingTransaction = existingTransactions.find(
                    (t) => t.id === transactionFromApi.id,
                );

                if (!existingTransaction) {
                    // Создаём новую транзакцию
                    const newTransaction = this.transactionRepository.create({
                        ...transactionFromApi,
                        user: { id: userId },
                        cardId,
                    });
                    await this.transactionRepository.save(newTransaction);
                    updatedTransactions.push(newTransaction);
                } else {
                    // Если транзакция существует, добавляем её в обновлённый список
                    updatedTransactions.push({
                        ...transactionFromApi,
                        user: { id: userId },
                        cardId,
                    } as Transaction);
                }
            }

            return updatedTransactions.sort((a, b) => +b.time - +a.time);
        // }

        // console.log('[TransactionService] transactions info can`t be updated');
        return existingTransactions?.sort((a, b) => +b.time - +a.time) ?? [];
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
