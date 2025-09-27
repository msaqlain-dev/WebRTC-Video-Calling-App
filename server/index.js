const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    // origin: ["http://localhost:3000", "http://localhost:5173"],
    origin: "*", // In production, specify your frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Simple room management
const rooms = new Map(); // roomId -> Set of socket IDs

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (data) => {
    const { roomId, email } = data;
    console.log(`${email} (${socket.id}) joining room ${roomId}`);

    // Join the socket.io room
    socket.join(roomId);

    // Track users in our rooms map
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);

    // Store user info on socket
    socket.email = email;
    socket.roomId = roomId;

    // Send confirmation
    socket.emit("joined-room", { roomId });

    // Send updated user list to ALL users in room
    const roomUsers = Array.from(rooms.get(roomId));
    io.to(roomId).emit("room-users", roomUsers);

    console.log(`Room ${roomId} now has users:`, roomUsers);
  });

  // Direct WebRTC signaling - much simpler
  socket.on("webrtc-offer", (data) => {
    console.log(`Forwarding offer from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit("webrtc-offer", {
      offer: data.offer,
      from: socket.id,
    });
  });

  socket.on("webrtc-answer", (data) => {
    console.log(`Forwarding answer from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit("webrtc-answer", {
      answer: data.answer,
      from: socket.id,
    });
  });

  socket.on("ice-candidate", (data) => {
    console.log(`Forwarding ICE candidate from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit("ice-candidate", {
      candidate: data.candidate,
      from: socket.id,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Clean up room
    if (socket.roomId && rooms.has(socket.roomId)) {
      rooms.get(socket.roomId).delete(socket.id);

      // Update remaining users
      const roomUsers = Array.from(rooms.get(socket.roomId));
      socket.to(socket.roomId).emit("room-users", roomUsers);

      // Remove empty rooms
      if (roomUsers.length === 0) {
        rooms.delete(socket.roomId);
      }

      console.log(`Room ${socket.roomId} now has users:`, roomUsers);
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    connectedUsers: io.engine.clientsCount,
    activeRooms: rooms.size,
  });
});

server.listen(8001, () => {
  console.log("Simple WebRTC server running on port 8001");
});

app.listen(8000, () => {
  console.log("HTTP server running on port 8000");
});
