
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegistrationUserDto } from './dto/registration-user.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) { }

    async login(userDto: LoginUserDto) {
        const user = await this.validateUser(userDto);
        return this.generateToken(user);
    }

    public getUserFieldFromToken(
        token: string,
        field: string,
    ): number | string | null {
        try {
            const decodedToken = this.jwtService.decode(token);
            const value = decodedToken[field];

            if (value) return value;

            return null;
        } catch (err) {
            return null;
        }
    }

    public async registration(
        userDto: RegistrationUserDto,
    ): Promise<{ token: string }> {
        const candidate = await this.userService.getUserByEmail(userDto.email);

        if (candidate) {
            throw new HttpException(
                'User has already been registered',
                HttpStatus.BAD_REQUEST,
            );
        }

        const user = await this.userService.createUser(userDto);
        const token = await this.generateToken(user);
        return token;
    }

    private async generateToken(user: User): Promise<{ token: string }> {
        const payload = {
            id: user.id,
            email: user.email,
            monobankToken: user.monobankToken,
        };

        return {
            token: this.jwtService.sign(payload),
        };
    }

    private async validateUser(userDto: LoginUserDto) {
        const user = await this.userService.getUserByEmail(userDto.email);
        if (!user) {
            throw new HttpException(
                { message: 'Invalid password or username' },
                HttpStatus.NOT_FOUND,
            );
        }

        const passwordEquals = await compare(userDto.password, user.password);

        if (!passwordEquals) {
            throw new HttpException(
                { message: 'Invalid password or username' },
                HttpStatus.NOT_FOUND,
            );
        }

        if (user && passwordEquals) {
            return user;
        }

        throw new UnauthorizedException({
            message: 'Invalid password or username',
        });
    }
}
