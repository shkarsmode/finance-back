import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { ICurrency } from '../../interfaces/currency.interface';
import { MONOBANK_API } from '../variables';

@Injectable()
export class MonobankService {
    constructor(
        private readonly httpService: HttpService,
        @Inject(MONOBANK_API) private monobankApi: string,
    ) {}

    public async getActualCurrency(): Promise<ICurrency[]> {
        const currencyApiUrl = `${this.monobankApi}/bank/currency`;

        const { data } = await firstValueFrom(
            this.httpService.get<ICurrency[]>(currencyApiUrl).pipe(
                catchError((error: AxiosError) => {
                    throw 'Too much requests to get currency!';
                })
            )
        );

        return data;
    }
}
