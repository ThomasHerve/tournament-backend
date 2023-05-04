

const io = require("socket.io-client");

const socketCreator = io("ws://localhost:3000");

socketCreator.emit("create", {name: "test"});
socketCreator.on("create", ()=>{
    socketCreator.emit("setOptions", {tournament: {id: 2}})      
})

socketCreator.on("tournament", ()=>{
    socketCreator.emit("launch");
})

socketCreator.on('start', ()=>{
    console.log("start");
    socketCreator.emit('vote', {left: true});
}); 
count = 0
socketCreator.on('round',(round)=>{
    if(count < 6) {
        count++;
        console.log(round);
        socketCreator.emit('vote', {left: true});
    }
}); 

socketCreator.on("end", console.log)

socketCreator.on('error', console.log)
