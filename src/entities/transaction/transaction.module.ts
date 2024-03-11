import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

@Module({
    controllers: [TransactionController],
    providers: [TransactionService],
    imports: [
        TypeOrmModule.forFeature([ Transaction ])
    ]
})
export class TransactionModule {}
