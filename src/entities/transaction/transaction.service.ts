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

        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        const existingTransactions = await this.transactionRepository.find({
            where: {
                time: Between(
                    startDate.getTime().toString(),
                    endDate.getTime().toString(),
                ),
                user: { id: user.id },
                cardId,
            },
            relations: ['user'],
        });

        const updateTimeToCheck = new Date().getTime() - 60000;

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
            ).map((transaction) => ({ ...transaction, cardId }));

            const updatedTransactions: Transaction[] = [];

            for (const transactionFromApi of transactionsFromApi) {
                const existingTransaction = existingTransactions.find(
                    (t) => t.id === transactionFromApi.id,
                );

                if (existingTransaction) {
                    Object.assign(existingTransaction, transactionFromApi);
                    this.transactionRepository.save(existingTransaction);
                    updatedTransactions.push(existingTransaction);
                } else {
                    const newTransaction = this.transactionRepository.create({
                        ...transactionFromApi,
                        user,
                        cardId,
                    });
                    this.transactionRepository.save(newTransaction);
                    updatedTransactions.push(newTransaction);
                }
            }

            return updatedTransactions;
        }

        console.log('[TransactionService] transactions info can`t be updated');
        return existingTransactions ?? [];
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
