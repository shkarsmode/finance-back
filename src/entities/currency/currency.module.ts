import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonobankModule } from '../../services/monobank/monobank.module';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { Currency } from './entities/currency.entity';

@Module({
    providers: [CurrencyService],
    controllers: [CurrencyController],
    imports: [TypeOrmModule.forFeature([Currency]), MonobankModule],
})
export class CurrencyModule {}
