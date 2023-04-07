import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';
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
  title: string;

  @Column({
    default: '',
  })
  description: string;

  @Column({
    default: '',
  })
  icon: string;

  @ManyToOne(() => User, (user) => user.tournaments, {onDelete: 'CASCADE'})
  user: User

  @OneToMany(() => TournamentEntry, (entry) => entry.tournament)
  entries: TournamentEntry[]
  
}

@Entity()
@Unique(['name', 'tournament'])
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

  @ManyToOne(()=>Tournament, (tournament)=> tournament.entries, {onDelete: 'CASCADE'})
  tournament: Tournament
}