import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ITransaction } from 'src/interfaces';
import { Raw, Repository } from 'typeorm';
import { MonobankService } from '../../services/monobank/monobank.service';
import { User } from '../user/entities/user.entity';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(Transaction)
        private readonly userRepository: Repository<User>,
        private readonly monobankService: MonobankService,
        private readonly transactionRepository: Repository<Transaction>,
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

        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        const existingTransactions = await this.transactionRepository.find({
            where: {
                time: Raw(
                    (alias) => `${alias} BETWEEN :startDate AND :endDate`,
                    {
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                    },
                ),
                user: { id: user.id },
                cardId,
            },
        });

        if (
            !existingTransactions.length ||
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
            ).map((transaction) => ({ ...transaction, cardId }));

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
                        user,
                        cardId,
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
