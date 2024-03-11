
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';


@Controller('auth')
@ApiTags('Authorization')
export class AuthController {
	constructor(
		private authService: AuthService
	) {}

	// @Post('/login')
	// @UseGuards(ThrottlerGuard)
	// async login(@Body() userDto: LoginUserDto) {
	// 	const token = await this.authService.login(userDto);
	// 	return token;
	// }

	// @Post('/recoveryWithEmail')
	// @UseGuards(ThrottlerGuard)
	// async recoveryWithEmail(
	// 	@Body() recoveryDto: RecoveryWithEmailDto
	// ) {
	// 	const message = await this.authService.recoveryWithEmail(recoveryDto);
	// 	return { status: 'ok', message };
	// }

	// @Post('/updatePassword')
	// @UseGuards(ThrottlerGuard)
	// async updatePassword(
	// 	@Body() updatePasswordDto: UpdatePasswordDto,
	// 	@Headers('token') token: string
	// ) {
	// 	const affected = await this.authService.updatePassword(updatePasswordDto, token);
	// 	return { status: 'ok', affected };
	// }

	// @Post('/registration')
	// async registration(@Body() userDto: User) {
	// 	await this.authService.registration(userDto);
	// 	return { status: 'ok', message: 'User created with status Pending' };
	// }

	// @Get('/approve')
	// async approveUserProfile(
	// 	@Query('token') token: string
	// ) {
	// 	const user = await this.authService.activateUserAccount(token);
	// 	return user;
	// }

}
