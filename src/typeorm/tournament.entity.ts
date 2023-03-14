import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';
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

@Entity()
@Unique(['name', 'tournament_id'])
export class TournamentEntry {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'tournament_entry_id',
  })
  id: number;

  @Column({
      nullable: false,
      default: '',
  })
  name: string;

  @Column({
      nullable: true,
      default: '',
  })
  link: string;

  @Column({
      nullable: false
  })
  tournament_id: number;

  @ManyToOne(()=>Tournament, (Tournament)=> Tournament.id, { cascade: true })
  @JoinColumn({name: 'tournament_id', referencedColumnName: 'id'})
  tournament: Tournament
}