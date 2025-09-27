# WebRTC Learning Project

A comprehensive WebRTC implementation built for educational purposes, featuring both an automated video calling system and a step-by-step manual demo perfect for teaching WebRTC fundamentals.

## Project Overview

This project contains two main components:

1. **Automated WebRTC Room System** - Full-featured video calling with Socket.IO signaling
2. **Educational WebRTC Demo** - Manual SDP exchange for learning core concepts

## Features

### Automated Room System (`/room/:roomId`)

- Real-time video calling between users
- Socket.IO-based signaling server
- Automatic call initiation when users join
- ICE candidate exchange
- Room management with user tracking

### Educational Demo (`/simple-demo`)

- Step-by-step WebRTC connection process
- Manual SDP (Session Description Protocol) exchange
- Visual demonstration of offer/answer model
- ICE candidate collection and exchange
- Perfect for teaching WebRTC fundamentals

## Tech Stack

### Frontend

- **React 18** with Vite
- **React Router** for navigation
- **Socket.IO Client** for real-time communication
- **WebRTC APIs** for peer-to-peer connections

### Backend

- **Node.js** with Express
- **Socket.IO** for WebSocket communication
- Simple HTTP server for API endpoints

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Two browsers (Chrome, Firefox, Edge) for testing

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd webrtc-learning-project
```

2. **Install frontend dependencies**

```bash
npm install
```

3. **Install backend dependencies**

```bash
cd server
npm install
```

### Running the Application

1. **Start the backend server**

```bash
cd server
node index.js
```

The server will run on:

- Socket.IO: `http://localhost:8001`
- HTTP API: `http://localhost:8000`

2. **Start the frontend development server**

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage Guide

### Room-Based Video Calling

1. Navigate to the home page (`/`)
2. Enter your email and a room code
3. Click "Enter Room"
4. Share the same room code with another user
5. Video call will automatically start when both users are connected

### Educational Demo

1. Navigate to `/simple-demo`
2. **For Host (First User):**
   - Click "Be Host"
   - Click "Create Offer"
   - Copy the offer data
   - Share with Guest user
3. **For Guest (Second User):**
   - Click "Be Guest"
   - Paste Host's offer data
   - Click "Create Answer"
   - Copy answer data
   - Share with Host user
4. **Complete Connection (Host):**
   - Paste Guest's answer data
   - Click "Set Answer & Connect"
   - Video connection established!

## Project Structure

```
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── Home.jsx           # Room entry page
│   │   ├── Room.jsx           # Automated video calling
│   │   └── WebRTCDemo.jsx     # Educational demo
│   ├── providers/
│   │   ├── Socket.jsx         # Socket.IO context
│   │   └── Peer.jsx          # WebRTC peer context
│   └── App.jsx               # Main router
├── server/
│   └── index.js              # Socket.IO signaling server
└── README.md
```

## Key Learning Concepts

### WebRTC Fundamentals

- **RTCPeerConnection**: Core API for peer-to-peer connections
- **MediaDevices**: Camera and microphone access
- **ICE Candidates**: Network discovery and NAT traversal
- **STUN Servers**: Public IP discovery for NAT traversal

### Signaling Process

1. **Offer Creation**: Host creates SDP offer describing capabilities
2. **Offer Exchange**: Offer sent to remote peer via signaling channel
3. **Answer Creation**: Remote peer creates SDP answer
4. **Answer Exchange**: Answer sent back to host
5. **ICE Exchange**: Network candidates exchanged
6. **Connection Established**: Media flows peer-to-peer

### Real-World vs Demo

- **Demo**: Manual copy-paste of SDP for education
- **Real App**: Automated SDP exchange via WebSocket server

## Debugging Tips

### Common Issues

1. **No Remote Video**: Check browser permissions for camera/microphone
2. **Connection Failed**: Verify STUN server accessibility
3. **Socket Disconnects**: Check server is running on port 8001
4. **ICE Failures**: May need TURN server for restrictive networks

### Debug Tools

- Browser console shows detailed WebRTC logs
- Network tab shows WebSocket connection status
- `chrome://webrtc-internals/` for detailed WebRTC debugging

## Browser Support

### Tested Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Permissions

- Camera access
- Microphone access
- Secure context (HTTPS in production)

## Educational Use

This project is specifically designed for teaching WebRTC concepts:

### For Instructors

- Use `/simple-demo` to show manual SDP exchange
- Demonstrate state transitions in browser console
- Explain difference between signaling and media channels
- Show ICE candidate generation in real-time

### For Students

- Follow step-by-step process in educational demo
- Examine SDP content to understand capabilities exchange
- Observe connection state changes
- Learn difference between local and remote descriptions

## Development Notes

### React Context Usage

- `SocketProvider`: Manages WebSocket connections
- `PeerProvider`: Handles RTCPeerConnection lifecycle

### State Management

- Connection states tracked for UI feedback
- Media streams managed via refs
- Room membership tracked server-side

### Error Handling

- Comprehensive logging for debugging
- Graceful degradation for failed connections
- User-friendly error messages

## Production Considerations

### Security

- Implement user authentication
- Validate room access permissions
- Use HTTPS for secure contexts

### Scalability

- Add TURN servers for enterprise networks
- Implement connection quality monitoring
- Add bandwidth adaptation

### Features

- Screen sharing capability
- Chat messaging
- Recording functionality
- Multiple participants (mesh or SFU)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Resources

### WebRTC Documentation

- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC.org](https://webrtc.org/)

### Related Technologies

- [Socket.IO Documentation](https://socket.io/docs/)
- [React Documentation](https://react.dev/)

**Perfect for**: WebRTC workshops, developer training sessions, computer science courses, and anyone learning real-time communication technologies.
