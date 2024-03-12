import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom, tap } from 'rxjs';
import { IAccountInfo, ITransaction } from 'src/interfaces';
import { ICurrency } from '../../interfaces/currency.interface';
import { MONOBANK_API } from '../variables';

@Injectable()
export class MonobankService {
    public lastRequestTime: number;

    constructor(
        private readonly httpService: HttpService,
        @Inject(MONOBANK_API) private monobankApi: string,
    ) {}

    public async getActualCurrency(): Promise<ICurrency[]> {
        const currencyApiUrl = `${this.monobankApi}/bank/currency`;

        const { data } = await firstValueFrom(
            this.httpService.get<ICurrency[]>(currencyApiUrl).pipe(
                tap(() => (this.lastRequestTime = new Date().getTime())),
                catchError((error: AxiosError) => {
                    throw 'Too much requests to get currency!';
                }),
            ),
        );

        return data;
    }

    public async getClientInfo(monobankToken: string): Promise<IAccountInfo> {
        const currencyApiUrl = `${this.monobankApi}/personal/client-info`;

        const { data } = await firstValueFrom(
            this.httpService
                .get<IAccountInfo>(currencyApiUrl, {
                    headers: { 'X-Token': monobankToken },
                })
                .pipe(
                    tap(() => (this.lastRequestTime = new Date().getTime())),
                    catchError((error: AxiosError) => {
                        throw 'Too much requests to get currency!';
                    }),
                ),
        );

        return data;
    }

    public async getTransactions(
        monobankToken: string,
        cardId: string,
        dateStart: number, 
        dateEnd: number
    ): Promise<ITransaction[]> {
        const transactionsApiUrl = 
            `${this.monobankApi}/personal/statement/${cardId}/${dateStart}/${dateEnd}`;

        const { data } = await firstValueFrom(
            this.httpService
                .get<ITransaction[]>(transactionsApiUrl, {
                    headers: { 'X-Token': monobankToken },
                })
                .pipe(
                    tap(() => (this.lastRequestTime = new Date().getTime())),
                    catchError((error: AxiosError) => {
                        throw 'Too much requests to get currency!';
                    }),
                ),
        );

        return data;
    }
}
