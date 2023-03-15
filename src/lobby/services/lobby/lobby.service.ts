import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class LobbyService {

    lobbies: Map<string, Lobby> = new Map<string, Lobby>();

    createLobby(client: WebSocket) {
        let id: string = this.generateID();
        while(this.lobbies.has(id)){
            id = this.generateID();
        }
        const lobby = {
            owner: client,
            players: [client]
        };
        this.lobbies.set(id, lobby);  
        return id;
    }

    joinLobby(id, client: WebSocket) {
        if(this.lobbies.has(id)){
            this.lobbies.get(id).players.push(client);
            return
        }
        throw new HttpException("Lobby doesn't exist", HttpStatus.FORBIDDEN)
    }

    leavelobby(id, client: WebSocket) {
        if(this.lobbies.has(id)){
            const user = this.lobbies.get(id).players.find((element)=>{if(element === client) return element})
            if(user !== undefined){
                this.lobbies.get(id).players = this.lobbies.get(id).players.filter((element)=>{
                    if(element !== client) {
                        return element;
                    }
                })
                if(this.lobbies.get(id).players.length === 0) {
                    this.destroyLobby(id);
                }
                return
            }
            throw new HttpException("Player not in this lobby", HttpStatus.FORBIDDEN)
        }
        throw new HttpException("Lobby doesn't exist", HttpStatus.FORBIDDEN)
    }

    launchGame(id, client: WebSocket) {
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

interface Lobby {
    owner: WebSocket,
    players: WebSocket[]
}