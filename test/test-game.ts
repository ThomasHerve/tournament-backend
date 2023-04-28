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

let j = true;

socketCreator.on("error", console.log)
socketJoiner.on("error", console.log)

socketCreator.on("start", (message)=>{
    console.log(message)
    socketCreator.emit('vote', {left: true})
    socketCreator.emit('vote', {left: true})
    socketJoiner.emit('vote', {left: true})
})

socketCreator.on('round', (r)=>{
    console.log(r)
    socketCreator.emit('vote', {left: true})
    socketJoiner.emit('vote', {left: true})
})

socketCreator.on('end', (r)=>{
    console.log("WINNER")
    console.log(r)
})
