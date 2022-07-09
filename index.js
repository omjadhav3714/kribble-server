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

    // CREATE GAME
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
            room = await room.save();
            io.to(name).emit('updateRoom', room);
        }
        catch (err) {
            console.log(err);
        }
    })

    // JOIN GAME CALLBACK
    socket.on('join-game', async ({ nickname, name }) => {
        try {
            let room = await Room.findOne({ name });
            if (!room) {
                socket.emit('notCorrectGame', 'Please enter a valid room name');
                return;
            }

            if (room.isJoin) {
                let player = {
                    socketID: socket.id,
                    nickname,
                }
                room.players.push(player);
                socket.join(name);

                if (room.players.length === room.occupancy) {
                    room.isJoin = false;
                }
                room.turn = room.players[room.turnIndex];
                room = await room.save();
                io.to(name).emit('updateRoom', room);
            } else {
                socket.emit('notCorrectGame', 'The game is in progress, please try later!');
            }
        } catch (err) {
            console.log(err);
        }
    })
});



server.listen(port, "0.0.0.0", () => {
    console.log("Server running on PORT " + port);
});