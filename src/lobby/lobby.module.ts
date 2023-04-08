import { Module } from '@nestjs/common';
import { TournamentModule } from 'src/tournament/tournament.module';
import { LobbyGateway } from './controllers/lobby/lobby.gateway';
import { LobbyService } from './services/lobby/lobby.service';

@Module({
  controllers: [],
  providers: [LobbyService, LobbyGateway],
  imports: [TournamentModule]
})
export class LobbyModule {}
