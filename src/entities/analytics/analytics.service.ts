import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Transaction } from '../transaction/entities/transaction.entity';

type MccTableParams = {
  userId: number;
  from?: string;
  to?: string;
  mccs?: number[];
};

function parseDateOrUnix(input?: string): number | undefined {
  if (!input) return undefined;
  if (/^\d{10,13}$/.test(input)) {
    const n = Number(input);
    return n > 1e12 ? Math.floor(n/1000) : n;
  }
  const d = new Date(input);
  if (isNaN(d.getTime())) throw new BadRequestException('Invalid date: ' + input);
  return Math.floor(d.getTime()/1000);
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  async getMccTable(params: MccTableParams) {
    const fromSec = parseDateOrUnix(params.from);
    const toSec = parseDateOrUnix(params.to);

    const where: any = { user: { id: params.userId } };
    if (fromSec && toSec) where.time = Between(String(fromSec), String(toSec));
    else if (fromSec) where.time = Between(String(fromSec), String(32503680000));
    else if (toSec) where.time = Between('0', String(toSec));

    if (params.mccs && params.mccs.length) where.mcc = In(params.mccs);

    const rows = await this.txRepo.find({
      where,
      relations: ['user'],
      select: [
        'id', 'time', 'description', 'mcc', 'amount', 'operationAmount',
        'currencyCode', 'commissionRate', 'cashbackAmount', 'balance',
        'hold', 'counterName', 'counterIban', 'comment', 'cardId'
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
      const merchant = (r as any).counterName || (r as any).description || '—';

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
        .sort((a,b)=>Math.abs(a[1])<Math.abs(b[1])?1:-1)
        .slice(0,5)
        .map(([name,val])=>({ name, total: Number(val.toFixed(2)) }));
      return {
        mcc: x.mcc,
        txCount: x.txCount,
        totalSpent: Number(x.totalSpent.toFixed(2)),
        totalIncome: Number(x.totalIncome.toFixed(2)),
        net: Number(x.net.toFixed(2)),
        avgAbs: Number(avgAbs.toFixed(2)),
        topMerchants: tops,
      };
    }).sort((a,b)=>a.totalSpent < b.totalSpent ? 1 : -1);

    const totals = rowsOut.reduce((acc, r)=>{
      acc.totalSpent += r.totalSpent;
      acc.totalIncome += r.totalIncome;
      acc.net += r.net;
      acc.txCount += r.txCount;
      return acc;
    }, { totalSpent:0, totalIncome:0, net:0, txCount:0 });

    return { params, totals, rows: rowsOut };
  }
}
