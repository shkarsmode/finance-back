import { User } from "src/entities/user/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ name: 'time', type: 'varchar' })
    public time: number;

    @Column({ name: 'description', type: 'varchar' })
    public description: string;

    @Column({ name: 'mcc', type: 'varchar' })
    public mcc: number;

    @Column({ name: 'originalMcc', type: 'varchar' })
    public originalMcc: number;

    @Column({ name: 'amount', type: 'varchar' })
    public amount: number;

    @Column({ name: 'operation_amount', type: 'varchar' })
    public operationAmount: number;

    @Column({ name: 'currency_code', type: 'varchar' })
    public currencyCode: number;

    @Column({ name: 'commission_rate', type: 'varchar' })
    public commissionRate: number;

    @Column({ name: 'cashback_amount', type: 'varchar' })
    public cashbackAmount: number;

    @Column({ name: 'balance', type: 'varchar' })
    public balance: number;

    @Column({ name: 'hold', type: 'boolean' })
    public hold: boolean;

    @Column({ name: 'receipt_id', type: 'boolean' })
    readonly receiptId: string;

    @ManyToOne(() => User, (user) => user.transactions)
    public user: User;
}