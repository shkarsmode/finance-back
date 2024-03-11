import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { UserModule } from './entities/user/user.module';

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
                entities: [__dirname + '***.entity{.js, .ts}'],
                extra: {
                    ssl: {
                        rejectUnauthorized: false,
                    },
                },
            }),
            inject: [ConfigService],
        }),
        UserModule,
    ],
    controllers: [AppController],
    providers: [],
})
export class AppModule {}
