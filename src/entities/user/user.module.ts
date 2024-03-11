import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    providers: [UserService],
    controllers: [UserController],
    imports: [
        TypeOrmModule.forFeature([ User ])
    ],
})
export class UserModule {}
