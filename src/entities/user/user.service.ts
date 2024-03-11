import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { genSalt, hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { RegistrationUserDto } from '../auth/dto/registration-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    public async getUserByEmail(email: string): Promise<any> {
        const user = await this.userRepository.findOne({ where: { email } });

        return user;
    }

    public async createUser(user: RegistrationUserDto): Promise<User> {
        const isUserExists = Boolean(await this.getUserByEmail(user.email));

        if (isUserExists) {
            throw new HttpException(
                { message: 'User has already been created' },
                HttpStatus.CONFLICT,
            );
        }

        const salt = await genSalt(10);
        const hashedPasword = await hash(user.password, salt);

        const createdUser = await this.userRepository.create({
            ...user,
            password: hashedPasword,
        });

        await this.userRepository.save(createdUser);

        delete createdUser.password;

        return createdUser;
    }

    public async getUser(id: number) {
        const salt = await genSalt(10);
        const hashedPasword = await hash('monobanktoken', salt);

        // const user = await this.userRepository.create({
        //     username: 'Test user',
        //     monobankHashedToken: hashedPasword,
        //     password: 'password'
        // });
        // await this.userRepository.save(user);
        // console.log(user)
        // return {user};
    }
}
