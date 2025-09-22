import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
    providers: [
        AuthService
    ],
    controllers: [AuthController],
    imports: [
        JwtModule.register({
            secret: process.env.PRIVATE_KEY || 'SECRET',
            signOptions: {
                expiresIn: '24h',
            },
        }),
        forwardRef(() => UserModule),
    ],
    exports: [AuthService, JwtModule],
})
export class AuthModule {}
