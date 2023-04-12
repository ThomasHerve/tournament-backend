import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { TournamentService } from 'src/tournament/services/tournament/tournament.service';

@Injectable()
export class LobbyService {

    lobbies: Map<string, Lobby> = new Map<string, Lobby>();
    players: Map<Socket, string> = new Map<Socket, string>()

    @Inject(TournamentService)
    private readonly tournamentService: TournamentService

    createLobby(client: Socket, name: string) {
        if(this.players.has(client)) {
            return
        }
        let id: string = this.generateID();
        while(this.lobbies.has(id)){
            id = this.generateID();
        }
        this.players.set(client, id);
        this.lobbies.set(id, new Lobby(new Player(client, name)));  
        client.emit('create', {
            "id": id,
        });
    }

    joinLobby(id: string, client: Socket, name: string) {
        if(this.players.has(client)) {
            return
        }
        this.players.set(client, id);
        if(this.lobbies.has(id)){
            this.lobbies.get(id).players.push(new Player(client, name));
            // Broadcast client
            this.lobbies.get(id).sendPlayers();
            client.emit('join', {
                "id": id,
                "tournament_id": this.lobbies.get(id).tournament_id
            });
            return
        }
        client.emit("error", "lobby doesn't exist")
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
                        this.lobbies.get(id).sendOwner();
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

    launchGame(client: Socket) {
        // Check password
        if(this.lobbies.get(this.players.get(client)).owner.Socket !== client) {
            client.emit("error", "You are not the owner of the lobby")
            return "not owner"
        }

        if(!this.lobbies.get(this.players.get(client)).tournament_id) {
            client.emit("error", "You need to set a tournament")
            return "no tournaments set"
        }

        const id = this.players.get(client);

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

    changeName(client: Socket, name: string) {
        if(this.players.has(client)) {
            this.lobbies.get(this.players.get(client)).changeName(client, name);
        }
    }

    async setOptions(client: Socket, options) {
        // options.tournament -> id
        if(this.lobbies.get(this.players.get(client)).owner.Socket === client) {
            try  {
                await this.tournamentService.getTournament(options.tournament.id);
            } catch(e) {
                client.emit("error", "The tournament doesn't exist")
                return
            }
            this.lobbies.get(this.players.get(client)).tournament_id = options.tournament.id;
            this.lobbies.get(this.players.get(client)).sendTournament()
        } else {
            client.emit("error", "You cannot change the rule if you are not the owner of the lobby")
        }
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
    owner: Player;
    players: Player[]
    tournament_id: string

    constructor(owner: Player) {
        this.owner = owner;
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

    changeName(socket: Socket, name: string) {
        this.players.forEach((player)=>{
            if(player.Socket === socket) {
                player.name = name;
            }
        })
        this.sendPlayers();
    }

    sendTournament() {
        this.players.forEach((player)=>{
            player.Socket.emit('tournament', {
                tournament_id: this.tournament_id
            })
        })
    }

    sendOwner() {
        this.players[0].Socket.emit('owner', {})
    }

    sendStart() {
        this.players.forEach((player)=>{
            player.Socket.emit('start', {
                start: true
            })
        })
    }

}
