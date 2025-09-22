import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginUserDto {
    @MinLength(6, { message: 'Password must be more then 6 symbols' })
    @IsNotEmpty()
    password: string;

    @IsEmail()
    email: string;
}
