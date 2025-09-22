import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, In, Repository } from 'typeorm';
import { Transaction } from '../transaction/entities/transaction.entity';
import { MonthlyTrendQueryDto } from './dto/analytics.dto';

type MccTableParams = {
    userId: number;
    from?: string;
    to?: string;
    mccs?: number[];
};

const MERCHANT_TEXT_COL = 'description'; 

function parseDateOrUnix(input?: string): number | undefined {
    if (!input) return undefined;
    if (/^\d{10,13}$/.test(input)) {
        const n = Number(input);
        return n > 1e12 ? Math.floor(n / 1000) : n;
    }
    const d = new Date(input);
    if (isNaN(d.getTime())) throw new BadRequestException('Invalid date: ' + input);
    return Math.floor(d.getTime() / 1000);
}

export interface MonthlyPoint {
    year: number;
    month: number;
    income: number;   // positive abs sum of incoming
    expense: number;  // positive abs sum of outgoing
    tx: number;
}

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Transaction)
        private readonly txRepo: Repository<Transaction>,
        private readonly ds: DataSource
    ) { }

    isIsoDate(s?: string) {
        return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
    }
    toStartOfDayUtc(iso: string) {
        const [y, m, d] = iso.split('-').map(Number);
        return Math.floor(Date.UTC(y, m - 1, d, 0, 0, 0) / 1000);
    }
    toEndOfDayUtc(iso: string) {
        const [y, m, d] = iso.split('-').map(Number);
        return Math.floor(Date.UTC(y, m - 1, d, 23, 59, 59) / 1000);
    }

    async getMccTable(params: MccTableParams) {
        // ✅ корректный диапазон (ISO → весь день)
        const fromSec = this.isIsoDate(params.from)
            ? this.toStartOfDayUtc(params.from!)
            : parseDateOrUnix(params.from);

        const toSec = this.isIsoDate(params.to)
            ? this.toEndOfDayUtc(params.to!)
            : parseDateOrUnix(params.to);

        const where: any = { user: { id: params.userId } };

        if (fromSec && toSec) where.time = Between(String(fromSec), String(toSec));
        else if (fromSec) where.time = Between(String(fromSec), String(32503680000));
        else if (toSec) where.time = Between('0', String(toSec));

        if (params.mccs?.length) where.mcc = In(params.mccs);

        // ✅ только гривна; колонка text → сравниваем строкой
        where.currencyCode = '980';

        const rows = await this.txRepo.find({
            where,
            relations: ['user'],
            select: [
                'id', 'time', 'description', 'mcc',
                'amount', 'operationAmount', 'currencyCode',
                'commissionRate', 'cashbackAmount', 'balance',
                'hold', 'comment', 'cardId'
            ] as any,
            order: { time: 'DESC' } as any,
        });

        const byMcc: Record<number, {
            mcc: number;
            txCount: number;
            totalSpent: number;
            totalIncome: number;
            net: number;
            avgAbs: number;
            topMerchants: Record<string, number>;
        }> = {};

        for (const r of rows) {
            const mcc = Number((r as any).mcc) || 0;
            const amount = Number((r as any).amount) / 100;

            // ✅ merchant без counterName (его нет в сущности)
            const merchant = (r as any).description || (r as any).comment || '—';

            if (!byMcc[mcc]) {
                byMcc[mcc] = { mcc, txCount: 0, totalSpent: 0, totalIncome: 0, net: 0, avgAbs: 0, topMerchants: {} };
            }
            byMcc[mcc].txCount += 1;
            byMcc[mcc].net += amount;
            if (amount < 0) byMcc[mcc].totalSpent += amount;
            else byMcc[mcc].totalIncome += amount;

            byMcc[mcc].topMerchants[merchant] = (byMcc[mcc].topMerchants[merchant] || 0) + amount;
        }

        const rowsOut = Object.values(byMcc).map(x => {
            const avgAbs = x.txCount ? (Math.abs(x.totalSpent) + x.totalIncome) / x.txCount : 0;
            const tops = Object.entries(x.topMerchants)
                .sort((a, b) => Math.abs(a[1]) < Math.abs(b[1]) ? 1 : -1)
                .slice(0, 5)
                .map(([name, val]) => ({ name, total: Number(val.toFixed(2)) }));
            return {
                mcc: x.mcc,
                txCount: x.txCount,
                totalSpent: Number(x.totalSpent.toFixed(2)),
                totalIncome: Number(x.totalIncome.toFixed(2)),
                net: Number(x.net.toFixed(2)),
                avgAbs: Number(avgAbs.toFixed(2)),
                topMerchants: tops,
            };
        }).sort((a, b) => a.totalSpent < b.totalSpent ? 1 : -1);

        const totals = rowsOut.reduce((acc, r) => ({
            totalSpent: acc.totalSpent + r.totalSpent,
            totalIncome: acc.totalIncome + r.totalIncome,
            net: acc.net + r.net,
            txCount: acc.txCount + r.txCount,
        }), { totalSpent: 0, totalIncome: 0, net: 0, txCount: 0 });

        return { params, totals, rows: rowsOut };
    }

    private fillMonthGaps(fromISO: string, toISO: string, points: MonthlyPoint[]): MonthlyPoint[] {
        const byKey = new Map<string, MonthlyPoint>();
        for (const p of points) byKey.set(`${p.year}-${p.month}`, p);

        const fromDate = new Date(fromISO + 'T00:00:00.000Z');
        const toDate = new Date(toISO + 'T00:00:00.000Z');

        const res: MonthlyPoint[] = [];
        let y = fromDate.getUTCFullYear();
        let m = fromDate.getUTCMonth() + 1;
        const endY = toDate.getUTCFullYear();
        const endM = toDate.getUTCMonth() + 1;

        while (y < endY || (y === endY && m <= endM)) {
            const key = `${y}-${m}`;
            res.push(byKey.get(key) ?? { year: y, month: m, income: 0, expense: 0, tx: 0 });
            m++; if (m > 12) { m = 1; y++; }
        }
        return res;
    }

    /**
     * Returns MonthlyPoint[] grouped by (year, month).
     * IMPORTANT: set the column names below to match your DB exactly.
     */
    async getMonthlyTrend(userId: number, q: MonthlyTrendQueryDto): Promise<MonthlyPoint[]> {
        // ---- 🔧 COLUMN MAP (set once, then forget) ----
        // If your columns are camelCase created with quotes, KEEP the double quotes here.
        const TABLE = 'transactions';           // or, for quoted: '"transactions"'
        const COL_USER_ID = '"userId"';         // e.g. '"userId"'  | or 'user_id'
        const COL_TIME = '"time"';              // text/varchar seconds since epoch (quote if named "time")
        const COL_AMOUNT = '"amount"';          // varchar/numeric
        const COL_MCC = '"mcc"';                // varchar/int
        const COL_MERCHANT_TXT = '"description"'; // set to your real text column with merchant/counterparty name
        // ------------------------------------------------

        const isMcc = q.kind === 'mcc';
        const targetValue = String(q.key);

        // Inclusive [from..to], implement as [from, to+1d)
        const fromISO = new Date(q.from + 'T00:00:00.000Z').toISOString();
        const toDate = new Date(q.to + 'T00:00:00.000Z');
        const toNext = new Date(toDate.getTime() + 24 * 3600 * 1000).toISOString();

        // Build target filter (string-literal injected for identifier, NOT a param)
        const byTarget = isMcc
            ? `AND NULLIF(t.${COL_MCC}, '') = $4`
            : `AND NULLIF(t.${COL_MERCHANT_TXT}, '') = $4`;

        // Full SQL with explicit casts. All identifiers are injected from whitelisted constants above.
        const sql = `
            WITH src AS (
                SELECT
                    date_trunc('month', to_timestamp(NULLIF(t.${COL_TIME}, '')::bigint)) AS month_ts,
                    COALESCE(NULLIF(t.${COL_AMOUNT}, '')::numeric, 0) AS amount_num
                FROM ${TABLE} t
                WHERE
                    t.${COL_USER_ID} = $1
                    AND to_timestamp(NULLIF(t.${COL_TIME}, '')::bigint) >= $2::timestamptz
                    AND to_timestamp(NULLIF(t.${COL_TIME}, '')::bigint) <  $3::timestamptz
                    ${byTarget}
            )
            SELECT
                EXTRACT(YEAR  FROM month_ts)::int AS year,
                EXTRACT(MONTH FROM month_ts)::int AS month,
                COALESCE(SUM(CASE WHEN amount_num > 0 THEN amount_num ELSE 0 END), 0)::numeric AS income_raw,
                COALESCE(SUM(CASE WHEN amount_num < 0 THEN -amount_num ELSE 0 END), 0)::numeric AS expense_raw,
                COUNT(*)::int AS tx
            FROM src
            GROUP BY 1, 2
            ORDER BY 1, 2;
        `;

        const rows = await this.ds.query(sql, [
            userId,     // $1
            fromISO,    // $2
            toNext,     // $3
            targetValue // $4
        ]);

        const points: MonthlyPoint[] = rows.map((r: any) => ({
            year: Number(r.year),
            month: Number(r.month),
            income: Number(r.income_raw),
            expense: Number(r.expense_raw),
            tx: Number(r.tx),
        }));

        return this.fillMonthGaps(q.from, q.to, points);
    }
}
