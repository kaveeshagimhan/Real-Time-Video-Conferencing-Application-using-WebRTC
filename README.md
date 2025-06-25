<<<<<<< HEAD
# WebRTC Video Conferencing App

A real-time video conferencing web application built with WebRTC, Socket.IO, and Express, featuring room creation, video chat, screen sharing, chat messaging, emoji support, and media recording.

Live Demo: https://webrtc-25c52.web.app

Video Demonstration: https://youtu.be/Rb-awdOzcHU

## Project Overview

This project demonstrates the capabilities of WebRTC (Web Real-Time Communication) to establish peer-to-peer communication between users via video, audio, and data channels. It integrates real-time signaling using Socket.IO and a custom Express backend hosted on Railway, while the frontend is deployed on Firebase Hosting.

## Features
 
🔗 Room Creation/Joining: Join a room via a unique ID.

🎥 Video & Audio Chat: Connect with peers via live video and audio.

📤 Screen Sharing: Share your screen with others in the room.

💬 Real-time Chat: Send and receive text messages instantly.

😀 Emoji Picker: Add fun and expressiveness to your messages.

🎙️ Media Controls: Toggle microphone, camera, and screen sharing.

📹 Recording: Record your video stream locally (in-browser).

## Technologies Used

### Frontend:

- HTML, CSS, JavaScript
  
- Socket.IO-client
  
- WebRTC APIs
  
- Emoji Picker
  
- Realtime DOM manipulation
  
### Backend:

- Node.js
  
- Express
  
- Socket.IO (for signaling)
  
- Hosted on Railway
  
### Deployment:

- Firebase Hosting (Frontend)
  
- Railway (Backend)
  
**Project Structure**

├── public/

│   ├── index.html 

│   ├── main.css 

│   ├── main.js

│   └── 404.html 

├── server.js    

├── package.json   


**Getting Started Locally**

Clone the repository:

                      git clone https://github.com/kaveeshagimhan/Real-Time-Video-Conferencing-Application-using-WebRTC.git

                      cd webrtc-video-app
Install dependencies:

                      npm install

Run the backend server:

                      node server.js

Open public/index.html in your browser or host locally using Firebase:

                      firebase serve


## Deployment

### Frontend: Deployed using Firebase Hosting.

   - Set public/ as the hosting directory.

### Backend: Hosted on Railway using server.js.

## Challenges & Learnings

- WebRTC Signaling: Implemented custom signaling logic using Socket.IO.

- Peer Connections: Managed connection lifecycle and ICE candidate exchange.

- Media Permissions: Handled browser permissions and fallback cases.

- Screen Sharing Compatibility: Dealt with varying browser APIs.

- Recording with MediaRecorder API: Learned to buffer and save media streams.

## License

This project is for educational purposes as part of a university WebRTC assignment.
=======
WebRTC
>>>>>>> 98b4e44 (Update video showes in other users)
