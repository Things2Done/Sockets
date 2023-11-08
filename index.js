//Initialize the express 'app' object
// let axios = require('axios');
let express = require('express');
let app = express();
app.use('/', express.static('public'));

app.use(express.json());

// using CommonJS modules
const fetch = require("isomorphic-unfetch");

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

const openaiApiKey = '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';

app.get('/api/msg', async (req, res) =>  {
    const msg = req.query.msg;
    const result = generateChatGPTResponse({ value: msg });
    res.json({ result });
});

async function generateChatGPTResponse(msgInput) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {


            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        "role": "system",
                        "content": "You are a brilliant stand-up comedian who always has something funny to say. It is your role to take whatever is being talked abou and add a sentence and a half of humor. You are inapporpiate and on the cutting edge, but you always leave room for someone else to deliver a punch line so you leave your thoughts unfinished"
                    },
                    {
                        "role": "user",
                        "content": msgInput.value
                    }
                ],
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0 && data.choices[0].message.content) {
            return data.choices[0].message.content.trim();
        } else {
            console.error("Unexpected response structure from OpenAI:", data);
            return "I'm sorry, I wasn't able to come up with a response.";
        }
    } catch (error) {
        console.error("Error generating response from ChatGPT:", error);
        return "There was an error generating a response. Please try again.";
    }
}

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
    socket.on('msg', async function (data) {
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

        // Generate ChatGPT response and broadcast it
        // const chatGptResponse = await generateChatGPTResponse(data.msg);
        // io.sockets.emit('msg', {
        //     name: 'GPT-3.5',
        //     msg: chatGptResponse,
        //     textColor: '#0000FF' // Or however you want to distinguish the bot's messages
        // });

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