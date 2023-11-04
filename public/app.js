window.addEventListener('load', function () {

    //Open and connect socket
    let socket = io();
    //Listen for confirmation of connection
    socket.on('connect', function () {
        console.log("Connected");
    });
    let textColor = getRandomColor();

    // Listen for the 'user-number' event from the server
    socket.on('user-number', function (userNumber) {
        console.log('You are user #' + userNumber);
    });

    // Listen for the 'is-speaker' event from the server
    socket.on('is-speaker', function (isCurrentSpeaker) {
        if (isCurrentSpeaker) {
            // Enable the input field for the current speaker
            msgInput.disabled = false;
            msgInput.placeholder = "Type your message...";
        } else {
            // Disable the input field for other users
            msgInput.disabled = true;
            msgInput.placeholder = "Wait for your turn...";
        }
    });


    /* --- Code to RECEIVE a socket message from the server --- */
    let chatBox = document.getElementById('chat-box-msgs');



    // let userTextColors = {};

    //Listen for messages named 'msg' from the server
    socket.on('msg', function (data) {
        console.log("Message arrived!");
        console.log(data);

        //Create a message string and page element
        // let receivedMsg = data.name + ": " + data.msg;
        let receivedMsg = data.msg + " ";
        let msgEl = document.createElement('span');

        // Retrieve or generate a text color based on the user's socketID
        // let textColor = userTextColors[socket.id] || getRandomColor();
        // data.textColor = textColor;

        msgEl.style.color = data.textColor;
        msgEl.innerHTML = receivedMsg;

        // Store the text color in the userTextColors object
        // userTextColors[socket.id] = textColor;

        //Add the element with the message to the page
        chatBox.appendChild(msgEl);


        //Add a bit of auto scroll for the chat box
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    /* --- Code to SEND a socket message to the Server --- */
    // let nameInput = document.getElementById('name-input')
    let msgInput = document.getElementById('msg-input');
    let sendButton = document.getElementById('send-button');

    sendButton.addEventListener('click', function () {
        // let curName = nameInput.value;
        let curMsg = msgInput.value;


        let msgObj = {
            // "name": curName,
            "msg": curMsg,
            "textColor": textColor
        };

        //Send the message object to the server
        socket.emit('msg', msgObj);
        msgInput.value = '';
    });

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
});