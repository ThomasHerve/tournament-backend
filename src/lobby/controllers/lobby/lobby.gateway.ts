import { HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions';
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { LobbyService } from 'src/lobby/services/lobby/lobby.service';

@WebSocketGateway(80, { transports: ['websocket'], cors: {
    origin: '*',
}})
export class LobbyGateway implements OnGatewayDisconnect {
    @WebSocketServer() server;

    constructor(private lobbyService: LobbyService){}

    async handleDisconnect(client: Socket) {
        this.lobbyService.leavelobby(client);
    }

    @SubscribeMessage('create')
    async create(client: Socket, message) {
        if(message.name === undefined) {
            throw new HttpException("Need a name", HttpStatus.FORBIDDEN)
        }
        const name: string = message.name
        if(name.length > 10) {
            throw new HttpException("Name to long", HttpStatus.FORBIDDEN)
        }
        this.lobbyService.createLobby(client, name)
    }

    @SubscribeMessage('join')
    async join(client: Socket, message) {
        if(message.name === undefined) {
            throw new HttpException("Need a name", HttpStatus.FORBIDDEN)
        }
        if(message.id === undefined) {
            throw new HttpException("Need a room id", HttpStatus.FORBIDDEN)
        }
        const name: string = message.name
        if(name.length > 10) {
            throw new HttpException("Name to long", HttpStatus.FORBIDDEN)
        }
        const id: string = message.id
        if(id.length !== 6) {
            throw new HttpException("Invalid ID", HttpStatus.FORBIDDEN)
        }
        this.lobbyService.joinLobby(id, client, name);
    }

    @SubscribeMessage('leave')
    async leave(client: Socket, message) {
        this.lobbyService.leavelobby(client);
    }

    @SubscribeMessage('launch')
    async launch(client: Socket, message) {
        if(message.id === undefined) {
            throw new HttpException("Need a room id", HttpStatus.FORBIDDEN)
        }
        if(message.password === undefined) {
            throw new HttpException("Need a password", HttpStatus.FORBIDDEN)
        }
        const id: string = message.id
        if(id.length !== 6) {
            throw new HttpException("Invalid ID", HttpStatus.FORBIDDEN)
        }
        this.lobbyService.launchGame(id, message.password)
    }

  }
  