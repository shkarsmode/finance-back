import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
    ) {}

    public async get(userId: number, month?: number): Promise<Transaction[]> {
        const { startDate, endDate } = this.getStartAndEndDateBasedOnMonthNumber(month);

        const transactions = await this.transactionRepository.find({
            where: {
                time: Between(startDate.getTime(), endDate.getTime()),
            },
        });

        return transactions;
    }

    
    private getStartAndEndDateBasedOnMonthNumber(month?: number): 
        { startDate: Date, endDate: Date } 
    {
        const currentDate = new Date();
        const startDate = new Date(
            currentDate.getFullYear(),
            month ? month - 1 : currentDate.getMonth(),
            1,
        );
        const endDate = new Date(
            currentDate.getFullYear(),
            month ? month : currentDate.getMonth() + 1,
            0,23,59,59,
        );

        return { startDate, endDate };
    }
}
