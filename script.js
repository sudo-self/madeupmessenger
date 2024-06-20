const firebaseConfig = {
    apiKey: "AIzaSyCF5YRke_9RzuQOONX1vFB05xH8PngENqc",
    authDomain: "svelte-forever.firebaseapp.com",
    databaseURL: "https://svelte-forever-default-rtdb.firebaseio.com",
    projectId: "svelte-forever",
    storageBucket: "svelte-forever.appspot.com",
    messagingSenderId: "226934196830",
    appId: "1:226934196830:web:b6b49ea005be128a26c2cf",
    measurementId: "G-Y492VJ0ZMC"
};


firebase.initializeApp(firebaseConfig);
const database = firebase.database().ref('messages');
const storage = firebase.storage();

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    const nameInput = document.getElementById('nameInput');
    const name = nameInput.value.trim() || 'Visitor';
    const avatarRadio = document.querySelector('input[name="avatar"]:checked');
    const fileInput = document.querySelector('input[type="file"][name="avatar"]');

    if (message !== '') {
        const timestamp = Date.now();
        
        const messageData = {
            text: message,
            name: name
        };

        if (avatarRadio && !fileInput.files.length) {
            messageData.avatar = avatarRadio.value;
            sendMessageToDatabase(messageData, timestamp);
        } else if (fileInput.files.length) {
            const file = fileInput.files[0];
            const storageRef = storage.ref();
            const imageRef = storageRef.child(`avatars/${file.name}`);

            imageRef.put(file).then((snapshot) => {
                snapshot.ref.getDownloadURL().then((downloadURL) => {
                    messageData.avatar = downloadURL;
                    sendMessageToDatabase(messageData, timestamp);
                    clearAvatarPreview();
                });
            });
        } else {
            alert('select an avatar or upload your own.');
        }

        messageInput.value = '';
    } else {
        alert('Please enter a message.');
    }
}

function sendMessageToDatabase(messageData, timestamp) {
    database.push({
        ...messageData,
        timestamp: timestamp
    });
}

function displayMessage(message) {
    const messageContainer = document.getElementById('messageContainer');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message-container');
    
    if (message.sentByCurrentUser) {
        messageElement.classList.add('sent');
    } else {
        messageElement.classList.add('received');
    }
    
    messageElement.innerHTML = `
        <div class="user-info">
            <img src="${message.avatar}" class="avatar" alt="Avatar">
            <div class="user-name">${message.name}</div>
        </div>
        <div class="message">${message.text}</div>
        <div class="timestamp">${formatTimestamp(message.timestamp)}</div>
    `;
    
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function previewCustomAvatar(event) {
    const file = event.target.files[0];
    const avatarPreview = document.getElementById('avatarPreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            avatarPreview.src = event.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        clearAvatarPreview();
    }
}

function clearAvatarPreview() {
    const avatarPreview = document.getElementById('avatarPreview');
    avatarPreview.src = '';
}

function uploadCustomAvatar() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length) {
        const file = fileInput.files[0];
        const storageRef = storage.ref();
        const imageRef = storageRef.child(`avatars/${file.name}`);

        imageRef.put(file).then((snapshot) => {
            snapshot.ref.getDownloadURL().then((downloadURL) => {
                const messageData = {
                    avatar: downloadURL,
                    name: 'Visitor'
                };
                sendMessageToDatabase(messageData, Date.now());
                clearAvatarPreview();
            });
        });
    } else {
        alert('Please select a file to upload.');
    }
}

database.on('child_added', (data) => {
    const message = data.val();
    message.sentByCurrentUser = (message.name === 'visitor');
    
    displayMessage(message);
});
