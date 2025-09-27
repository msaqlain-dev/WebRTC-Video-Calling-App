import { useCallback, useEffect, useState, useRef } from "react";
import { useSocket } from "../providers/Socket";
import { usePeer } from "../providers/Peer";
import { useNavigate } from "react-router-dom";

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
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const navigate = useNavigate();

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
            target: roomUsers.find((user) => user !== socket.id),
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

  // Room management
  useEffect(() => {
    if (socket) {
      socket.on("room-users", (users) => {
        console.log("Room users updated:", users);
        setRoomUsers(users);

        if (users.length === 2 && users[1] === socket.id) {
          console.log("Second user joined, initiating call");
          startCall();
        }
      });

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
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setRemoteStream(null);
    setLocalStream(null);
    setCallState("idle");
    navigate("/");
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const getCallStateColor = () => {
    switch (callState) {
      case "connected":
        return "text-green-500";
      case "calling":
        return "text-yellow-500";
      case "answering":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const getCallStateIcon = () => {
    switch (callState) {
      case "connected":
        return "📞";
      case "calling":
        return "📱";
      case "answering":
        return "📲";
      default:
        return "⏸️";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-xl font-semibold">Video Call Room</h1>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm text-gray-300">
                {socketConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getCallStateIcon()}</span>
              <span className={`text-sm font-medium ${getCallStateColor()}`}>
                {callState.charAt(0).toUpperCase() + callState.slice(1)}
              </span>
            </div>
            <div className="text-sm text-gray-300">
              Users: {roomUsers.length}/2
            </div>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 p-6">
        {/* Waiting State */}
        {roomUsers.length < 2 && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                Waiting for another user...
              </h2>
              <p className="text-gray-400">
                Share the room code with someone to start the call
              </p>
              <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-300">
                  Room ID:{" "}
                  <span className="font-mono text-blue-400">
                    {window.location.pathname.split("/").pop()}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Video Call Interface */}
        {roomUsers.length >= 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-xl overflow-hidden">
              <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 rounded-lg px-3 py-1">
                <span className="text-sm font-medium">You</span>
              </div>
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center z-5">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">Camera Off</p>
                  </div>
                </div>
              )}
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
            </div>

            {/* Remote Video */}
            <div className="relative bg-gray-800 rounded-xl overflow-hidden">
              <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 rounded-lg px-3 py-1">
                <span className="text-sm font-medium">Remote User</span>
              </div>
              {!remoteStream && callState === "connected" && (
                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">No Video</p>
                  </div>
                </div>
              )}
              {!remoteStream && callState !== "connected" && (
                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-pulse w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">Connecting...</p>
                  </div>
                </div>
              )}
              <video
                ref={remoteVideoRef}
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Control Panel */}
        {roomUsers.length >= 2 && (
          <div className="mt-6 flex items-center justify-center space-x-4">
            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-colors ${
                isAudioEnabled
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
              title={isAudioEnabled ? "Mute" : "Unmute"}
            >
              {isAudioEnabled ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0L18.485 7.757a1 1 0 010 1.414L16.071 11.585a1 1 0 11-1.414-1.414L15.414 9.414l-.757-.757a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-colors ${
                isVideoEnabled
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
              title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoEnabled ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 14V7a1 1 0 00-1.447-.894L15 7.382V6a2 2 0 00-2-2H9.382l-.724-.724A1 1 0 007.236 2.293zM2 6a2 2 0 012-2h2.764l2 2H4v8h8.764l2 2H4a2 2 0 01-2-2V6z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            {/* Manual Call Start (if needed) */}
            {callState === "idle" && (
              <button
                onClick={startCall}
                disabled={roomUsers.length < 2}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-full font-medium transition-colors"
              >
                Start Call
              </button>
            )}

            {/* End Call */}
            <button
              onClick={endCall}
              className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
              title="End call"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 14V7a1 1 0 00-1.447-.894L15 7.382V6a2 2 0 00-2-2H9.382l-.724-.724A1 1 0 007.236 2.293zM2 6a2 2 0 012-2h2.764l2 2H4v8h8.764l2 2H4a2 2 0 01-2-2V6z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;
