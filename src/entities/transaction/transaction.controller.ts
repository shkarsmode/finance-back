import { Controller, Get, Headers, Param, ParseIntPipe, UseGuards } from '@nestjs/common';

import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Transaction } from './entities/transaction.entity';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
    constructor(
        private readonly transactionService: TransactionService,
        private readonly authService: AuthService,
    ) {}

    @Get('/:cardId/:month/:year')
    @UseGuards(JwtAuthGuard)
    public async get(
        @Param('cardId') cardId: string,
        @Param('month', ParseIntPipe) month: number,
        @Param('year', ParseIntPipe) year: number,
        @Headers('authorization') authorization: string,
    ): Promise<Transaction[]> {
        const token = authorization.split(' ')[1];

        const userId = +this.authService.getUserFieldFromToken(
            token,
            'id',
        ) as number;
        const monobankToken = this.authService.getUserFieldFromToken(
            token,
            'monobankToken',
        ) as string;

        const transactions = await this.transactionService.get(
            userId,
            monobankToken,
            cardId,
            month,
            year,
        );

        return transactions;
    }
}
