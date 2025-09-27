import { createContext, useContext, useMemo, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = (props) => {
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const socket = useMemo(() => {
    console.log("Creating new socket connection to localhost:8001...");

    // Prevent multiple socket creation in React Strict Mode
    if (window.socketInstance && window.socketInstance.connected) {
      console.log(
        "Reusing existing socket connection:",
        window.socketInstance.id
      );
      return window.socketInstance;
    }

    const socketInstance = io("http://localhost:8001", {
      transports: ["websocket", "polling"], // Try websocket first, fallback to polling
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000, // 10 second timeout
      forceNew: true, // Force a new connection
    });

    // Store globally to prevent duplicates
    window.socketInstance = socketInstance;

    socketInstance.on("connect", () => {
      console.log("Socket connected with ID:", socketInstance.id);
      setConnectionStatus("connected");
      setReconnectAttempts(0);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket disconnected. Reason:", reason);
      setConnectionStatus("disconnected");

      if (reason === "io server disconnect") {
        // Server disconnected us, try to reconnect manually
        console.log("Server disconnected, attempting manual reconnect...");
        socketInstance.connect();
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setConnectionStatus("error");

      // Log specific error types
      if (error.message.includes("websocket")) {
        console.log("WebSocket failed, Socket.IO will try polling...");
      }
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      setConnectionStatus("connected");
      setReconnectAttempts(0);
    });

    socketInstance.on("reconnect_attempt", (attemptNumber) => {
      console.log("Reconnection attempt #", attemptNumber);
      setReconnectAttempts(attemptNumber);
      setConnectionStatus("reconnecting");
    });

    socketInstance.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error.message);
    });

    socketInstance.on("reconnect_failed", () => {
      console.error("All reconnection attempts failed");
      setConnectionStatus("failed");
    });

    // Test connection after a short delay
    setTimeout(() => {
      if (!socketInstance.connected) {
        console.log("Socket not connected after timeout, checking server...");
        fetch("http://localhost:8001/health")
          .then((response) => response.json())
          .then((data) => {
            console.log("Server health check passed:", data);
          })
          .catch((error) => {
            console.error("Server health check failed:", error.message);
            console.log("Make sure your server is running on port 8001");
          });
      }
    }, 3000);

    return socketInstance;
  }, []); // Empty dependency array ensures it's only created once

  // Cleanup socket when component unmounts
  useEffect(() => {
    return () => {
      console.log("Cleaning up socket connection...");
      if (socket && socket.connected) {
        socket.disconnect();
        window.socketInstance = null;
      }
    };
  }, [socket]);

  // Debug connection status
  useEffect(() => {
    console.log("Socket connection status:", connectionStatus);
    if (reconnectAttempts > 0) {
      console.log("Reconnect attempts:", reconnectAttempts);
    }
  }, [connectionStatus, reconnectAttempts]);

  const contextValue = {
    socket,
    connectionStatus,
    reconnectAttempts,
    isConnected: socket?.connected || false,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {props.children}
    </SocketContext.Provider>
  );
};
