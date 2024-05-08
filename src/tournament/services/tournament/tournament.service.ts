import { Body, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
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
                "title", "id", "description", "entries", "icon"
            ]
        })
    }

    async getAllTournamentsFiltered(filter: string) {
        const tournaments = await this.tournamentRepository.find({
            select: [
                "title", "id", "description", "entries", "icon"
            ]
        })
        return tournaments.filter((element)=>{
            return element.title.includes(filter)
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

    async getTournament(tournament_id: number) {
        const tournament = await this.tournamentRepository.findOne({
            where: {
                id: tournament_id
            }, relations: {
                entries: true,
            }, select: [
                "title", "id", "description", "entries", "icon"
            ]
        });
        if(!tournament) {
            throw new NotFoundException();
        }
        return tournament;
    }

    // With auth 
    async getTournaments(username: string){
        const user: User = await this.userService.getUser(username)
        return this.tournamentRepository.find({
            where: {
                user: user
            }, select: [
                "title", "id", "description", "entries", "icon"
            ]
        })
    }

    async createTournament(@Body() createTournamentDto: CreateTournamentDto, username: string) {
        const user: User = await this.userService.getUser(username)
        const name = createTournamentDto.title
        const tournament = await this.tournamentRepository.findOne({
            where: {
                title: name,
                user: user
            }, relations: {
                entries: true,
            },
        });
        if(!tournament){
            const newTournament = this.tournamentRepository.create({
                title: name,
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
                await this.insertTournamentEntries(entry, user.username, tournament.id);
            }
            return {"id": tournament.id}
            //return {"title": tournament.title, "id": tournament.id, "description": tournament.description, "icon": tournament.icon, "entries": await this.getTournamentEntries(tournament.id)}
        }
        throw new HttpException('Tournament already exist', HttpStatus.CONFLICT)
    }

    async deleteTournament(tournament_id: number, username: string) {
        const user: User = await this.userService.getUser(username)
        const tournament = user.tournaments.find((element)=>element.id == tournament_id);
        if(tournament){
            this.tournamentRepository.delete(tournament);
            return true
        }
        throw new HttpException("Tournament doesn't exist", HttpStatus.FORBIDDEN)
    }

    async updateTournament(@Body() createTournamentDto: CreateTournamentDto, username: string, tournament_id: number) {
        console.log(`Update tournament ${tournament_id}`)
        const user: User = await this.userService.getUser(username)
        const name = createTournamentDto.title
        const tournament = await this.tournamentRepository.findOne({
            where: {
                id: tournament_id,
                user: user
            }, relations: {
                entries: true,
            },
        });
        if(tournament){
            tournament.title = name
            tournament.description = createTournamentDto.description,
            tournament.icon = createTournamentDto.icon,
            tournament.user = user,
            tournament.entries = []
            const newTournament = await this.tournamentRepository.save(tournament);
            this.userService.addTournament(user, newTournament)
            // Entries
            if(createTournamentDto.entries) {
                const entry: TournamentEntries = new TournamentEntries();
                entry.entries = createTournamentDto.entries;
                await this.insertTournamentEntries(entry, user.username, tournament.id);
            }
            return {"title": tournament.title, "id": tournament.id, "description": tournament.description, "icon": tournament.icon, "entries": await this.getTournamentEntries(tournament.id)}
        }
        throw new HttpException('Tournament doesn\'t exist', HttpStatus.CONFLICT)
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
            /*
            for (const element of tournamentEntries.entries) {
                console.log(`Try to add to ${tournament_id}: ${element.name}`);
                try {
                    const entry = this.tournamentEntriesRepository.create({
                        tournament: tournament,
                        name: element.name,
                        link: element.link
                    });
                    console.log(`Created ${tournament_id}: ${element.name}`);
        
                    // Attendre que l'insertion soit terminée avant de passer à la suivante
                    await this.tournamentEntriesRepository.save(entry);
        
                    // Ajouter l'entrée à la liste du tournoi
                    tournament.entries.push(entry);
                    console.log(`Entry added to ${tournament_id}: ${entry.name}`);
                } catch (e) {
                    console.error(`Failed to add entry ${element.name} to ${tournament_id}: ${(e as Error).message}`);
                }
            }*/

            // Démarrer une transaction
            const queryRunner = this.tournamentEntriesRepository.manager.connection.createQueryRunner();
            await queryRunner.startTransaction();

            try {
                for (const element of tournamentEntries.entries) {
                    console.log(`Try to add to ${tournament_id}: ${element.name}`);
                    const entry = this.tournamentEntriesRepository.create({
                        tournament: tournament,
                        name: element.name,
                        link: element.link
                    });
                    console.log(`Created ${tournament_id}: ${element.name}`);

                    // Utilisez le query runner pour sauvegarder l'entrée dans la transaction
                    await queryRunner.manager.save(entry);

                    // Ajouter l'entrée à la liste du tournoi
                    tournament.entries.push(entry);
                    console.log(`Entry added to ${tournament_id}: ${entry.name}`);
                }

                // Si toutes les opérations ont réussi, validez la transaction
                await queryRunner.commitTransaction();
            } catch (e) {
                // En cas d'erreur, annulez la transaction
                await queryRunner.rollbackTransaction();
                console.error(`Failed to add entries to ${tournament_id}: ${(e as Error).message}`);
            } finally {
                // Libérez le query runner
                await queryRunner.release();
            }
        
            console.log(`FInally saving entries for ${tournament_id}`)
            await this.tournamentRepository.save(tournament);
            return tournamentEntries;
        } 
        throw new HttpException("Tournament doesn't exist", HttpStatus.FORBIDDEN)
    }


}
