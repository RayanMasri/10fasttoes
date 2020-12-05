// const io = require('socket.io')({
//     cors: {
//         origin: '*',
//     },
// });

// io.listen(process.env.PORT || 4001, () => {
//     console.log(`listening on *:${process.env.PORT || 4001}`);
// });
// const io = require('socket.io')({
//     cors: {
//         origin: '*',
//     },
// });

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + '/../build'));
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../build/index.html'));
});

const fs = require('fs');
const words = JSON.parse(fs.readFileSync(__dirname + '/words.json')).words;

var rooms = [];

Array.prototype.chop = function (number) {
    var result = new Array(number),
        len = this.length,
        taken = new Array(len);
    if (number > len)
        throw new RangeError('getRandom: more elements taken than available');
    while (number--) {
        var x = Math.floor(Math.random() * len);
        result[number] = this[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
};

class Room {
    constructor() {
        this.name = `room${rooms.length}`;
        this.words = words.chop(70);
        this.status = {
            tag: 'waiting',
            info: {
                countdown: 10,
            },
        };
        this.clients = [];
        this.timeouts = [];
    }

    rename(id, name) {
        this.clients = this.clients.map((client) => {
            return {
                id: client.id,
                name: client.id == id ? name : client.name,
                wpm: client.wpm,
                percentage: client.percentage,
                status: client.status,
                accuracy: client.accuracy,
                correct: client.correct,
                error: client.error,
                time: client.time,
            };
        });
    }

    change(id, wpm, accuracy, percentage, status, correct, error, time) {
        this.clients = this.clients.map((client) => {
            return {
                id: client.id,
                name: client.name,
                wpm: client.id == id ? wpm : client.wpm,
                percentage: client.id == id ? percentage : client.percentage,
                status: client.id == id ? status : client.status,
                accuracy: client.id == id ? accuracy : client.accuracy,
                correct: client.id == id ? correct : client.correct,
                error: client.id == id ? error : client.error,
                time: client.id == id ? time : client.time,
            };
        });

        this.connect();
    }

    add(id) {
        this.clients.push({
            id: id,
            wpm: 0,
            percentage: 0,
            status: 'playing',
            accuracy: 100,
        });

        this.update();
    }

    remove(id) {
        if (this.status.tag != 'started') {
            this.clients = this.clients.filter((client) => client.id != id);
        } else {
            this.clients = this.clients.map((client) => {
                return {
                    id: client.id,
                    name: client.name,
                    wpm: client.wpm,
                    percentage: client.percentage,
                    status:
                        client.id == id
                            ? client.status == 'done'
                                ? 'done.left'
                                : 'left'
                            : client.status,
                    accuracy: client.accuracy,
                    correct: client.correct,
                    error: client.error,
                    time: client.time,
                };
            });
        }

        this.update();
    }

    update() {
        if (this.status.tag != 'started') {
            if (this.clients.length <= 1) {
                this.status = {
                    tag: 'waiting',
                    info: {
                        countdown: 10,
                    },
                };
                this.timeouts.map((timeout) => {
                    clearTimeout(timeout);
                });
                this.timeouts = [];
            } else {
                if (this.status.tag != 'starting') {
                    this.status = {
                        tag: 'starting',
                        info: {
                            countdown: 10,
                        },
                    };

                    this.timeouts.map((timeout) => {
                        clearTimeout(timeout);
                    });
                    this.timeouts = [];

                    for (let i = 1; i <= 10; i++) {
                        var timeout = setTimeout(() => {
                            this.status = {
                                tag: 'starting',
                                info: {
                                    countdown: 10 - i,
                                },
                            };

                            if (this.status.info.countdown <= 0) {
                                this.status = {
                                    tag: 'started',
                                    info: {
                                        countdown: 0,
                                    },
                                };
                            }

                            this.connect();
                        }, 1000 * i);

                        this.timeouts.push(timeout);
                    }
                }
            }
        }

        this.connect();
    }

    connect() {
        if (this.clients.length)
            this.clients.map((client) => {
                io.to(client.id).emit('room.update', {
                    clients: this.clients,
                    status: this.status,
                    words: this.words,
                });
            });
    }

    delete() {
        rooms = rooms.filter((room) => room.name != this.name);
    }
}

io.on('connection', (socket) => {
    var room;

    if (
        rooms.filter(
            (room) => room.status.tag != 'started' && room.clients.length < 5
        ).length < 1
    ) {
        room = new Room();
        rooms.push(room);
    } else {
        room = rooms.filter(
            (room) => room.status.tag != 'started' && room.clients.length < 5
        )[0];
    }

    room.add(socket.id);

    socket.on('user.name', (name) => {
        rooms
            .find((room) =>
                room.clients.some((client) => client.id == socket.id)
            )
            .rename(socket.id, name);
    });

    socket.on(
        'user.update',
        (wpm, accuracy, percentage, status, correct, error, time) => {
            rooms
                .find((room) =>
                    room.clients.some((client) => client.id == socket.id)
                )
                .change(
                    socket.id,
                    wpm,
                    accuracy,
                    percentage,
                    status,
                    correct,
                    error,
                    time
                );
        }
    );

    socket.on('disconnect', () => {
        rooms
            .find((room) =>
                room.clients.some((client) => client.id == socket.id)
            )
            .remove(socket.id);
    });
});

server.listen(PORT, () => {
    console.log('Connected to port:' + PORT);
});
