import { Body, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm';
import { Repository } from 'typeorm';
import { Tournament, TournamentEntry } from 'src/typeorm/tournament.entity';
import { UsersService } from 'src/users/services/users/users.service';
import { CreateTournamentDto, DeleteTournamentDto, TournamentEntries } from 'src/tournament/dto/tournament.dtos';

@Injectable()
export class TournamentService {
    constructor(
        @InjectRepository(Tournament) private readonly tournamentRepository: Repository<Tournament>,
        @InjectRepository(TournamentEntry) private readonly tournamentEntriesRepository: Repository<TournamentEntry>,
        private readonly userService: UsersService
      ) {}
    
    // Public
    async getAllTournaments() {
        return await this.tournamentRepository.find({
            select: [
                "name", "id"
            ]
        })
    }

    async getAllTournamentsFiltered(filter: string) {
        const tournaments = await this.tournamentRepository.find({
            select: [
                "name", "id"
            ]
        })
        return tournaments.filter((element)=>{
            return element.name.includes(filter)
        })
    }

    async getTournamentEntries(id: number) {
        const tournament = await this.tournamentRepository.findOne({
            where: {
                id
            }
        });
        if(tournament) {
            return await this.tournamentEntriesRepository.find({
                where: {
                    tournament: tournament
                }, select: ["name", "link"]
            })
        }
        throw new HttpException("Tournament doesn't exist", HttpStatus.FORBIDDEN)
    }

    // With auth 
    async getTournaments(username: string){
        const user: User = await this.userService.getUser(username)
        return this.tournamentRepository.find({
            where: {
                user: user
            }, select: [
                "name", "id"
            ]
        })
    }

    async createTournament(@Body() createTournamentDto: CreateTournamentDto, username: string) {
        const user: User = await this.userService.getUser(username)
        const name = createTournamentDto.name
        const tournament = await this.tournamentRepository.findOne({
            where: {
                name: name,
                user: user
            }
        });
        if(!tournament){
            const newTournament = this.tournamentRepository.create({
                name: name,
                user_id: user.id,
                user: user
            });
            const tournament = await this.tournamentRepository.save(newTournament);
            return {"name": tournament.name, "id": tournament.id}
        }
        throw new HttpException('Tournament already exist', HttpStatus.CONFLICT)
    }

    async deleteTournament(@Body() deleteTournamentDto: DeleteTournamentDto, username: string) {
        const user: User = await this.userService.getUser(username)
        const id = deleteTournamentDto.id
        const tournament = await this.tournamentRepository.findOne({
            where: {
                id: id,
                user: user
            }
        });
        if(tournament){
            return this.tournamentRepository.delete(tournament);
        }
        throw new HttpException("Tournament doesn't exist", HttpStatus.FORBIDDEN)
    }

    // Tournament entries
    async insertTournamentEntries(@Body() tournamentEntries:TournamentEntries, username: string, tournament_id: number) {
        const user: User = await this.userService.getUser(username)
        const tournament = await this.tournamentRepository.findOne({
            where: {
                id: tournament_id,
                user: user
            }
        });
        if(tournament){
            const entries = []
            tournamentEntries.entries.forEach(element => {
                const entry = this.tournamentEntriesRepository.create({
                    tournament: tournament,
                    tournament_id: tournament_id,
                    name: element.name,
                    link: element.link
                })
                this.tournamentEntriesRepository.save(entry);
                entries.push({
                    "name": entry.name,
                    "link": entry.link
                })
            });
            return entries
        } 
        throw new HttpException("Tournament doesn't exist", HttpStatus.FORBIDDEN)
    }


}
