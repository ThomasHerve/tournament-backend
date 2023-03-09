import { Body, Controller, Get, Post, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateTournamentDto } from 'src/tournament/dto/tournament.dtos';
import { TournamentService } from 'src/tournament/services/tournament/tournament.service';

@Controller('tournament')
export class TournamentController {
    constructor(private readonly tournamentService: TournamentService) {}

    @Get('all')
    getTournaments(@Request() req) {
      return this.tournamentService.getTournaments(req.user.username)
    }

    @Post('create')
    @UsePipes(ValidationPipe)
    async createTournament(@Body() createTournamentDto: CreateTournamentDto, @Request() req) {
      try {
        return this.tournamentService.createTournament(createTournamentDto, req.user.username)
      } catch(e) {
        throw e;
      }
    }

}
