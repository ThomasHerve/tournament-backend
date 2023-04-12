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

socketCreator.on("error", console.log);

let count = 0
// receive a message from the server
socketCreator.on("create", (message)=>{
    const socketJoiner = io("ws://localhost:3000");
    socketJoiner.emit("join", {name: "joiner", id: message.id})
    socketJoiner.on("join", (message)=>{
        if(count == 0) {
            count++
            console.log(`Join`)
            console.log(message)
            socketJoiner.emit("leave")
            const socketJoiner2 = io("ws://localhost:3000");
            socketJoiner2.emit("join", {name: "joiner2", id: message.id})
            socketJoiner.emit("join", {name: "joiner1", id: message.id})
            socketJoiner2.on("join", (message)=>{
                socketJoiner2.emit("changeName", {name: "changedJoiner2"})
            })

            // Failed launch, no tournament set
            socketCreator.emit("launch", {})

            // Failed lobby set
            socketCreator.emit("setOptions", {tournament: {id: 4000}})

            // Change owner
            socketJoiner.on("owner", (message)=>{
                console.log(`Owner`)
                console.log(message)
            })

            socketCreator.emit("leave")
            
        }
    })

});

