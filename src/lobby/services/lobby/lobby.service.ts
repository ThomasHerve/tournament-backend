import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class LobbyService {

    lobbies: Map<string, Lobby> = new Map<string, Lobby>();

    createLobby(client: WebSocket, name: string) {
        let id: string = this.generateID();
        while(this.lobbies.has(id)){
            id = this.generateID();
        }
        this.lobbies.set(id, new Lobby(new Player(client, name)));  
        return {
            "id": id,
            "password": this.generateID()
        };
    }

    joinLobby(id, client: WebSocket, name: string) {
        if(this.lobbies.has(id)){
            this.lobbies.get(id).players.push(new Player(client, name));
            // Broadcast client
            this.lobbies.get(id).sendPlayers();
            return
        }
        throw new HttpException("Lobby doesn't exist", HttpStatus.FORBIDDEN)
    }

    leavelobby(id, client: WebSocket) {
        if(this.lobbies.has(id)){
            // Check if client is in lobby
            const user = this.lobbies.get(id).players.find((element)=>{if(element.webSocket === client) return element})
            if(user !== undefined){
                // Remove the client from the lobby
                this.lobbies.get(id).players = this.lobbies.get(id).players.filter((element)=>{
                    if(element.webSocket !== client) {
                        return element;
                    }
                })
                // Destroy the lobby if nobody is in it
                if(this.lobbies.get(id).players.length === 0) {
                    this.destroyLobby(id);
                } else {
                    // Check if leaver is owner
                    if(this.lobbies.get(id).players[0].webSocket === client) {
                        this.lobbies.get(id).sendPassword(this.generateID());
                    }
                    // Broadcast client
                    this.lobbies.get(id).sendPlayers();
                }
                return
            }
            throw new HttpException("Player not in this lobby", HttpStatus.FORBIDDEN)
        }
        throw new HttpException("Lobby doesn't exist", HttpStatus.FORBIDDEN)
    }

    launchGame(id, password: string) {
        // Check password
        if(password !== this.lobbies.get(id).password) {
            throw new HttpException("Not lobby owner", HttpStatus.FORBIDDEN) 
        }

        // TODO 
        // Create game in database with all players data
        

        // Notify all clients
        this.lobbies.get(id).sendStart();

        // Remove the lobby
        this.destroyLobby(id);
    }

    destroyLobby(id) {
        this.lobbies.delete(id);
    }

    generateID(): string {
        let outString: string = '';
        let inOptions: string = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 6; i++) {
          outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
        }
        return outString;
      }
}

class Player {
    webSocket: WebSocket
    name: string

    constructor(webSocket, name){
        this.webSocket = webSocket
        this.name = name
    }
}

class Lobby {
    password: string;
    players: Player[]

    constructor(owner: Player) {
        this.players = [owner]
    };

    sendPlayers() {
        const names = []
        this.players.forEach((player)=>{
            names.push(player.name)
        })
        this.players.forEach((player)=>{
            player.webSocket.send(JSON.stringify({
                players: names
            }))
        })
    }

    sendPassword(newPassword: string) {
        this.password = newPassword;
        this.players[0].webSocket.send(JSON.stringify({
            "password": newPassword
        }))
    }

    sendStart() {
        this.players.forEach((player)=>{
            player.webSocket.send(JSON.stringify({
                start: true
            }))
        })
    }

}
