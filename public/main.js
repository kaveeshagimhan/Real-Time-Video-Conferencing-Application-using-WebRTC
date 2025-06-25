const socket = io({
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});
let localStream;
let screenStream = null; // Stream for screen sharing
let isScreenSharing = false; // Track if screen sharing is active
let peerConnections = {}; // Store RTCPeerConnection objects for each peer
let roomId;
let username;
let peerUsernames = {}; // Store usernames of peers
let mediaRecorder; // For recording

// DOM Elements
const localVideo = document.getElementById("localVideo");
const joinButton = document.getElementById("joinButton");
const micButton = document.getElementById("micButton");
const cameraButton = document.getElementById("cameraButton");
const chatbox = document.getElementById("chatbox");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const screenShareButton = document.getElementById("screenShareButton");
const recordButton = document.getElementById("recordButton");
const leaveButton = document.getElementById("leaveButton");
const emojiButton = document.getElementById("emojiButton");
const emojiPicker = document.getElementById("emojiPicker");

// Create a room
function createRoom() {
    roomId = Math.random().toString(36).substring(2, 8); // Generate random room ID
    alert(`Room created! Share this ID with others: ${roomId}`);
    document.getElementById("room").value = roomId; // Pre-fill room ID in input field
}

// Join a room
async function joinRoom() {
    roomId = document.getElementById("room").value.trim();
    if (!roomId) {
        alert("Please enter a Room ID!");
        return;
    }
    username = document.getElementById("username").value || "Guest";
    try {
        // Close any existing peer connections
        Object.keys(peerConnections).forEach((userId) => {
            if (peerConnections[userId]) {
                peerConnections[userId].close();
                delete peerConnections[userId];
            }
            const oldVideoContainer = document.getElementById(`container-${userId}`);
            if (oldVideoContainer) {
                oldVideoContainer.remove();
            }
        });
        // Get local media stream
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        console.log("Accessed local media stream:", localStream);
        // Assign local stream to the local video element
        localVideo.srcObject = localStream;
        // Emit join-room event to the server
        socket.emit("join-room", roomId, username);
        document.getElementById("app").style.display = "block";
        document.getElementById("room-selection").style.display = "none";
        console.log("Joined room:", roomId);
        // Initialize button texts
        micButton.textContent = "Mute Mic";
        cameraButton.textContent = "Camera Off";
        screenShareButton.textContent = "Share Screen";
        recordButton.textContent = "Start Recording";
    } catch (error) {
        console.error("Error accessing media devices:", error);
        alert("Could not access camera or microphone. Please check permissions.");
    }
}

// Toggle microphone
function toggleMic() {
    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach(track => {
        track.enabled = !track.enabled;
        micButton.textContent = track.enabled ? "Mute Mic" : "Unmute Mic";
    });
}

// Toggle camera
function toggleCamera() {
    const videoTracks = localStream.getVideoTracks();
    videoTracks.forEach(track => {
        track.enabled = !track.enabled;
        cameraButton.textContent = track.enabled ? "Camera Off" : "Camera On";
    });
}

// Toggle screen sharing
async function toggleScreenShare() {
    if (!isScreenSharing) {
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            localVideo.srcObject = screenStream;
            isScreenSharing = true;
            screenShareButton.textContent = "Stop Sharing";
            replaceTrackWithScreenStream(screenStream);
        } catch (error) {
            console.error("Error accessing screen share:", error);
            alert("Could not access screen sharing. Please check permissions.");
        }
    } else {
        localVideo.srcObject = localStream;
        isScreenSharing = false;
        screenShareButton.textContent = "Share Screen";
        replaceTrackWithLocalStream();
    }
}

// Replace video track with screen stream
function replaceTrackWithScreenStream(screenStream) {
    const screenTrack = screenStream.getVideoTracks()[0];
    Object.values(peerConnections).forEach(peerConnection => {
        const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === "video");
        if (sender) {
            sender.replaceTrack(screenTrack);
        }
    });
}

// Replace video track with local stream
function replaceTrackWithLocalStream() {
    const localTrack = localStream.getVideoTracks()[0];
    Object.values(peerConnections).forEach(peerConnection => {
        const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === "video");
        if (sender) {
            sender.replaceTrack(localTrack);
        }
    });
}

// Start/stop recording
function startRecording() {
    if (!mediaRecorder) {
        const chunks = [];
        mediaRecorder = new MediaRecorder(localStream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "recording.webm";
            a.click();
            mediaRecorder = null;
        };

        mediaRecorder.start();
        recordButton.textContent = "Stop Recording";
    } else {
        mediaRecorder.stop();
        recordButton.textContent = "Start Recording";
    }
}

