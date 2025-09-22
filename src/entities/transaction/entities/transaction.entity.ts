import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from '../../user/entities/user.entity';

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn({ name: 'transaction_id' })
    public transactionId: number;

    @Column({ name: 'id', type: 'varchar' })
    public id: string;

    @Column({ name: 'time', type: 'varchar' })
    public time: string;

    @Column({ name: 'description', type: 'varchar', nullable: true })
    public description: string;

    @Column({ name: 'mcc', type: 'varchar' })
    public mcc: string;

    @Column({ name: 'originalMcc', type: 'varchar' })
    public originalMcc: string;

    @Column({ name: 'amount', type: 'varchar' })
    public amount: string;

    @Column({ name: 'operation_amount', type: 'varchar' })
    public operationAmount: string;

    @Column({ name: 'currency_code', type: 'varchar' })
    public currencyCode: string;

    @Column({ name: 'commission_rate', type: 'varchar' })
    public commissionRate: string;

    @Column({ name: 'cashback_amount', type: 'varchar', nullable: true })
    public cashbackAmount: string;

    @Column({ name: 'balance', type: 'varchar' })
    public balance: string;

    @Column({ name: 'hold', type: 'boolean' })
    public hold: boolean;

    @Column({ name: 'receipt_id', type: 'varchar', nullable: true })
    public receiptId: string;

    @Column({ name: 'card_id', type: 'varchar', nullable: true })
    public cardId: string;

    @Column({ name: 'comment', type: 'varchar', nullable: true })
    public comment: string;

    @ManyToOne(() => User, (user) => user.transactions)
    public user: User;
}