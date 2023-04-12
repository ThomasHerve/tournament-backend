const io = require("socket.io-client");

const socketCreator = io("ws://localhost:3000");

// send a message to the server
socketCreator.emit("create", {name: "test"});

socketCreator.on("owner", (message)=>{
    console.log(`Owner`)
    console.log(message)
})

socketCreator.on("start", (message)=>{
    console.log(`Start: ${message}`)
})

socketCreator.on("tournament", (message)=>{
    console.log(`Tournament`)
    console.log(message)
})

socketCreator.on("players", (message)=>{
    console.log(`Players`)
    console.log(message)
})

// receive a message from the server
socketCreator.on("create", (message)=>{
    const socketJoiner = io("ws://localhost:3000");
    socketJoiner.emit("join", {name: "joiner", id: message.id})
    socketJoiner.on("join", (message)=>{
        console.log(`Join`)
        console.log(message)
    })
});

