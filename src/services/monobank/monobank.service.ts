import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom, of, tap } from 'rxjs';
import { IAccountInfo, ITransaction } from 'src/interfaces';
import { ICurrency } from '../../interfaces/currency.interface';
import { MONOBANK_API } from '../variables';

@Injectable()
export class MonobankService {
    public lastRequestTime: number = 0;
    public lastRequestTransactionsTime: number = 0;

    constructor(
        private readonly httpService: HttpService,
        @Inject(MONOBANK_API) private monobankApi: string,
    ) {}

    public async getActualCurrency(): Promise<ICurrency[]> {
        const currencyApiUrl = `${this.monobankApi}/bank/currency`;

        const response = await firstValueFrom(
            this.httpService.get<ICurrency[]>(currencyApiUrl).pipe(
                tap(() => (this.lastRequestTime = Date.now())),
                catchError((error: AxiosError) => {
                    console.warn(
                        '[MonobankService] Currency fetch failed:',
                        error.message,
                    );
                    return of({ data: [] as ICurrency[] }); // возвращаем объект с `data`
                }),
            ),
        );

        return response.data;
    }

    public async getClientInfo(monobankToken: string): Promise<IAccountInfo> {
        const url = `${this.monobankApi}/personal/client-info`;

        const response = await firstValueFrom(
            this.httpService
                .get<IAccountInfo>(url, {
                    headers: { 'X-Token': monobankToken },
                })
                .pipe(
                    tap(() => (this.lastRequestTime = Date.now())),
                    catchError((error: AxiosError) => {
                        console.warn(
                            '[MonobankService] Client info fetch failed:',
                            error.message,
                        );
                        return of({ data: null as any }); // либо null, либо кидаем ошибку выше
                    }),
                ),
        );

        return response.data;
    }

    public async getTransactions(
        monobankToken: string,
        cardId: string,
        dateStart: number,
        dateEnd: number,
    ): Promise<{ data: ITransaction[]; status: number }> {
        const url = `${this.monobankApi}/personal/statement/${cardId}/${dateStart}/${dateEnd}`;

        const response = await firstValueFrom(
            this.httpService
                .get(url, {
                    headers: { 'X-Token': monobankToken },
                    timeout: 10000,
                })
                .pipe(
                    // timeout(5000),
                    tap(() => (this.lastRequestTransactionsTime = Date.now())),
                    catchError((error: AxiosError) => {
                        console.warn(
                            '[MonobankService] Transactions fetch failed:',
                            error.message,
                        );
                        return of({ data: [] as ITransaction[], status: 429 });
                    }),
                ),
        );

        return { data: response.data, status: response?.status ?? 200 };
    }
}
