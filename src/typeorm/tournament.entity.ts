import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Tournament {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'tournament_id',
  })
  id: number;

  @Column({
    nullable: false,
    default: '',
  })
  name: string;

  @Column({
    nullable: false
  })
  user_id: number;

  @ManyToOne(()=>User, (User)=> User.id, { cascade: true })
  @JoinColumn({name: 'user_id', referencedColumnName: 'id'})
  user: User
  
}
