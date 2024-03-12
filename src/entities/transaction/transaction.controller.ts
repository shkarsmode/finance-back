import { Controller, Get, Headers, UseGuards } from '@nestjs/common';

import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Transaction } from './entities/transaction.entity';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
    constructor(
        private readonly transactionService: TransactionService,
        private readonly authService: AuthService
    ) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    public async get(
        @Headers('authorization') authorization: string,
    ): Promise<Transaction[]> {
        const token = authorization.split(' ')[1];
        const userId = this.authService.getUserFieldFromToken(
            token,
            'id',
        ) as number;
        const transactions = await this.transactionService.get(userId);
        return transactions;
    }
}
