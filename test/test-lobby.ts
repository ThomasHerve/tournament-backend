const io = require("socket.io-client");

const socket = io("ws://localhost:3000");

// send a message to the server
socket.emit("create", {name: "test"});

// receive a message from the server
socket.on("create", console.log);