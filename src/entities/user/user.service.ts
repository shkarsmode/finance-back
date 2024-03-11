import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { genSalt, hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    public async getUser(id: number): Promise<User> {
        const salt = await genSalt(10);
        const hashedPasword = await hash('monobanktoken', salt);

        const user = await this.userRepository.create({
            username: 'Test user',
            monobankHashedToken: hashedPasword,
            password: 'password'
        });
        await this.userRepository.save(user);
        console.log(user)
        return user;
    }
}
