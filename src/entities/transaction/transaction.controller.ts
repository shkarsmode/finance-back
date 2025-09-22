import { Controller, Get, Headers, Param, UseGuards } from '@nestjs/common';

import { ITransaction } from 'src/interfaces';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
    constructor(
        private readonly transactionService: TransactionService,
        private readonly authService: AuthService,
    ) {}

    @Get('/:cardId/:month/:year?')
    @UseGuards(JwtAuthGuard)
    public async get(
        @Param('cardId') cardId: string,
        @Param('month') month: string,
        @Param('year') year: string,
        @Headers('authorization') authorization: string,
    ): Promise<{ data: ITransaction[], status: number, message: string }> {
        const token = authorization.split(' ')[1];

        const userId = +this.authService.getUserFieldFromToken(
            token,
            'id',
        ) as number;
        const monobankToken = this.authService.getUserFieldFromToken(
            token,
            'monobankToken',
        ) as string;

        const response = await this.transactionService.get(
            userId,
            monobankToken,
            cardId,
            month ? +month : undefined,
            year ? +year : undefined,
        );

        return response;
    }
}
