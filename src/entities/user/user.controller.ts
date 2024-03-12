import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService
    ) {}

    @Get('/my')
    public async getUserData(
        @Headers('authorization') authorization: string,
    ): Promise<any> {
        const token = authorization.split(' ')[1];
        const userId = 
            this.authService.getUserFieldFromToken(token, 'id') as number;
        const monobankToken = 
            this.authService.getUserFieldFromToken(token, 'monobankToken') as string;

        const user = await this.userService.getClientInfo(userId, monobankToken);
        return user;
    }

    // @Get('/:id')
    // public async getUserById(
    //     @Param('id', ParseIntPipe) id: number,
    // ): Promise<User> {
    //     const user = await this.userService.getUser(id);
    //     return user;
    // }
}
