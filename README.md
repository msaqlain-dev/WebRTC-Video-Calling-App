# WebRTC Video Calling App

A WebRTC video calling application built with React and Node.js, designed for learning and experimentation. Features both an automated calling system and a step-by-step educational demo perfect for understanding how WebRTC works under the hood.

## What's Inside

### 🎥 Video Calling App
Join rooms with friends for instant video calls. Just enter your email and a room code to get started.

### 📚 Educational Demo  
Learn how WebRTC works under the hood with our step-by-step demo that shows the connection process in detail.

## Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd server
npm install
```

### 2. Start the Servers

**Backend (Terminal 1):**
```bash
cd server
npm start
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

### 3. Open the App
Visit `http://localhost:5173` in your browser

## How to Use

### Making Video Calls

1. Open the app in two browser tabs (or share with a friend)
2. Enter your email and create a room code
3. Share the room code with the other person
4. Both users click "Enter Room"
5. Video call starts automatically!

### Learning WebRTC (Educational Demo)

1. Click "Try the Step-by-Step Demo" on the home page
2. Open in two browser tabs
3. Follow the guided steps to manually create a WebRTC connection
4. See exactly how browsers negotiate connections

## Technology Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Socket.IO
- **Real-time**: WebRTC for video, Socket.IO for signaling

## File Structure

```
WebRTC-Video-Calling-App/
├── frontend/                 # React application
│   ├── src/
│   │   ├── pages/           # Main app pages
│   │   │   ├── Home.jsx     # Room entry page
│   │   │   ├── Room.jsx     # Video calling interface
│   │   │   └── WebRTCDemo.jsx  # Educational demo
│   │   ├── providers/       # React contexts
│   │   │   ├── Socket.jsx   # WebSocket management
│   │   │   └── Peer.jsx     # WebRTC connection handling
│   │   └── App.jsx         # Main router
│   └── package.json
├── server/                  # Node.js signaling server
│   ├── index.js            # Socket.IO server
│   └── package.json
└── README.md
```

## Browser Requirements

- Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- Camera and microphone permissions
- Two browsers/devices for testing

## Troubleshooting

### No Video Appearing?
- Check camera/microphone permissions in your browser
- Make sure both users are in the same room
- Refresh the page and try again

### Connection Issues?
- Verify the backend server is running on port 8001
- Check browser console for error messages
- Ensure you're using a supported browser

### Can't Connect to Room?
- Make sure both users enter the exact same room code
- Check that Socket.IO connection shows "Connected" status

## Project Status

**Current Level: Educational/Basic Implementation**

This project is designed for learning and experimentation. It includes:
- Basic WebRTC peer-to-peer video calling
- Socket.IO signaling server
- Educational step-by-step demo
- Modern React UI with Tailwind CSS

**What's Included:**
- ✅ Working video calls between two users
- ✅ Educational demo showing WebRTC concepts
- ✅ Clean, responsive UI design
- ✅ Basic room-based calling system

**What's Missing for Production:**
- 🔒 Authentication and user management
- 🛡️ Security features (rate limiting, validation)
- 🌐 TURN servers for restrictive networks
- 📊 Error handling and monitoring
- 🔧 Multi-user support (more than 2 people)
- 📱 Mobile optimization
- 🗄️ Database integration
- ⚡ Performance optimizations

## What You'll Learn
- Peer-to-peer video connections
- How browsers negotiate connections
- The role of signaling servers
- ICE candidates and STUN servers

### Real-World Implementation
- Managing user media (camera/microphone)
- Handling connection states
- Error handling and user feedback
- Modern React patterns with hooks

## Development Tips

### Debugging
- Open browser console to see detailed logs
- Use `chrome://webrtc-internals/` for advanced debugging
- Check Network tab for WebSocket connection status

### Testing
- Test with different browsers
- Try on different devices/networks
- Test camera/microphone permissions

## Making it Production-Ready

If you want to enhance this for production use, consider these improvements:

### Security Enhancements
- Add user authentication (JWT tokens, OAuth)
- Implement rate limiting on signaling server
- Add input validation and sanitization
- Use HTTPS/WSS in production

### Scalability Features
- Add TURN servers for NAT traversal
- Implement horizontal scaling for signaling server
- Add database for user management and call logs
- Support for multiple participants per room

### User Experience
- Add chat messaging during calls
- Screen sharing capabilities
- Call recording functionality
- Mobile app versions

### Infrastructure
- Docker containerization
- Load balancing setup
- Monitoring and logging
- Automated testing suite

## Contributing

Found a bug or want to add a feature? Pull requests are welcome!

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source

---

**Perfect for**: Learning WebRTC, building video calling features, understanding real-time web technologies, or as a starting point for your own video calling application.