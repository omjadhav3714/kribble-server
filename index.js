// imports and initializations
const express = require('express');
var http = require("http");
const app = express();
const port = process.env.PORT || 3000;
var server = http.createServer(app);
const mongoose = require('mongoose');
var io = require('socket.io')(server);
const Room = require("./models/Room");
const getWord = require('./api/getWord');

// middleware
app.use(express.json());

// connect mongoDB
const db = "mongodb+srv://kribble:veUNW30wbxUNqoBR@cluster0.2kkmo.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(db).then(() => {
    console.log("DB Connected");
}).catch((e) => {
    console.log(e);
});

io.on('connection', (socket) => {
    console.log("connected");
    socket.on('create-game', async ({ nickname, name, occupancy, maxRounds }) => {
        try {
            const existingRoom = await Room.findOne({ name });
            if (existingRoom) {
                socket.emit('notCorrectGame', 'Room already exists');
                return;
            }
            let room = new Room();
            const word = getWord();
            room.word = word;
            room.name = name;
            room.occupancy = occupancy;
            room.maxRounds = maxRounds;

            let player = {
                socketID: socket.id,
                nickname,
                isPartyLeader: true,
            }
            room.players.push(player);
            room = await rooom.save();
            io.to(name).emit('updateRoom', room);
        }
        catch (err) {
            console.log(err);
        }
    })
})

server.listen(port, "0.0.0.0", () => {
    console.log("Server running on PORT " + port);
});