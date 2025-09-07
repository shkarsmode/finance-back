import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './entities/auth/auth.module';
import { CurrencyModule } from './entities/currency/currency.module';
import { Currency } from './entities/currency/entities/currency.entity';
import { Transaction } from './entities/transaction/entities/transaction.entity';
import { TransactionModule } from './entities/transaction/transaction.module';
import { User } from './entities/user/entities/user.entity';
import { UserModule } from './entities/user/user.module';
import { AnalyticsModule } from './entities/analytics/analytics.module';


@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `environments/.env`,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('POSTGRES_HOST'),
                port: Number(configService.get<number>('POSTGRES_PORT')),
                password: configService.get<string>('POSTGRES_PASSWORD'),
                username: configService.get<string>('POSTGRES_USER'),
                database: configService.get<string>('POSTGRES_DATABASE'),
                synchronize: true,
                entities: [User, Transaction, Currency],
                extra: {
                    ssl: {
                        rejectUnauthorized: false,
                    },
                },
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
