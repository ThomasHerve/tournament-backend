import { Controller, Post } from '@nestjs/common';
import { LobbyService } from 'src/lobby/services/lobby/lobby.service';
import { Public } from 'src/users/services/users/public.decorator';
import { LobbyGateway } from './lobby.gateway';

@Controller('lobby')
export class LobbyController {

    constructor(private readonly lobbyGateway: LobbyGateway, lobbyService: LobbyService) {}

    @Public()
    @Post('create')
    createLobby() {
      
    }

    @Public()
    @Post('create')
    joinLobby() {
      
    }

    @Public()
    @Post('create')
    leaveLobby() {
      
    }

}
