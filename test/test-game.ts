const io = require("socket.io-client");

const socketCreator = io("ws://localhost:3000");
const socketJoiner = io("ws://localhost:3000");

socketCreator.emit("create", {name: "test"});
socketCreator.on("create", (message)=>{
    socketJoiner.emit("join", {name: "joiner", id: message.id})
    socketJoiner.on("join", (message)=>{
        socketCreator.emit("setOptions", {tournament: {id: 1}})      
        socketCreator.on("tournament", (message)=>{
            socketCreator.emit("launch")
        })
    })
})

socketCreator.on("start", (message)=>{
    game();
})

// Game 

function game() {

}