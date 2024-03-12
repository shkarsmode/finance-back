import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { MonobankService } from '../../services/monobank/monobank.service';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        private readonly monobankService: MonobankService,
    ) {}

    public async get(
        userId: number,
        monobankToken: string,
        cardId: string,
        month?: number,
    ): Promise<Transaction[]> {
        const updateTimeToCheck = new Date().getTime() - 60000;
        const { startDate, endDate } =
            this.getStartAndEndDateBasedOnMonthNumber(month);

        const existingTransactions = await this.transactionRepository.find({
            where: {
                time: Between(startDate.getTime(), endDate.getTime()),
                user: { id: userId },
            },
        });

        if (
            this.monobankService.lastRequestTime < updateTimeToCheck
        ) {
            console.log(
                '[TransactionService] transactions info can be updated',
            );

            const transactionsFromApi =
                await this.monobankService.getTransactions(
                    monobankToken,
                    cardId,
                    startDate.getTime(),
                    endDate.getTime(),
                );

            const updatedTransactions: Transaction[] = [];

            for (const transactionFromApi of transactionsFromApi) {
                const existingTransaction = existingTransactions.find(
                    (t) => t.id === transactionFromApi.id,
                );

                if (existingTransaction) {
                    Object.assign(existingTransaction, transactionFromApi);
                    await this.transactionRepository.save(existingTransaction);
                    updatedTransactions.push(existingTransaction);
                } else {
                    const newTransaction = this.transactionRepository.create({
                        ...transactionFromApi,
                        user: { id: userId },
                    });
                    await this.transactionRepository.save(newTransaction);
                    updatedTransactions.push(newTransaction);
                }
            }

            return updatedTransactions;
        }

        console.log('[TransactionService] transactions info can`t be updated');
        return existingTransactions;
    }

    private getStartAndEndDateBasedOnMonthNumber(month?: number): {
        startDate: Date;
        endDate: Date;
    } {
        const currentDate = new Date();
        const startDate = new Date(
            currentDate.getFullYear(),
            month ? month - 1 : currentDate.getMonth(),
            1,
        );
        const endDate = new Date(
            currentDate.getFullYear(),
            month ? month : currentDate.getMonth() + 1,
            0,
            23,
            59,
            59,
        );

        return { startDate, endDate };
    }
}
