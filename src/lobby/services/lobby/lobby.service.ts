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
            // Client was in another lobby, lets remove him
            this.leavelobby(client);
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
        this.lobbies.get(id).sendPlayers();
        console.log("Lobby created: "  + id)
    }

    joinLobby(id: string, client: Socket, name: string) {
        if(this.players.has(client)) {
            client.emit('error', 'player already joined a lobby');
            console.log("Player already joined a lobby")
            return
        }
        if(this.lobbies.has(id)){
            this.players.set(client, id);
            console.log(`Player joined ${id}`)
            this.lobbies.get(id).players.push(new Player(client, name));
            // Broadcast client
            this.lobbies.get(id).sendPlayers();
            client.emit('join', {
                "id": id,
                "tournament_id": this.lobbies.get(id).tournament_id,
                "started": this.lobbies.get(id).started
            });
            if(this.lobbies.get(id).started) {
                const lobby = this.lobbies.get(id)
                lobby.sendTournamentToOneClient(client);
                lobby.SendStartToLateJoiningCLient(client);
                lobby.sendRound(client);
            }
            return
        } else {
            console.log(`Player tried to join ${id} but doesn't exist`)
            client.emit('join', {});
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
                // Remove player from game
                this.lobbies.get(id).removePlayer(user);
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
                    if(this.lobbies.get(id) !== undefined && this.lobbies.get(id).owner.Socket === client) {
                        this.lobbies.get(id).sendOwner();
                    }
                    // Broadcast client
                    if(this.lobbies.get(id) !== undefined) {
                        this.lobbies.get(id).sendPlayers();
                    }
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
        /*this.lobbies.get(id).players.forEach((player: Player)=>{
            this.players.delete(player.Socket);
        });*/

        // Re-send players
        this.lobbies.get(id).sendPlayers();

    }

    destroyLobby(id) {
        console.log("Lobby destroyed: "  + id)
        this.lobbies.delete(id);
    }

    changeName(client: Socket, name: string) {
        if(this.players.has(client) && this.lobbies.get(this.players.get(client))) {
            this.lobbies.get(this.players.get(client)).changeName(client, name);
        }
    }

    async setOptions(client: Socket, options) {
        // options.tournament -> id
        if(this.players.get(client) && this.lobbies.get(this.players.get(client)) && this.lobbies.get(this.players.get(client)).owner.Socket === client) {
            console.log("Select tournament " +  options.tournament.id + " for lobby " + this.lobbies.get(this.players.get(client)).tournament_id)
            if(this.lobbies.get(this.players.get(client)).started) {
                client.emit("error", "The tournament already started")
                return "Already started"
            }
            let tournament: Tournament
            try  {
                tournament = await this.tournamentService.getTournament(options.tournament.id);
            } catch(e) {
                client.emit("error", "The tournament doesn't exist")
                return
            }
            this.lobbies.get(this.players.get(client)).tournament_id = options.tournament.id;
            this.lobbies.get(this.players.get(client)).tournament = tournament
            let size = tournament.entries.length
            if(options.size && typeof options.size === "number" && options.size < size && options.size > 1) size = options.size
            this.lobbies.get(this.players.get(client)).size = size
            this.lobbies.get(this.players.get(client)).sendTournament()
        } else {
            client.emit("error", "You cannot change the rule if you are not the owner of the lobby")
        }
    }


    generateID(): string {
        let outString: string = '';
        let inOptions: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < 6; i++) {
          outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
        }
        return outString;
      }


    // Game part
    vote(client: Socket, message) {
        if(message === undefined) {
            console.log("No data send on vote")
            client.emit("error", "no data send");
            return
        }
        if(message.left === undefined) {
            console.log("Need a 'left' field on vote")
            client.emit("error", "need a 'left' field on vote");
            return
        }
        if(this.players.has(client)) {
            if(this.lobbies.get(this.players.get(client)).started) {
                this.lobbies.get(this.players.get(client)).vote(client, message.left);
            } else {
                console.log("Game didn't started")
                client.emit("error", "game didn't started");
            }
        }
        else {
            console.log("Player doesn't exist")
        }
    }

    // If the owner send skip
    skip(client: Socket) {
        if(!this.lobbies.get(this.players.get(client))) {
            client.emit("error", "Not in a lobby, maybe it has been destroyed");
            return
        }
        if(this.lobbies.get(this.players.get(client)).owner.Socket === client) {
            if(this.lobbies.get(this.players.get(client)).started) {
                this.lobbies.get(this.players.get(client)).skip();
            } else {
                client.emit("error", "game didn't started");
            }
        } else {
            client.emit("error", "you are not the owner");
        }
    }
    
}

