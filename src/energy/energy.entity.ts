import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('energy_records')
@Unique(['period', 'respondent', 'type'])
export class EnergyRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  period!: string;

  @Column()
  @Index()
  respondent!: string;

  @Column()
  respondentName!: string;

  @Column()
  type!: string;

  @Column()
  typeDescription!: string;

  @Column({ type: 'float' })
  value!: number;

  @Column()
  unit!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
