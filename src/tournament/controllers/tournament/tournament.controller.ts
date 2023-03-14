import { Body, Controller, Get, Param, Post, Request, UsePipes, ValidationPipe, ParseIntPipe } from '@nestjs/common';
import { CreateTournamentDto, DeleteTournamentDto, TournamentEntries } from 'src/tournament/dto/tournament.dtos';
import { TournamentService } from 'src/tournament/services/tournament/tournament.service';
import { Public } from 'src/users/services/users/public.decorator';

@Controller('tournament')
export class TournamentController {
    constructor(private readonly tournamentService: TournamentService) {}

    // Public urls
    @Public()
    @Get('all')
    getAllTournaments() {
      return this.tournamentService.getAllTournaments();
    }

    @Public()
    @Get('all/:filter')
    getAllTournamentsFiltered(@Param('filter') filter: string) {
      return this.tournamentService.getAllTournamentsFiltered(filter);
    }

    @Public()
    @Get(':id/entries')
    @UsePipes(ValidationPipe)
    async getTournamentEntries(@Param('id', ParseIntPipe) id: number) {
      return this.tournamentService.getTournamentEntries(id);
    }

    // With auth
    @Get('all-created')
    getTournaments(@Request() req) {
      return this.tournamentService.getTournaments(req.user.username);
    }

    @Post('create')
    @UsePipes(ValidationPipe)
    async createTournament(@Body() createTournamentDto: CreateTournamentDto, @Request() req) {
      try {
        return this.tournamentService.createTournament(createTournamentDto, req.user.username);
      } catch(e) {
        throw e;
      }
    }

    @Post('delete')
    @UsePipes(ValidationPipe)
    async deleteTournament(@Body() deleteTournamentDto:DeleteTournamentDto, @Request() req) {
      try {
        return this.tournamentService.deleteTournament(deleteTournamentDto, req.user.username);
      } catch(e) {
        throw e;
      }
    }

    @Post(':id/insert-entries')
    @UsePipes(ValidationPipe)
    async insertEntries(@Body() tournamentEntries:TournamentEntries, @Request() req, @Param('id', ParseIntPipe) id: number) {
      try {
        return this.tournamentService.insertTournamentEntries(tournamentEntries, req.user.username, id);
      } catch(e) {
        throw e;
      }
    }

    
}