class Player {
    Socket: Socket
    name: string
    hasVoted: boolean
    vote: number

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
            let isOwner = false;
            if(player === this.owner) {
                isOwner = true
            }
            players.push({name: player.name, isOwner: isOwner, hasVoted: player.hasVoted})
        })
        this.players.forEach((player)=>{
            player.Socket.emit('players' ,{
                players: players,
                owner: this.owner.name
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
            this.sendTournamentToOneClient(player.Socket);
        })
    }

    sendTournamentToOneClient(client: Socket) {
        client.emit('tournament', {
            tournament_id: this.tournament_id
        })
    }

    sendOwner() {
        this.owner = this.players[0]
        this.owner.Socket.emit('owner')
    }

    sendStart() {
        console.log(`tournament ${this.tournament_id} send start to his clients, his owner is ${this.owner}`)
        const players = []
        this.players.forEach((player)=>{
            players.push({name: player.name, hasVoted: player.hasVoted})
        })
        
        this.started = true;
        this.tree = new TournamentTree(this.tournament, this.size);
        
        this.leftVote = 0;
        this.rightVote = 0;
        this.ownerVoteLeft = true;
        
        this.currentNode = this.tree.getNextNode();

        this.players.forEach((player)=>{
            player.hasVoted = false;
            player.vote = 0;
            console.log(`tournament ${this.tournament_id} send ${player}: ${this.currentNode.left.entry.name} and ${this.currentNode.right.entry.name}`)
            player.Socket.emit(
                'start', {
                    left: {
                        name: this.currentNode.left.entry.name,
                        link: this.currentNode.left.entry.link
                    },
                    right: {
                        name: this.currentNode.right.entry.name,
                        link: this.currentNode.right.entry.link
                    }
                }
            )
            this.sendRound(player.Socket);
        })

        //this.nextTurn();
    }

    removePlayer(player: Player) {
        if(this.started) {
            if(player.hasVoted){
                if(player.vote === 1) {
                    this.leftVote--;
                } else if(player.vote === -1){
                    this.rightVote--;
                }
            }
        }
    }

    // Game
    leftVote: number = 0;
    rightVote: number = 0;
    ownerVoteLeft: boolean = true;
    currentNode: TournamentNode;

    // Send entries data to all player
    nextTurn() {
        this.leftVote = 0;
        this.rightVote = 0;
        this.ownerVoteLeft = true;
        // Check if the game is over
        if(this.tree.getIsOver()){
            this.end();
            return
        }
        this.currentNode = this.tree.getNextNode();

        // Check for automatic resolution
        if(this.currentNode.right.isFictive) {
            this.currentNode.entry = this.currentNode.left.entry;
            this.nextTurn();
            return
        }

        this.players.forEach((player)=>{
            player.hasVoted = false;
            player.vote = 0;
            this.sendRound(player.Socket)
        })
    }

    sendRound(client: Socket) {
        console.log(`Send round to a client: ${this.currentNode.left.entry.name} and ${this.currentNode.right.entry.name}`)
        try {
            client.emit('round', {
                left: {
                    name: this.currentNode.left.entry.name,
                    link: this.currentNode.left.entry.link
                },
                right: {
                    name: this.currentNode.right.entry.name,
                    link: this.currentNode.right.entry.link
                },
                round: this.currentNode.depth,
                random: Math.random()
            })
        } catch (error) {
            console.log("--------------")
            console.log(error)
            console.log(this.currentNode)
            console.log("--------------")
        }
        
    }

    SendStartToLateJoiningCLient(client: Socket) {
        console.log("Late joining client")
        try {
            client.emit('start', {
                left: {
                    name: this.currentNode.left.entry.name,
                    link: this.currentNode.left.entry.link
                },
                right: {
                    name: this.currentNode.right.entry.name,
                    link: this.currentNode.right.entry.link
                }
            })
        } catch (error) {
            console.log("--------------")
            console.log(error)
            console.log(this.currentNode)
            console.log("--------------")
        }

    }

    end() {
        let tree = this.tree.getAllTreeAsJSON();
        console.log(tree)
        this.players.forEach((player)=>{
            player.Socket.emit('end', {
                name: this.currentNode.entry.name,
                link: this.currentNode.entry.link,
                tree: tree
            })
        })
        // RESET
        this.started = false;
        this.tournament_id = null;
        this.tournament = null;
        this.size = null;
        this.tree = null;
    }

    // A client vote
    vote(client: Socket, left: boolean) {
        const player: Player = this.players.find((element)=>element.Socket === client);
        if(player && !player.hasVoted) {
            player.hasVoted = true;
            if(left) {
                this.leftVote++;
                player.vote=1;
            }
            else {
                this.rightVote++;
                player.vote=-1;
                // To avoir tie, we track the owner vote 
                if(this.owner === player) {
                    this.ownerVoteLeft = false;
                }
            }
            // Check if everyone voted
            if(this.leftVote + this.rightVote === this.players.length) {
                this.skip();
            }
            this.sendPlayers();
            client.emit("voted", {left: left})
        } else if(player && player.hasVoted) {
            client.emit("error", "You already voted");
        }
    }

    sendVote(client: Socket, res: string) {
        client.emit('vote', {
            left: this.leftVote,
            right: this.rightVote,
            result: res
        })
    }

    // Skip if owner send skip
    skip() {
        let res = "left"
        if(this.leftVote > this.rightVote) {
            this.currentNode.entry = this.currentNode.left.entry;
        }
        else if(this.leftVote < this.rightVote) {
            this.currentNode.entry = this.currentNode.right.entry;
            res = "right"
        }
        else {
            // Tie
            if(this.ownerVoteLeft) {
                this.currentNode.entry = this.currentNode.left.entry;
            } else {
                this.currentNode.entry = this.currentNode.right.entry;
                res = "right"
            }
        }
        // Send data if not ended
        if(!this.tree.getIsOver()){
            this.players.forEach((player)=>{
                this.sendVote(player.Socket, res);
            })
        }
        this.nextTurn();
    }
}

class TournamentNode {
    entry: TournamentEntry
    left: TournamentNode
    right: TournamentNode
    isFictive: boolean = false;
    depth: number
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
        this.entries = this.shuffle(tournament.entries).slice(0, size);
        this.createTree(this.head, 1);

        /* tests
        
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
        node.depth = this.depth - currentDepth;
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

    getIsOver(): boolean {
        return this.head.entry !== undefined;
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

    getAllTreeAsJSON() {
        return this.getTreeRecursive(this.head);
    }

    getTreeRecursive(node: TournamentNode) {
        let obj = {
            link: node.entry.link,
            name: node.entry.name
        }
        if(node.right && !node.right.isFictive) {
            obj["rigth"] = this.getTreeRecursive(node.right);
        }
        if(node.left && !node.left.isFictive) {
            obj["left"] = this.getTreeRecursive(node.left);
        }
        return obj
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
