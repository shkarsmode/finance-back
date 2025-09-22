// analytics.controller.ts
import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService, MonthlyPoint } from './analytics.service';
import { MonthlyTrendQueryDto } from './dto/analytics.dto';

@Controller('analytics')
export class AnalyticsController {
    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly authService: AuthService,
    ) {}

    /**
     * GET /analytics/mcc-table?from=2024-01-01&to=2025-09-07&mcc=5411,5499
     */
    @Get('mcc-table')
    @UseGuards(JwtAuthGuard)
    async getMccTable(
        @Query('from') from: string,
        @Query('to') to: string,
        @Query('mcc') mccList: string | undefined,
        @Headers('authorization') authorization: string,
    ) {
        const token = authorization.split(' ')[1];
        const userId = +(this.authService.getUserFieldFromToken(token, 'id') as number);

        const mccs = mccList
            ? mccList.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
            : undefined;

        return this.analyticsService.getMccTable({ userId, from, to, mccs });
    }

    /**
     * GET /analytics/monthly-trend?from=2024-01-01&to=2025-09-01&kind=mcc&key=5411
     * Returns array of MonthlyPoint grouped on DB side (single query).
     */
    @Get('monthly-trend')
    @UseGuards(JwtAuthGuard)
    async getMonthlyTrend(
        @Query() query: MonthlyTrendQueryDto,
        @Headers('authorization') authorization: string,
    ): Promise<MonthlyPoint[]> {
        const token = authorization.split(' ')[1];
        const userId = +(this.authService.getUserFieldFromToken(token, 'id') as number);
        return this.analyticsService.getMonthlyTrend(userId, query);
    }
}
