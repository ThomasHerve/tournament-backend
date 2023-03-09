import { Module } from '@nestjs/common';
import { TournamentController } from './controllers/tournament/tournament.controller';
import { TournamentService } from './services/tournament/tournament.service';

@Module({
  controllers: [TournamentController],
  providers: [TournamentService]
})
export class TournamentModule {}
