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
                time: Between(+startDate.getTime(), +endDate.getTime()),
                user,
                cardId,
            },
        });

        const unix_timestamp = this.monobankService.lastRequestTransactionsTime;
        var date = new Date(unix_timestamp * 1000);
        var hours = date.getHours();
        var minutes = '0' + date.getMinutes();
        var seconds = '0' + date.getSeconds();
        var formattedTime =
            hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

        const updateTimeToCheck = new Date().getTime() - 60000;

        console.log('[LAST REQUEST TRANS TIME]', formattedTime, 'last request < update time to check', unix_timestamp < updateTimeToCheck);

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
            ).map((transaction) => ({ ...transaction, cardId, time: +transaction.time }));

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
