import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../providers/Socket";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { socket } = useSocket();
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate("");

  const handleRoomJoined = useCallback(
    ({ roomId }) => {
      setIsJoining(false);
      console.log("Room Joined:", roomId);
      navigate(`/room/${roomId}`);
    },
    [navigate]
  );

  const handleJoinRoom = useCallback(() => {
    setIsJoining(true);
    socket.emit("join-room", { roomId, email });
  }, [email, roomId, socket]);

  useEffect(() => {
    if (socket) {
      socket.on("joined-room", handleRoomJoined);

      return () => {
        socket.off("joined-room", handleRoomJoined);
      };
    }
  }, [socket, handleRoomJoined]);

  return (
    <div className="homepage-container">
      <div className="input-container">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Enter your email"
          disabled={isJoining}
          aria-label="Email address"
        />
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          type="text"
          placeholder="Enter room code"
          disabled={isJoining}
          aria-label="Room code"
        />
        <button onClick={handleJoinRoom} disabled={isJoining}>
          {isJoining ? "Joining..." : "Enter Room"}
        </button>
      </div>
    </div>
  );
};

export default Home;
