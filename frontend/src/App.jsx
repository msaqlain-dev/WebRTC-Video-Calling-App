import "./App.css";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Room from "./pages/Room";
import { SocketProvider } from "./providers/Socket";
import { PeerProvider } from "./providers/Peer";
import WebRTCDemo from "./pages/WebRTCDemo";

function App() {
  return (
    <>
      <SocketProvider>
        <PeerProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="/simple-demo" element={<WebRTCDemo />} />
          </Routes>
        </PeerProvider>
      </SocketProvider>
    </>
  );
}

export default App;
