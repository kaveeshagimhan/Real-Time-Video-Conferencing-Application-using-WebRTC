const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {

        origin: "https://your-firebase-app.web.app", // Allow only Firebase app
        origin: "*",
        methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
});

app.use(express.static("public"));

const rooms = {};

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    let currentRoom = null;

    socket.on("join-room", (roomId, username) => {
        if (!rooms[roomId]) {
            return socket.emit("room-not-found", "This room does not exist.");
        }

        console.log(`User ${socket.id} attempting to join room ${roomId}`);
        currentRoom = roomId;

        socket.join(roomId);
        rooms[roomId].push({
            id: socket.id,
            username: username || "Guest",
        });

        socket.to(roomId).emit("user-connected", socket.id, username);

        const otherUsers = rooms[roomId].filter((user) => user.id !== socket.id);
        socket.emit("room-users", otherUsers);
    });

    // Handle joining a room
    socket.on("join-room", (roomId, username) => {
        console.log(`User ${socket.id} attempting to join room ${roomId}`);

        currentRoom = roomId;

        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }

        // Add the user to the room
        socket.join(roomId);
        rooms[roomId].push({
            id: socket.id,
            username: username || "Guest", // Use provided username or default to "Guest"
        });

        // Notify existing users about the new user
        socket.to(roomId).emit("user-connected", socket.id, username);

        // Emit existing users in the room to the newly joined user
        const otherUsers = rooms[roomId].filter((user) => user.id !== socket.id);
        socket.emit("room-users", otherUsers);

        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // Handle sending chat messages
    socket.on("send-message", (message) => {
        if (!currentRoom) return;

        const roomUsers = rooms[currentRoom];
        const user = roomUsers && roomUsers.find(u => u.id === socket.id);
        const username = user ? user.username : "Guest";

        const isHost = roomUsers && roomUsers.length > 0 && roomUsers[0].id === socket.id;
        const displayName = username + (isHost ? " (Host)" : "");

        socket.to(currentRoom).emit("receive-message", {
            user: displayName,
            text: message,
            senderId: socket.id,
        });
    });

    // Handle WebRTC signaling: Offer
    socket.on("offer", (offer, targetId) => {
        console.log(`Forwarding offer from ${socket.id} to ${targetId}`);
        socket.to(targetId).emit("offer", offer, socket.id);
    });

    // Handle WebRTC signaling: Answer
    socket.on("answer", (answer, targetId) => {
        console.log(`Forwarding answer from ${socket.id} to ${targetId}`);
        socket.to(targetId).emit("answer", answer, socket.id);
    });

    // Handle WebRTC signaling: ICE Candidate
    socket.on("ice-candidate", (candidate, targetId) => {
        console.log(`Forwarding ICE candidate from ${socket.id} to ${targetId}`);
        socket.to(targetId).emit("ice-candidate", candidate, socket.id);
    });

    // Handle leaving a room
    socket.on("leave-room", () => {
        handleDisconnect();
    });

    // Handle user disconnection
    const handleDisconnect = () => {
        if (currentRoom && rooms[currentRoom]) {
            console.log(`User ${socket.id} left room ${currentRoom}`);

            const roomUsers = rooms[currentRoom];
            const user = roomUsers && roomUsers.find(u => u.id === socket.id);
            const username = user ? user.username : "Guest";

            // Remove the user from the room
            rooms[currentRoom] = roomUsers.filter((user) => user.id !== socket.id);

            if (rooms[currentRoom].length === 0) {
                delete rooms[currentRoom];
            } else {
                socket.to(currentRoom).emit("user-disconnected", socket.id, username);
            }

            socket.leave(currentRoom);
            currentRoom = null;
        }
    };

    socket.on("disconnect", handleDisconnect);
});

// Server error handling
server.on("error", (error) => {
    console.error("Server error:", error);
});

// Start the server
const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});