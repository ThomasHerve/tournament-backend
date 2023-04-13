import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { TournamentService } from 'src/tournament/services/tournament/tournament.service';
import { Tournament, TournamentEntry } from 'src/typeorm/tournament.entity';

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
                    if(this.lobbies.get(id).owner.Socket === client) {
                        this.lobbies.get(id).sendOwner();
                    }
                    // Broadcast client
                    this.lobbies.get(id).sendPlayers();
                }
                return
            }
        }
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

        if(this.lobbies.get(this.players.get(client)).started) {
            client.emit("error", "The tournament already started")
            return "Already started"
        }

        const id = this.players.get(client);        

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
            let tournament: Tournament
            try  {
                tournament = await this.tournamentService.getTournament(options.tournament.id);
            } catch(e) {
                client.emit("error", "The tournament doesn't exist")
                return
            }
            this.lobbies.get(this.players.get(client)).tournament_id = options.tournament.id;
            this.lobbies.get(this.players.get(client)).tournament = tournament
            this.lobbies.get(this.players.get(client)).size = tournament.entries.length
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
    hasVoted: boolean

    constructor(Socket, name){
        this.Socket = Socket
        this.name = name
        this.hasVoted = false
    }
}

class Lobby {
    owner: Player;
    players: Player[]
    tournament_id: string
    tournament: Tournament
    size: number
    tree: TournamentTree
    started: boolean

    constructor(owner: Player) {
        this.owner = owner;
        this.players = [owner]
        this.started = false;
    };

    sendPlayers() {
        const players = []
        this.players.forEach((player)=>{
            players.push({name: player.name, hasVoted: player.hasVoted})
        })
        this.players.forEach((player)=>{
            player.Socket.emit('players' ,{
                players: players
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
        this.owner = this.players[0]
        this.owner.Socket.emit('owner', {})
    }

    sendStart() {
        this.players.forEach((player)=>{
            player.Socket.emit('start', {
                start: true
            })
        })
        this.started = true;
        this.tree = new TournamentTree(this.tournament, this.size);
        this.nextTurn();
    }

    // Game

    nextTurn() {

    }

}

class TournamentNode {
    entry: TournamentEntry
    left: TournamentNode
    right: TournamentNode
    isFictive: boolean = false;
}

class TournamentTree {
    
    depth: number;
    size: number;
    head: TournamentNode;

    entries: TournamentEntry[]
    counter: number;
    
    constructor(tournament: Tournament, size: number) {
        this.depth = this.getTreeDepth(size);    
        this.size = size;
        this.head = new TournamentNode();

        this.counter = 0;
        this.entries = this.shuffle(tournament.entries);

        /* tests
        this.createTree(this.head, 1);
        this.printTree(this.head, 1);
        let node = this.getNextNode()
        node.entry = node.left.entry
        node = this.getNextNode()
        node.entry = node.left.entry
        node = this.getNextNode()
        node.entry = node.left.entry
        node = this.getNextNode()
        node.entry = node.left.entry
        this.printTree(this.head, 1)
        */
    }

    // Tree creation

    createTree(node: TournamentNode, currentDepth: number) {
        if(currentDepth === this.depth) {
            if(this.counter >= this.size) {
                // Fictive node
                node.isFictive = true;
            } else {
                node.entry = this.entries[this.counter];
            }
            this.counter++
            return
        }
        
        // Not a leaf
        node.left = new TournamentNode();
        node.right = new TournamentNode();
        this.createTree(node.left, currentDepth+1);
        this.createTree(node.right, currentDepth+1);
        if(node.entry === undefined && node.left.isFictive && node.right.isFictive) {
            node.isFictive = true;
        }
        else if(node.entry === undefined && node.left.entry !== undefined && node.right.isFictive) {
            node.entry = node.left.entry;
        }
    }

    getTreeDepth(n: number): number {
        let v: number = 1
        let c = 1;
        while(v < n) {
            v *= 2
            c++
        } 
        return c
    }

    shuffle(array) {
        const shuffledArray = array.sort((a, b) => 0.5 - Math.random());
        return shuffledArray;
    }

    // Tree execution

    getNextNode(): TournamentNode {
        let nodes: TournamentNode[] = []; 
        let f = new Queue();
        f.push(this.head);
        while(!f.empty()) {
            let node: TournamentNode = f.shift();
            nodes.push(node);
            if(node.right) {
                f.push(node.right)
                f.push(node.left)
            }
        }
        nodes.reverse();

        for(let i = 0; i < nodes.length; i++) {
            if(nodes[i].entry === undefined  && !nodes[i].isFictive && (nodes[i].left.entry !== undefined || nodes[i].left.isFictive )&& (nodes[i].right.entry || nodes[i].right.isFictive)!== undefined) {
                return nodes[i];
            }
        }
    }

    // Test
    printTree(node: TournamentNode, currentDepth: number) {
        let stars = ""
        for(let i = 0; i < currentDepth; i++) {
            stars += "*";
        }
        if(node.left && node.right) {
            if(node.entry) {
                console.log(stars + node.entry.name)
            } else {
                console.log(stars)
            }
            this.printTree(node.left, currentDepth+1);
            this.printTree(node.right, currentDepth+1);
        } else {
            if(node.isFictive) {
                console.log(stars + " fictive");
            } else {
                console.log(stars + " " + node.entry.name);
            }
        }
    }
}

class Queue {

    elements    

    constructor() {
      // Initializing the queue with given arguments 
      this.elements = [];
    }
    // Proxying the push/shift methods
    push(...args) {
      return this.elements.push(...args);
    }
    shift(...args) {
      return this.elements.shift(...args);
    }

    empty(): boolean {
        return this.elements.length === 0;
    }
  }
