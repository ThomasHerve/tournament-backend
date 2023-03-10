import { Body, Controller, Delete, Get, Param, Post, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateTournamentDto, DeleteTournamentDto } from 'src/tournament/dto/tournament.dtos';
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
        return this.tournamentService.delteTournament(deleteTournamentDto, req.user.username);
      } catch(e) {
        throw e;
      }
    }

    //@Get(':id/entries')
    //@UsePipes(ValidationPipe)
    //async getTournamentEntries(@Body() tournamentDto:TournamentDto, @Request() req, )
}
