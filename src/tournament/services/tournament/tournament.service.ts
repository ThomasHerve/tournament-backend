import { Body, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from 'src/typeorm/tournament.entity';
import { UsersService } from 'src/users/services/users/users.service';
import { CreateTournamentDto, DeleteTournamentDto } from 'src/tournament/dto/tournament.dtos';

@Injectable()
export class TournamentService {
    constructor(
        @InjectRepository(Tournament) private readonly tournamentRepository: Repository<Tournament>,
        private readonly userService: UsersService
      ) {}
    
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

    async delteTournament(@Body() deleteTournamentDto: DeleteTournamentDto, username: string) {
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

}
