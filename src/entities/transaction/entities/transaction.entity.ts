import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from '../../user/entities/user.entity';

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn({ name: 'transaction_id' })
    public transactionId: number;

    @Column({ name: 'id', type: 'varchar' })
    public id: string;

    @Column({ name: 'time', type: 'varchar' })
    public time: number;

    @Column({ name: 'description', type: 'varchar', nullable: true })
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

    @Column({ name: 'cashback_amount', type: 'varchar', nullable: true })
    public cashbackAmount: number;

    @Column({ name: 'balance', type: 'varchar' })
    public balance: number;

    @Column({ name: 'hold', type: 'boolean' })
    public hold: boolean;

    @Column({ name: 'receipt_id', type: 'boolean', nullable: true })
    readonly receiptId: string;

    @ManyToOne(() => User, (user) => user.transactions)
    public user: User;
}