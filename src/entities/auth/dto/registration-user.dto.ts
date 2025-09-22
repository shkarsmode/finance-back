import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegistrationUserDto {
    @MinLength(6, { message: 'Password must be more then 6 symbols' })
    @IsNotEmpty()
    password: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(10, { message: 'Token must be more then 10 symbols' })
    monobankToken: string;
}
