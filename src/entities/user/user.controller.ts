import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    public getUsers(): string {
        return 'hello';
    }

    @Get('/:id')
    public async getUserById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<User> {
        const user = await this.userService.getUser(id);
        return user;
    }
}