import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';

@WebSocketGateway()
export class LobbyGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server;

    async handleConnection(client: WebSocket) {
        //this.server.emit('users', this.users);
    }

    async handleDisconnect(client: WebSocket) {
        //this.server.emit('users', this.users);
    }

    /*@SubscribeMessage('chat')
    async onChat(client, message) {
        client.broadcast.emit('chat', message);
    }*/
  }
  