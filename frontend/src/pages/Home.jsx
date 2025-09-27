import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../providers/Socket";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { socket, connectionStatus } = useSocket();
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
    if (!email.trim() || !roomId.trim()) {
      alert("Please fill in both email and room code");
      return;
    }
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

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      case "reconnecting":
        return "text-orange-500";
      case "error":
      case "failed":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return "🟢";
      case "connecting":
        return "🟡";
      case "reconnecting":
        return "🟠";
      case "error":
      case "failed":
        return "🔴";
      default:
        return "⚫";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WebRTC Video Call
          </h1>
          <p className="text-gray-600">
            Connect with others through secure video calls
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-6 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg">{getConnectionStatusIcon()}</span>
            <span
              className={`text-sm font-medium ${getConnectionStatusColor()}`}
            >
              {connectionStatus.charAt(0).toUpperCase() +
                connectionStatus.slice(1)}
            </span>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isJoining}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 text-lg"
                aria-label="Email address"
              />
            </div>

            {/* Room Code Input */}
            <div>
              <label
                htmlFor="roomId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Room Code
              </label>
              <input
                id="roomId"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room code"
                disabled={isJoining}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 text-lg"
                aria-label="Room code"
              />
            </div>

            {/* Join Button */}
            <button
              onClick={handleJoinRoom}
              disabled={isJoining || connectionStatus !== "connected"}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-lg flex items-center justify-center space-x-2"
            >
              {isJoining ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Enter Room</span>
                </>
              )}
            </button>

            {connectionStatus !== "connected" && (
              <p className="text-center text-sm text-gray-500">
                Waiting for server connection...
              </p>
            )}
          </div>
        </div>

        {/* Quick Demo Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-2">Want to learn how WebRTC works?</p>
          <button
            onClick={() => navigate("/simple-demo")}
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Try the Step-by-Step Demo →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
