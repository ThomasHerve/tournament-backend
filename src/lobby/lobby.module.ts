import { Module } from '@nestjs/common';
import { LobbyGateway } from './controllers/lobby/lobby.gateway';
import { LobbyService } from './services/lobby/lobby.service';

@Module({
  controllers: [],
  providers: [LobbyService, LobbyGateway],
})
export class LobbyModule {}
