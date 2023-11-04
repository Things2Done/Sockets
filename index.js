//Initialize the express 'app' object
let express = require('express');
let app = express();
app.use('/', express.static('public'));

//Initialize the actual HTTP server
let http = require('http');
let server = http.createServer(app);
let port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log("Server listening at port: " + port);
});

//Initialize socket.io
let io = require('socket.io');
io = new io.Server(server);

//create variable tracking users
let userCount = 0;
//object containing list of connected users
const connectedUsers = {};
const speakerLine = [];
let currentSpeaker = null;

//Listen for individual clients/users to connect
io.sockets.on('connection', function (socket) {
    console.log("We have a new client: " + socket.id);

    //count users who join
    userCount++;

    //store user number in socket
    connectedUsers[socket.id] = userCount;

    speakerLine.push(socket.id);

    // Send the user their unique ID
    socket.emit('user-number', userCount);

    // Initialize the currentSpeaker variable when a user connects
    if (currentSpeaker === null) {
        currentSpeaker = speakerLine[0];
        io.to(currentSpeaker).emit('is-speaker', true);
    } else {
        socket.emit('is-speaker', false);
    }


    //Listen for a message named 'msg' from this client
    socket.on('msg', function (data) {
        //Data can be numbers, strings, objects
        console.log("Received a 'msg' event");
        console.log(data);

        //Send a response to all clients, including this one
        io.sockets.emit('msg', data);

        //Send a response to all other clients, not including this one
        // socket.broadcast.emit('msg', data);

        //Send a response to just this client
        // socket.emit('msg', data);
        // Move the current speaker to the end of the queue
        moveNextInQueueToSpeaker();
    });

    //Listen for this client to disconnect
    socket.on('disconnect', function () {
        console.log("A client has disconnected: " + socket.id);

        //get user number of departing user
        const userNumber = connectedUsers[socket.id];
        const isSpeaker = isCurrentSpeaker(socket.id);

        // If the user existed, renumber the remaining users
        if (userNumber) {
            delete connectedUsers[socket.id];
            userCount--;

            // Remove the user from the speaker queue
            const index = speakerLine.indexOf(socket.id);
            if (index > -1) {
                speakerLine.splice(index, 1);
            }


            // Renumber the remaining users
            for (const id in connectedUsers) {
                if (connectedUsers[id] > userNumber) {
                    connectedUsers[id]--;
                    // Send updated user numbers to clients
                    io.to(id).emit('user-number', connectedUsers[id]);
                }
            }
            // If the user was the current speaker, move to the next user in the queue
            if (isSpeaker) {
                moveNextInQueueToSpeaker();
            }
        };
    });
});
// Function to check if a user is the current speaker
function isCurrentSpeaker(socketId) {
    return speakerLine[0] === socketId;
}

// Function to move the next user in the queue to be the current speaker
function moveNextInQueueToSpeaker() {
    if (speakerLine.length > 0) {
        if (currentSpeaker) {
            const index = speakerLine.indexOf(currentSpeaker);
            if (index > -1) {
                speakerLine.splice(index, 1);
            }
        }
        currentSpeaker = speakerLine[0];

        if (currentSpeaker) {
            io.to(currentSpeaker).emit('is-speaker', true);
        }
    }
}