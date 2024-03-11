import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    public id: number;
    
    @Column({ name: 'username', type: 'varchar' })
    public username: string;

    @Column({ name: 'password', type: 'varchar' })
    public password: string;

    @Column({ name: 'monobank_hashed_token', type: 'varchar' })
    public monobankHashedToken: string;

    // @OneToMany(() => Transaction, (transaction) => transaction.user)
    // transactions: Transaction[];
}