
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {

	// private recoverySecret = 'WONDR_LINK_RECOVERY_SECRET';

	// constructor(
	// 	private userService: UserService,
	// 	private jwtService: JwtService,
	// 	private mailService: MailService
	// ) {}

	// async login(userDto: LoginUserDto) {
	// 	const user = await this.validateUser(userDto);
	// 	return this.generateToken(user);
	// }

	// public getUserFieldFromToken(token: string, field: string): number | StatusEnum | null  {
	// 	try {
	// 		const decodedToken = this.jwtService.decode(token);
	// 		const value = decodedToken[field];

	// 		if (value) return value;

	// 		return null;
	// 	} catch (err) {
	// 		return null;
	// 	}
	// }

	// async activateUserAccount(token: string): Promise<User> {
	// 	const id = this.getUserFieldFromToken(token, 'id') as number;
	// 	const status = this.getUserFieldFromToken(token, 'status') as StatusEnum;

	// 	if (status === StatusEnum.Approved) {
	// 		throw new HttpException(
	// 			'The User`s account has already been approved', 
	// 			HttpStatus.CONFLICT
	// 		);
	// 	}

	// 	if (!id) {
	// 		throw new HttpException(
	// 			'The user wasn`t found', 
	// 			HttpStatus.NOT_FOUND
	// 		);
	// 	}

	// 	const candidate = await this.userService.getUser(id);
	// 	if (!candidate) {
	// 		throw new HttpException(
	// 			'The user wasn`t found', 
	// 			HttpStatus.NOT_FOUND
	// 		);
	// 	}

	// 	if (candidate.status !== StatusEnum.Approved) {
	// 		candidate.status = StatusEnum.Approved;
	// 		await this.userService.updateUserById(candidate, id);
	// 	}

    //     this.mailService.sendApprovedEmailInfo(candidate);

	// 	return candidate;
	// }

	// public async updatePassword(
	// 	updatePasswordDto: UpdatePasswordDto, 
	// 	token: string
	// ): Promise<number> {
	// 	const payload = await this.verifyRecoveryToken(token);
	// 	const email = payload.email;
	// 	const password = updatePasswordDto.password;

	// 	if (!email) {
	// 		throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
	// 	}

	// 	const user = await this.userService.getUserByEmail(email);

	// 	if (!user) {
	// 		throw new HttpException('User has not been found by email', HttpStatus.NOT_FOUND);
	// 	}

	// 	const affected = await this.userService.updateUserPassword(password, user.id);

	// 	return affected;
	// }

	// public async recoveryWithEmail(
	// 	recoveryDto: RecoveryWithEmailDto
	// ): Promise<any> {
	// 	const email = recoveryDto.email;
	// 	const user = await this.userService.getUserByEmail(email);

	// 	if (!user) {
	// 		throw new HttpException('User has not been found by email', HttpStatus.NOT_FOUND);
	// 	}

	// 	if (user.status !== StatusEnum.Approved) {
	// 		throw new HttpException('User has not been approved', HttpStatus.NOT_FOUND);
	// 	}

	// 	const approvalToken = await this.generateTokenForRecovery(user);

	// 	await this.mailService.sendRecoveryEmail(
	// 		user.email, approvalToken.token
	// 	);

	// 	return `Message to email ${user.email} was sent successfully`;
	// }

	// async registration(userDto: User) {
	// 	const candidate = await this.userService.getUserByEmail(userDto.email);
	// 	if (candidate) {
	// 		throw new HttpException('User has already been registered', HttpStatus.BAD_REQUEST);
	// 	}

	// 	userDto.role = RoleEnum.USER;
	// 	userDto.status = StatusEnum.Pending;

	// 	const user = await this.userService.createUser(userDto);
	// 	const approvalToken = await this.generateToken(user);
	// 	const typeOfUser = user.type;

	// 	await this.mailService.sendEmailForInfoEmail(typeOfUser, userDto);
		
	// 	return this.mailService.sendEmail(
	// 		userDto.email, 
	// 		typeOfUser,
	// 		userDto, 
	// 		approvalToken.token
	// 	);
	// }

	// private async generateToken(user: User): Promise<{ token: string }> {
	// 	const payload = { email: user.email, id: user.id, role: user.role, status: user.status};
	// 	return {
	// 		token: this.jwtService.sign(payload)
	// 	}
	// }

	// private async generateTokenForRecovery(user: User): Promise<{ token: string }> {
	// 	const payload = { email: user.email, id: user.id, role: user.role, status: user.status};
	// 	return {
	// 		token: jwt.sign(payload, this.recoverySecret, { expiresIn: '10m' })
	// 	}
	// }

	// private async verifyRecoveryToken(token: string): Promise<any> {
	// 	try {
	// 		const secret = this.recoverySecret;
	// 		const payload = await this.jwtService.verifyAsync(token, { secret });
	// 		return payload;
	// 	} catch (error) {
	// 		throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
	// 	}
	// }

	// private async validateUser(userDto: LoginUserDto) {
	// 	const user = await this.userService.getUserByEmail(userDto.email);
	// 	if (!user) {
	// 		throw new HttpException(
	// 			{ message: 'Invalid password or username' }, 
	// 			HttpStatus.NOT_FOUND
	// 		);
	// 	}

	// 	if (user.status === StatusEnum.Pending) {
	// 		throw new HttpException(
	// 			{ message: 'The user has not activated an account yet' }, 
	// 			HttpStatus.NOT_FOUND
	// 		);
	// 	} 

	// 	const passwordEquals = await compare(userDto.password, user.password);

	// 	if (!passwordEquals) {
	// 		throw new HttpException(
	// 			{ message: 'Invalid password or username' }, 
	// 			HttpStatus.NOT_FOUND
	// 		);
	// 	}

	// 	if (user && passwordEquals) {
	// 		return user;
	// 	}
		
	// 	throw new UnauthorizedException({ message: 'Invalid password or username'});
	// }
}
