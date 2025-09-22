
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegistrationUserDto } from './dto/registration-user.dto';


@Controller('auth')
@ApiTags('Authorization')
export class AuthController {
	constructor(
		private readonly authService: AuthService
	) {}

	@Post('/login')
	async login(@Body() userDto: LoginUserDto): Promise<{ token: string }> {
		const token = await this.authService.login(userDto);
		return token;
	}

	@Post('/registration')
	async registration(@Body() userDto: RegistrationUserDto): Promise<{ token: string }> {
		const token = await this.authService.registration(userDto);
		return token;
	}
}
