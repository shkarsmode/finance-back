import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { IAccountInfo } from "../../../interfaces/account-info.interface";
import { Transaction } from '../../transaction/entities/transaction.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ name: 'email', type: 'varchar', nullable: true })
    public email: string;

    @Column({ name: 'password', type: 'varchar', nullable: true })
    public password: string;

    @Column({ name: 'monobankToken', type: 'varchar' })
    public monobankToken: string;

    @Column({ name: 'categoryGroups', type: 'json', nullable: true })
    public categoryGroups: any;

    @Column({ name: 'client_info', type: 'json', nullable: true })
    public clientInfo: IAccountInfo;

    @OneToMany(() => Transaction, (transaction) => transaction.user)
    public transactions: Transaction[];
}