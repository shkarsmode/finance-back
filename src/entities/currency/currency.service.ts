import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICurrency } from '../../interfaces/currency.interface';
import { MonobankService } from '../../services/monobank/monobank.service';
import { Currency } from './entities/currency.entity';

@Injectable()
export class CurrencyService {
    constructor(
        private readonly monobankService: MonobankService,
        @InjectRepository(Currency)
        private readonly currencyRepository: Repository<Currency>,
    ) {}

    public async get(): Promise<ICurrency[]> {
        const updateTimeToCheck = new Date().getTime() - 86400000; // 1 day
        const currencies = await this.currencyRepository.find({ 
            order: { updateAt: 'DESC' },
            take: 1
        });

        const currency = currencies[0];

        if (!currency || currency.updateAt < updateTimeToCheck) {
            console.log('[CurrencyService] currency can be updated');
            
            const currencies = await this.monobankService.getActualCurrency();

            const createdCurrency = await this.currencyRepository.create({
                data: currencies,
                updateAt: new Date().getTime()
            });

            return (await this.currencyRepository.save(createdCurrency)).data;
        }

        console.log('[CurrencyService] currency can`t be updated');
        return currency.data;
    }
}
