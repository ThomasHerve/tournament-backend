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

@WebSocketGateway({cors: '*'})
export class LobbyGateway implements OnGatewayDisconnect {
    @WebSocketServer() server;

    constructor(private lobbyService: LobbyService){}

    async handleDisconnect(client: Socket) {
        this.lobbyService.leavelobby(client);
    }

    @SubscribeMessage('create')
    async create(client: Socket, message) {
        if(message.name === undefined) {
            return "Need a name";
        }
        const name: string = message.name
        if(name.length > 10) {
            return "Name to long";
        }
        this.lobbyService.createLobby(client, name)
    }

    @SubscribeMessage('join')
    async join(client: Socket, message) {
        if(message.name === undefined) {
            return "Need a name";
        }
        if(message.id === undefined) {
            return "Need a room id" 
        }
        const name: string = message.name
        if(name.length > 10) {
            return "Name to long";
        }
        const id: string = message.id
        if(id.length !== 6) {
            return "Invalid ID";
        }
        this.lobbyService.joinLobby(id, client, name);
    }

    @SubscribeMessage('leave')
    async leave(client: Socket, message) {
        this.lobbyService.leavelobby(client);
    }

    @SubscribeMessage('launch')
    async launch(client: Socket, message) {
        this.lobbyService.launchGame(client)
    }

    @SubscribeMessage('setOptions')
    async setOptions(client: Socket, message) {
        this.lobbyService.setOptions(client, message);
    }

    @SubscribeMessage('changeName')
    async changeName(client: Socket, message) {
        if(!message) {
            return "no data provided";
        }
        if(!message.name) {
            return "no name provided";
        }
        this.lobbyService.changeName(client, message.name);
    }

    @SubscribeMessage('vote')
    async vote(client: Socket, message) {
        this.lobbyService.vote(client, message.name);
    }

    @SubscribeMessage('skip')
    async skip(client: Socket) {
        this.lobbyService.skip(client);
    }

  }
  