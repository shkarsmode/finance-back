import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonobankModule } from 'src/services/monobank/monobank.module';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    providers: [UserService, AuthService],
    controllers: [UserController],
    imports: [
        TypeOrmModule.forFeature([User]),
        forwardRef(() => AuthModule),
        MonobankModule,
    ],
    exports: [UserService],
})
export class UserModule {}