// Leave the room
function endCall() {
    socket.emit("leave-room");
    localStream.getTracks().forEach(track => track.stop());
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
    }
    Object.keys(peerConnections).forEach(userId => {
        peerConnections[userId].close();
        delete peerConnections[userId];
    });
    document.getElementById("videos").innerHTML = "";
    document.getElementById("app").style.display = "none";
    document.getElementById("room-selection").style.display = "block";
}

// Toggle emoji picker visibility
function toggleEmojiPicker() {
    const picker = document.getElementById("emojiPicker");
    picker.style.display = picker.style.display === "block" ? "none" : "block";
}

// Add an emoji to the message input field
function addEmoji(emoji) {
    messageInput.value += emoji;
    toggleEmojiPicker(); // Hide the emoji picker after selecting an emoji
}

// Send chat message
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        appendMessage(username, message, true);
        socket.emit("send-message", message);
        messageInput.value = "";
    }
}

// Append message to chatbox
function appendMessage(sender, text, isSelf = false) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    if (isSelf) {
        messageElement.classList.add("my-message");
    } else {
        messageElement.classList.add("receiver-message");
    }
    messageElement.innerHTML = `<div class="sender-name">${sender}</div><div>${text}</div>`;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight; // Auto-scroll to bottom
}

// Handle new user joining the room
socket.on("room-users", (existingUsers) => {
    console.log("Existing users in the room:", existingUsers);
    existingUsers.forEach(({ id, username }) => {
        addPeer(id, username);
        createOffer(id);
    });
});

// Add a peer and create a video container for them
function addPeer(userId, username) {
    if (!peerConnections[userId]) {
        const peerConnection = new RTCPeerConnection();
        peerConnections[userId] = peerConnection;

        peerConnection.ontrack = (event) => {
            console.log(`Received remote stream from ${userId}`);
            const remoteVideoElement = document.getElementById(`remote-${userId}`);
            if (remoteVideoElement) {
                remoteVideoElement.srcObject = event.streams[0];
            }
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", event.candidate, userId);
            }
        };

        // Add local tracks to the peer connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Create a video container for the peer
        const videoContainer = document.createElement("div");
        videoContainer.id = `container-${userId}`;
        videoContainer.className = "video-container";

        const remoteVideoElement = document.createElement("video");
        remoteVideoElement.id = `remote-${userId}`;
        remoteVideoElement.autoplay = true;
        remoteVideoElement.playsInline = true;
        videoContainer.appendChild(remoteVideoElement);

        // Add username label
        const usernameLabel = document.createElement("div");
        usernameLabel.className = "username-label";
        usernameLabel.textContent = username || "User"; // Use the provided username
        videoContainer.appendChild(usernameLabel);

        document.getElementById("videos").appendChild(videoContainer);

        // Store the username
        peerUsernames[userId] = username;
    }
}

// Create an offer for a specific peer
async function createOffer(userId) {
    const peerConnection = peerConnections[userId];
    if (peerConnection) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", peerConnection.localDescription, userId);
    }
}

// Handle incoming offers
socket.on("offer", async(offer, userId) => {
    console.log(`Received offer from ${userId}`);
    addPeer(userId, peerUsernames[userId]);
    const peerConnection = peerConnections[userId];
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", peerConnection.localDescription, userId);
});

// Handle incoming answers
socket.on("answer", async(answer, userId) => {
    console.log(`Received answer from ${userId}`);
    const peerConnection = peerConnections[userId];
    if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
    }
});

// Handle incoming ICE candidates
socket.on("ice-candidate", async(candidate, userId) => {
    console.log(`Received ICE candidate from ${userId}`);
    const peerConnection = peerConnections[userId];
    if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
});

// Remove remote participant's video when they disconnect
socket.on("user-disconnected", (userId, username) => {
    console.log(`User ${userId} disconnected`);
    const videoContainer = document.getElementById(`container-${userId}`);
    if (videoContainer) {
        videoContainer.remove();
    }
    delete peerUsernames[userId];
    // Close the peer connection
    const peerConnection = peerConnections[userId];
    if (peerConnection) {
        peerConnection.close();
        delete peerConnections[userId];
    }
});

// Receive chat messages from the server
socket.on("receive-message", ({ user, text, senderId }) => {
    appendMessage(user, text, false);
});