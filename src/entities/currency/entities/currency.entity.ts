import { ICurrency } from "src/interfaces";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('currencies')
export class Currency {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ name: 'data', type: 'json', nullable: true })
    public data: ICurrency[];

    @Column({ name: 'updated_at', type: 'varchar', nullable: true })
    public updateAt: number;
}