import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AnalyticsModule } from './entities/analytics/analytics.module';
import { AuthModule } from './entities/auth/auth.module';
import { CurrencyModule } from './entities/currency/currency.module';
import { Currency } from './entities/currency/entities/currency.entity';
import { Transaction } from './entities/transaction/entities/transaction.entity';
import { TransactionModule } from './entities/transaction/transaction.module';
import { User } from './entities/user/entities/user.entity';
import { UserModule } from './entities/user/user.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `environments/.env`,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.get<string>('POSTGRES_HOST'),
                port: Number(config.get<number>('POSTGRES_PORT')),
                username: config.get<string>('POSTGRES_USER'),
                password: config.get<string>('POSTGRES_PASSWORD'),
                database: config.get<string>('POSTGRES_DATABASE'),
                synchronize: true, // ok для dev
                entities: [User, Transaction, Currency],
                ssl: config.get<string>('DB_SSL') === 'true'
                    ? { rejectUnauthorized: false }
                    : false,
            }),
            inject: [ConfigService],
        }),
        UserModule,
        TransactionModule,
        AuthModule,
        CurrencyModule,
        AnalyticsModule,
    ],
    controllers: [AppController],
    providers: [],
})
export class AppModule {}
