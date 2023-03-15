import { Module } from '@nestjs/common';
import { LobbyController } from './controllers/lobby/lobby.controller';
import { LobbyGateway } from './controllers/lobby/lobby.gateway';
import { LobbyService } from './services/lobby/lobby.service';

@Module({
  controllers: [LobbyController],
  providers: [LobbyService, LobbyGateway],
})
export class LobbyModule {}
