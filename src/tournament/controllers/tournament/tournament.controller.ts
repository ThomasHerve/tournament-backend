import { Body, Controller, Get, Param, Post, Request, UsePipes, ValidationPipe, ParseIntPipe, Delete, HttpException, HttpStatus } from '@nestjs/common';
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

    @Get('allcreated')
    getTournaments(@Request() req) {
      try {
        return this.tournamentService.getTournaments(req.user.username);
      } catch {
        throw new HttpException("Tournament doesn't exist", HttpStatus.NOT_FOUND);
      }
    }

    @Public()
    @Get('all/:filter')
    @UsePipes(ValidationPipe)
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
    @Post('create')
    @UsePipes(ValidationPipe)
    async createTournament(@Body() createTournamentDto: CreateTournamentDto, @Request() req) {
      try {
        return this.tournamentService.createTournament(createTournamentDto, req.user.username);
      } catch(e) {
        throw e;
      }
    }

    @Post(':id/update')
    @UsePipes(ValidationPipe)
    async updateTournament(@Body() createTournamentDto: CreateTournamentDto, @Request() req, @Param('id', ParseIntPipe) id: number) {
      try {
        return this.tournamentService.updateTournament(createTournamentDto, req.user.username, id);
      } catch(e) {
        throw e;
      }
    }

    @Delete(':id')
    @UsePipes(ValidationPipe)
    async deleteTournament(@Param('id', ParseIntPipe) id: number, @Request() req) {
      try {
        return this.tournamentService.deleteTournament(id, req.user.username);
      } catch(e) {
        throw e;
      }
    }

    @Public()
    @Get(':id')
    @UsePipes(ValidationPipe)
    getTournament(@Param('id', ParseIntPipe) id: number) {
      return this.tournamentService.getTournament(id);
    }

    
}
