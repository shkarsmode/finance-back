import { Controller, Get } from '@nestjs/common';
import { ICurrency } from '../../interfaces/currency.interface';
import { CurrencyService } from './currency.service';

@Controller('currency')
export class CurrencyController {
    constructor(private readonly currencyService: CurrencyService) {}

    @Get()
    public async get(): Promise<ICurrency[]> {
        return await this.currencyService.get();
    }
}
