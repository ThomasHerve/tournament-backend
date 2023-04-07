import { Body, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm';
import { Repository } from 'typeorm';
import { Tournament, TournamentEntry } from 'src/typeorm/tournament.entity';
import { UsersService } from 'src/users/services/users/users.service';
import { CreateTournamentDto, DeleteTournamentDto, TournamentEntries } from 'src/tournament/dto/tournament.dtos';
import { ConnectableObservable } from 'rxjs';

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
            }, relations: {
                entries: true,
            },
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
        const name = createTournamentDto.title
        const tournament = await this.tournamentRepository.findOne({
            where: {
                name: name,
                user: user
            }, relations: {
                entries: true,
            },
        });
        if(!tournament){
            const newTournament = this.tournamentRepository.create({
                name: name,
                description: createTournamentDto.description,
                icon: createTournamentDto.icon,
                user: user,
                entries: []
            });
            const tournament = await this.tournamentRepository.save(newTournament);
            this.userService.addTournament(user, tournament)
            // Entries
            if(createTournamentDto.entries) {
                const entry: TournamentEntries = new TournamentEntries();
                entry.entries = createTournamentDto.entries;
                this.insertTournamentEntries(entry, user.username, tournament.id);
            }
            return {"title": tournament.name, "id": tournament.id}
        }
        throw new HttpException('Tournament already exist', HttpStatus.CONFLICT)
    }

    async deleteTournament(@Body() deleteTournamentDto: DeleteTournamentDto, username: string) {
        const user: User = await this.userService.getUser(username)
        const id = deleteTournamentDto.id
        const tournament = user.tournaments.find((element)=>element.id === id);
        console.log(id);
        console.log(tournament);
        console.log(user.tournaments)
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
            },
            relations: {
                entries: true,
            },
        });
        if(tournament){
            tournament.entries = [];
            tournamentEntries.entries.forEach(element => {
                const entry = this.tournamentEntriesRepository.create({
                    tournament: tournament,
                    name: element.name,
                    link: element.link
                })
                this.tournamentEntriesRepository.save(entry);
                tournament.entries.push(entry);
            });
            await this.tournamentRepository.save(tournament);
            return tournamentEntries;
        } 
        throw new HttpException("Tournament doesn't exist", HttpStatus.FORBIDDEN)
    }


}
