// analytics.dto.ts
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class MonthlyTrendQueryDto {
    @IsString()
    @IsNotEmpty()
    from!: string; // YYYY-MM-DD

    @IsString()
    @IsNotEmpty()
    to!: string;   // YYYY-MM-DD

    @IsIn(['mcc', 'merchant'])
    kind!: 'mcc' | 'merchant';

    @IsString()
    @IsNotEmpty()
    key!: string; // number as string for mcc, plain string for merchant
}
