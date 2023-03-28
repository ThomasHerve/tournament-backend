import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class LobbyService {

    lobbies: Map<string, Lobby> = new Map<string, Lobby>();
    players: Map<Socket, string> = new Map<Socket, string>()

    createLobby(client: Socket, name: string) {
        if(this.players.has(client)) {
            throw new HttpException("Already in a lobby", HttpStatus.FORBIDDEN)
        }
        let id: string = this.generateID();
        while(this.lobbies.has(id)){
            id = this.generateID();
        }
        this.players.set(client, id);
        this.lobbies.set(id, new Lobby(new Player(client, name)));  
        client.emit('create', {
            "id": id,
            "password": this.generateID()
        });
    }

    joinLobby(id: string, client: Socket, name: string) {
        if(this.players.has(client)) {
            throw new HttpException("Already in a lobby", HttpStatus.FORBIDDEN)
        }
        this.players.set(client, id);
        if(this.lobbies.has(id)){
            this.lobbies.get(id).players.push(new Player(client, name));
            // Broadcast client
            this.lobbies.get(id).sendPlayers();
            client.emit('join', {
                "id": id,
            });
        }
        throw new HttpException("Lobby doesn't exist", HttpStatus.FORBIDDEN)
    }

    leavelobby(client: Socket) {
        if(!this.players.has(client)) {
            return
        }
        const id = this.players.get(client); 
        if(this.lobbies.has(id)){
            // Check if client is in lobby
            const user = this.lobbies.get(id).players.find((element)=>{if(element.Socket === client) return element})
            if(user !== undefined){
                // Remove the client from the lobby
                this.lobbies.get(id).players = this.lobbies.get(id).players.filter((element)=>{
                    if(element.Socket !== client) {
                        return element;
                    }
                })
                this.players.delete(client);
                // Destroy the lobby if nobody is in it
                if(this.lobbies.get(id).players.length === 0) {
                    this.destroyLobby(id);
                } else {
                    // Check if leaver is owner
                    if(this.lobbies.get(id).players[0].Socket === client) {
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

        // Remove clients from Map
        this.lobbies.get(id).players.forEach((player: Player)=>{
            this.players.delete(player.Socket);
        });

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
    Socket: Socket
    name: string

    constructor(Socket, name){
        this.Socket = Socket
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
            player.Socket.emit('players' ,{
                players: names
            })
        })
    }

    sendPassword(newPassword: string) {
        this.password = newPassword;
        this.players[0].Socket.send('password', {
            "password": newPassword
        })
    }

    sendStart() {
        this.players.forEach((player)=>{
            player.Socket.send('start', {
                start: true
            })
        })
    }

}
