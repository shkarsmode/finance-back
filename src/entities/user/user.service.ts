import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { genSalt, hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { MonobankService } from '../../services/monobank/monobank.service';
import { RegistrationUserDto } from '../auth/dto/registration-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly monobankService: MonobankService
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
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new HttpException(
                { message: 'User hasn`n been found' },
                HttpStatus.NOT_FOUND,
            );
        }

        return user;
    }

    public async getClientInfo(id: number, monobankToken: string) {
        if (!id || !monobankToken) {
            throw new HttpException(
                { message: 'Id or monobank token wasn`t found' },
                HttpStatus.NOT_FOUND,
            );
        }

        const updateTimeToCheck = new Date().getTime() - 60000;
        const user = await this.userRepository.findOne({ where: { id } });

        const clientInfo = user.clientInfo;

        if (!clientInfo || this.monobankService.lastRequestTime < updateTimeToCheck) {
            console.log('[UserService] client info can be updated');

            const clientInfo =
                await this.monobankService.getClientInfo(monobankToken);

            const updatedUserClientInfo = await this.userRepository.update(
                user.id,
                {
                    ...user,
                    clientInfo,
                },
            );

            console.log('[UserService] affected', updatedUserClientInfo.affected);
            return clientInfo;
        }

        console.log('[UserService] client info can`t be updated');
        return user.clientInfo;
    }
}
