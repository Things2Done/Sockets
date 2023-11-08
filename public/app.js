const API_KEY = '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';
const API_URL = 'https://api.openai.com/v1/chat/completions';

/* --- Code to SEND a socket message to the Server --- */
// let nameInput = document.getElementById('name-input')
let msgInput = document.getElementById('msg-input');
let sendButton = document.getElementById('send-button');
let chatBox = document.getElementById('chat-box-msgs');
let textColor;

// const generate = async () => {

//     try {
//         console.log("Sending message to OpenAI:", msgInput.value);  // Log the message being sent

//         const response = await fetch(API_URL, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${API_KEY}`
//             },
//             body: JSON.stringify({
//                 model: "gpt-3.5-turbo",
//                 messages: [
//                     {  "role": "system",
//                         "content": "You are a brilliant stand-up comedian who is a master of all elements of humor, timing, delivery and misdirection. Your mission is to take whatever is said by the user before you and add a sentence and a half of humor ending in a cliff hanger"
//                       },
//                     { 
//                     role: "user", 
//                     content: msgInput.value }],
//             })
//         })
        
//         const data = await response.json();
        
//         console.log("Received response from OpenAI:", data);
//           // Check if the response contains the expected data
//           if (data.choices && data.choices.length > 0 && data.choices[0].message.content) {
//             const responseText = data.choices[0].message.content.trim();
//             console.log("ChatGPT response text:", responseText);  // Log the text response from ChatGPT


//         const responseMsg = document.createElement('span');
//         responseMsg.style.color = textColor;
//         responseMsg.innerText = data.choices[0].message.content;
//         chatBox.appendChild(responseMsg);
//         socket.emit('msg', { 
//             name: 'GPT-3.5', 
//             msg: data.choices[0].message.content, 
//             textColor: textColor
//         });
//     } else {
//         console.error("Unexpected response structure from OpenAI:", data);
//     }
//     } catch (error) {
//         console.error("Error: ", error);
//     }
// }

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



    //Listen for messages named 'msg' from the server
    socket.on('msg', function (data) {
        console.log("Message arrived!");
        console.log(data);

        //Create a message string and page element
        // let receivedMsg = data.name + ": " + data.msg;
        let receivedMsg = data.msg + " ";
        let msgEl = document.createElement('span');


        msgEl.style.color = data.textColor;
        msgEl.innerHTML = receivedMsg;

        //Add the element with the message to the page
        chatBox.appendChild(msgEl);

        //Add a bit of auto scroll for the chat box
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    sendButton.addEventListener('click', async function () {

        if (!msgInput.disabled) {
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
            
            // await generate(); 

            msgInput.disabled = true;
            msgInput.placeholder = "Wait for your turn..."
        }

    });

  
});
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}