import { Transaction } from "src/entities/transaction/entities/transaction.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

    @OneToMany(() => Transaction, (transaction) => transaction.user)
    public transactions: Transaction[];
}