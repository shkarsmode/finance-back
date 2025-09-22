import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { environment } from '../../environments/environment';
import { MONOBANK_API } from '../variables';
import { MonobankService } from './monobank.service';

@Module({
    imports: [HttpModule],
    providers: [
        MonobankService,
        {
            provide: MONOBANK_API,
            useValue: environment.monobankApi,
        },
    ],
    exports: [
        MonobankService
    ]
})
export class MonobankModule {}
