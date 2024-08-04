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
    ): Promise<Transaction[]> {
        const { startDate, endDate } =
            this.getStartAndEndDateBasedOnMonthNumber(month);


        const existingTransactions = await this.transactionRepository.find({
            where: {
                time: Between(
                    startDate.setHours(startDate.getHours() - 2).toString(),
                    endDate.setHours(endDate.getHours() - 2).toString(),
                ),
                user: { id: userId },
                cardId,
            },
            relations: ['user']
        });

        const updateTimeToCheck = new Date().getTime() - 3600000; // 1 hour
        console.log('existingTransactions', existingTransactions.length);

        if (
            this.monobankService.lastRequestTransactionsTime < updateTimeToCheck
        ) {
            console.log(
                '[TransactionService] transactions info can be updated',
            );

            const transactionsFromApi: ITransaction[] = (
                await this.monobankService.getTransactions(
                    monobankToken,
                    cardId,
                    startDate.getTime(),
                    endDate.getTime(),
                )
            )
                .map((transaction) => ({ ...transaction, cardId }))

            const updatedTransactions: Transaction[] = [];

            if (transactionsFromApi?.length === existingTransactions?.length) {
                return existingTransactions;
            }

            for (const transactionFromApi of transactionsFromApi) {
                const existingTransaction = existingTransactions.find(
                    (t) => t.id === transactionFromApi.id,
                );

                if (!existingTransaction) {
                    const newTransaction = await this.transactionRepository.create({
                        ...transactionFromApi,
                        user: { id: userId },
                        cardId,
                    });
                    await this.transactionRepository.save(newTransaction);
                    updatedTransactions.push(newTransaction);
                } else {
                    updatedTransactions.push({
                        ...transactionFromApi,
                        user: { id: userId },
                        cardId,
                    } as Transaction);
                }
            }

            return updatedTransactions.sort((a, b) => +b.time - +a.time);
        }

        console.log('[TransactionService] transactions info can`t be updated');
        return existingTransactions?.sort((a, b) => +b.time - +a.time) ?? [];
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
