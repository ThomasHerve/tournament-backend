import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Tournament } from './tournament.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'user_id',
  })
  id: number;

  @Column({
    nullable: false,
    default: '',
  })
  username: string;

  @Column({
    name: 'email_address',
    nullable: false,
    default: '',
  })
  email: string;

  @Column({
    nullable: false,
    default: '',
  })
  password: string;

  @Column({
    nullable: false,
    default: false,
  })
  admin: boolean;

  @OneToMany(() => Tournament, (tournament) => tournament.user)
  tournaments: Tournament[]
}
