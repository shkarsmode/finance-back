import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {

    @Get()
    public async getHello(): Promise<string> {
        return 'A finance application works! Really';
    }
}

