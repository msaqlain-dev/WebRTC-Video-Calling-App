import { useCallback, useEffect, useState, useRef } from "react";
import { useSocket } from "../providers/Socket";
import { usePeer } from "../providers/Peer";

const Room = () => {
  const { socket } = useSocket();
  const { peer, createOffer, createAnswer, setRemoteAnswer } = usePeer();
  const [socketConnected, setSocketConnected] = useState(false);
  const [roomUsers, setRoomUsers] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callState, setCallState] = useState("idle"); // idle, calling, answering, connected

  // Get user media
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add stream to peer connection
        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream);
        });

        console.log("Local media initialized");
      } catch (error) {
        console.error("Failed to get user media:", error);
      }
    };

    if (peer) {
      initializeMedia();
    }
  }, [peer]);

  // Handle incoming remote stream
  useEffect(() => {
    if (peer) {
      peer.ontrack = (event) => {
        console.log("Received remote track:", event.streams[0]);
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setCallState("connected");
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate");
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            target: roomUsers.find((user) => user !== socket.id), // Send to other user
          });
        }
      };
    }
  }, [peer, socket, roomUsers]);

  // Socket connection status
  useEffect(() => {
    if (socket) {
      setSocketConnected(socket.connected);

      const handleConnect = () => setSocketConnected(true);
      const handleDisconnect = () => setSocketConnected(false);

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
      };
    }
  }, [socket]);

  // Room management with simplified approach
  useEffect(() => {
    if (socket) {
      // When someone joins the room
      socket.on("room-users", (users) => {
        console.log("Room users updated:", users);
        setRoomUsers(users);

        // If we're the second user, automatically start the call
        if (users.length === 2 && users[1] === socket.id) {
          console.log("Second user joined, initiating call");
          startCall();
        }
      });

      // Direct WebRTC signaling
      socket.on("webrtc-offer", async (data) => {
        console.log("Received WebRTC offer");
        setCallState("answering");
        try {
          const answer = await createAnswer(data.offer);
          socket.emit("webrtc-answer", {
            answer,
            target: data.from,
          });
          console.log("Sent WebRTC answer");
        } catch (error) {
          console.error("Error handling offer:", error);
          setCallState("idle");
        }
      });

      socket.on("webrtc-answer", async (data) => {
        console.log("Received WebRTC answer");
        try {
          await setRemoteAnswer(data.answer);
          console.log("Set remote answer successfully");
        } catch (error) {
          console.error("Error setting answer:", error);
        }
      });

      socket.on("ice-candidate", async (data) => {
        console.log("Received ICE candidate");
        try {
          await peer.addIceCandidate(data.candidate);
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      });

      return () => {
        socket.off("room-users");
        socket.off("webrtc-offer");
        socket.off("webrtc-answer");
        socket.off("ice-candidate");
      };
    }
  }, [socket, createAnswer, setRemoteAnswer, peer]);

  const startCall = async () => {
    if (roomUsers.length < 2) {
      console.log("Waiting for another user...");
      return;
    }

    console.log("Starting call...");
    setCallState("calling");

    try {
      const offer = await createOffer();
      const targetUser = roomUsers.find((user) => user !== socket.id);

      socket.emit("webrtc-offer", {
        offer,
        target: targetUser,
        from: socket.id,
      });

      console.log("Sent WebRTC offer to:", targetUser);
    } catch (error) {
      console.error("Error starting call:", error);
      setCallState("idle");
    }
  };

  const endCall = () => {
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }
    setRemoteStream(null);
    setCallState("idle");

    // Reset peer connection
    peer.close();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>WebRTC Video Call</h2>

      <div style={{ marginBottom: "20px" }}>
        <p>Socket: {socketConnected ? "Connected" : "Disconnected"}</p>
        <p>Socket ID: {socket?.id}</p>
        <p>Users in room: {roomUsers.length}</p>
        <p>Call state: {callState}</p>
        <p>Peer state: {peer?.connectionState}</p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={startCall}
          disabled={callState !== "idle" || roomUsers.length < 2}
          style={{ marginRight: "10px" }}
        >
          Start Call
        </button>
        <button onClick={endCall} disabled={callState === "idle"}>
          End Call
        </button>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <div>
          <h3>Local Video</h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            style={{ width: "300px", height: "200px", backgroundColor: "#000" }}
          />
        </div>

        <div>
          <h3>Remote Video</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            style={{ width: "300px", height: "200px", backgroundColor: "#000" }}
          />
        </div>
      </div>

      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        <h4>Debug Info:</h4>
        <p>Local stream: {localStream ? "Active" : "None"}</p>
        <p>Remote stream: {remoteStream ? "Active" : "None"}</p>
        <p>Room users: {JSON.stringify(roomUsers)}</p>
      </div>
    </div>
  );
};

export default Room;
