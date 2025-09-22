import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonobankModule } from 'src/services/monobank/monobank.module';
import { AuthModule } from '../auth/auth.module';
import { User } from '../user/entities/user.entity';
import { Transaction } from './entities/transaction.entity';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

@Module({
    controllers: [TransactionController],
    providers: [TransactionService],
    imports: [
        TypeOrmModule.forFeature([Transaction, User]),
        MonobankModule,
        AuthModule,
    ],
})
export class TransactionModule {}
