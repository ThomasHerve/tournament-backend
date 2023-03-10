import { Body, Controller, Delete, Get, Post, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateTournamentDto, DeleteTournamentDto } from 'src/tournament/dto/tournament.dtos';
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

    @Post('delete')
    @UsePipes(ValidationPipe)
    async deleteTournament(@Body() deleteTournamentDto:DeleteTournamentDto, @Request() req) {
      try {
        return this.tournamentService.delteTournament(deleteTournamentDto, req.user.username)
      } catch(e) {
        throw e;
      }
    }

}
