import { useRef, useState, useEffect } from "react";

// A simple WebRTC demo to teach the basics of peer-to-peer video calls.
// This code uses manual SDP and ICE candidate exchange for educational purposes.
// In real apps, a signaling server (e.g., WebSocket) automates this exchange.

const WebRTCDemo = () => {
  // State to track if user is Host (creates offer) or Guest (creates answer)
  const [isHost, setIsHost] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  // State for the exchange data (SDP + ICE candidates)
  const [localExchangeData, setLocalExchangeData] = useState(""); // Host's offer or Guest's answer + candidates
  const [remoteExchangeData, setRemoteExchangeData] = useState(""); // Pasted data from other peer

  // Refs to store video elements and WebRTC objects
  const localVideoRef = useRef(null); // Local camera feed
  const remoteVideoRef = useRef(null); // Remote peer's feed
  const peerConnectionRef = useRef(null); // RTCPeerConnection object
  const localStreamRef = useRef(null); // Local media stream

  // Step 1: Get camera and microphone access
  // This uses navigator.mediaDevices.getUserMedia to capture video and audio
  const startCamera = async () => {
    try {
      // Request video and audio from the user's device
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      // Set the local video element to display the stream
      localVideoRef.current.srcObject = stream;
      localStreamRef.current = stream;
      console.log("Local stream captured (video + audio)");
    } catch (error) {
      console.error("Error accessing camera/microphone:", error);
    }
  };

  // Step 2: Set up the RTCPeerConnection
  // This object manages the peer-to-peer connection, including media and network paths
  const createPeerConnection = () => {
    // Create a new RTCPeerConnection with a STUN server for NAT traversal
    // STUN helps devices behind routers find public network paths
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // If we have a local stream, add its tracks (video/audio) to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
        console.log(`Added ${track.kind} track to peer connection`);
      });
    }

    // Handle incoming remote stream (from the other peer)
    // The 'ontrack' event fires when the remote peer sends media tracks
    pc.ontrack = (event) => {
      console.log("Received remote stream!");
      const remoteStream = event.streams[0];
      remoteVideoRef.current.srcObject = remoteStream;
      console.log("Set remote stream to video element");
    };

    // Monitor connection status for debugging
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        console.log("✅ WebRTC connection established!");
      }
    };

    // Collect ICE candidates (network paths) as they are generated
    // ICE candidates describe how peers can reach each other (e.g., IP/port)
    const candidates = [];
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Generated ICE candidate:", event.candidate.candidate);
        candidates.push(event.candidate);
      } else {
        console.log("ICE candidate gathering complete");
        // When gathering is done, combine SDP and candidates into one exchange object
        const exchangeData = {
          sdp: pc.localDescription,
          candidates: candidates,
        };
        setLocalExchangeData(JSON.stringify(exchangeData, null, 2));
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Step 3 (Host): Create an offer
  // The offer describes the host's media capabilities and initiates the connection
  const createOffer = async () => {
    // Initialize peer connection if not already created
    if (!peerConnectionRef.current) {
      createPeerConnection();
    }
    const pc = peerConnectionRef.current;

    try {
      // Create an SDP offer (describes media formats, codecs, etc.)
      console.log("Creating offer...");
      const offer = await pc.createOffer();
      // Set the offer as the local description
      await pc.setLocalDescription(offer);
      console.log("Offer created and set");

      // Wait for ICE candidates to be gathered (onicecandidate will set localExchangeData)
      await new Promise((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
        } else {
          pc.addEventListener("icegatheringstatechange", () => {
            if (pc.iceGatheringState === "complete") {
              resolve();
            }
          });
        }
      });
      console.log("Offer + ICE candidates ready for copying");
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  // Step 4 (Guest): Set offer and create answer
  // The guest receives the host's offer, sets it, and responds with an answer
  const createAnswer = async () => {
    if (!remoteExchangeData) {
      alert("Please paste the Host's exchange data first");
      return;
    }

    // Initialize peer connection if not already created
    if (!peerConnectionRef.current) {
      createPeerConnection();
    }
    const pc = peerConnectionRef.current;

    try {
      // Parse the host's exchange data (SDP + candidates)
      const exchangeData = JSON.parse(remoteExchangeData);
      // Set the host's offer as the remote description
      console.log("Setting remote offer...");
      await pc.setRemoteDescription(
        new RTCSessionDescription(exchangeData.sdp)
      );
      console.log("Remote offer set");

      // Add the host's ICE candidates
      for (const candidate of exchangeData.candidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("Added host ICE candidate:", candidate.candidate);
      }

      // Create an answer SDP (describes guest's media capabilities)
      console.log("Creating answer...");
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("Answer created and set");

      // Wait for ICE candidates (onicecandidate will set localExchangeData)
      await new Promise((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
        } else {
          pc.addEventListener("icegatheringstatechange", () => {
            if (pc.iceGatheringState === "complete") {
              resolve();
            }
          });
        }
      });
      console.log("Answer + ICE candidates ready for copying");
    } catch (error) {
      console.error("Error creating answer:", error);
    }
  };

  // Step 5 (Host): Set the guest's answer
  // The host receives the guest's answer + candidates and finalizes the connection
  const setAnswer = async () => {
    if (!remoteExchangeData || !peerConnectionRef.current) {
      alert("Please create offer and paste Guest's exchange data");
      return;
    }

    const pc = peerConnectionRef.current;
    try {
      // Parse the guest's exchange data (SDP + candidates)
      const exchangeData = JSON.parse(remoteExchangeData);
      // Set the guest's answer as the remote description
      console.log("Setting remote answer...");
      await pc.setRemoteDescription(
        new RTCSessionDescription(exchangeData.sdp)
      );
      console.log("Remote answer set");

      // Add the guest's ICE candidates
      for (const candidate of exchangeData.candidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("Added guest ICE candidate:", candidate.candidate);
      }
      console.log("Connection setup complete; media should flow");
    } catch (error) {
      console.error("Error setting answer:", error);
    }
  };

  // Reset the demo to start over
  const reset = () => {
    // Close and clean up peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    // Stop local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    // Reset state and UI
    setIsHost(false);
    setIsGuest(false);
    setLocalExchangeData("");
    setRemoteExchangeData("");
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    console.log("Demo reset");
  };

  // Initialize camera on component mount
  useEffect(() => {
    startCamera();
    // Cleanup on component unmount
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>WebRTC Video Call Demo</h1>

      {/* Role Selection */}
      {!isHost && !isGuest && (
        <div style={{ marginBottom: "20px" }}>
          <h2>Step 1: Choose Your Role</h2>
          <button
            onClick={() => setIsHost(true)}
            style={{ marginRight: "10px", padding: "10px 20px" }}
          >
            Be Host (Start Call)
          </button>
          <button
            onClick={() => setIsGuest(true)}
            style={{ padding: "10px 20px" }}
          >
            Be Guest (Join Call)
          </button>
        </div>
      )}

      {/* Host Flow */}
      {isHost && (
        <div
          style={{
            marginBottom: "20px",
            border: "2px solid blue",
            padding: "15px",
          }}
        >
          <h2>Host Steps</h2>
          <div style={{ marginBottom: "10px" }}>
            <button onClick={createOffer} style={{ padding: "8px 16px" }}>
              Step 2: Create Offer
            </button>
          </div>

          {localExchangeData && (
            <div style={{ marginBottom: "10px" }}>
              <h3>Step 3: Copy Offer Data (send to Guest)</h3>
              <textarea
                value={localExchangeData}
                readOnly
                rows={8}
                style={{ width: "100%", fontSize: "12px" }}
              />
            </div>
          )}

          <div style={{ marginBottom: "10px" }}>
            <h3>Step 4: Paste Guest's Answer Data</h3>
            <textarea
              value={remoteExchangeData}
              onChange={(e) => setRemoteExchangeData(e.target.value)}
              placeholder="Paste Guest's answer data here..."
              rows={8}
              style={{ width: "100%", fontSize: "12px" }}
            />
            <button
              onClick={setAnswer}
              style={{ marginTop: "10px", padding: "8px 16px" }}
            >
              Step 5: Set Answer & Connect
            </button>
          </div>
        </div>
      )}

      {/* Guest Flow */}
      {isGuest && (
        <div
          style={{
            marginBottom: "20px",
            border: "2px solid green",
            padding: "15px",
          }}
        >
          <h2>Guest Steps</h2>
          <div style={{ marginBottom: "10px" }}>
            <h3>Step 2: Paste Host's Offer Data</h3>
            <textarea
              value={remoteExchangeData}
              onChange={(e) => setRemoteExchangeData(e.target.value)}
              placeholder="Paste Host's offer data here..."
              rows={8}
              style={{ width: "100%", fontSize: "12px" }}
            />
            <button
              onClick={createAnswer}
              style={{ marginTop: "10px", padding: "8px 16px" }}
            >
              Step 3: Create Answer
            </button>
          </div>

          {localExchangeData && (
            <div>
              <h3>Step 4: Copy Answer Data (send to Host)</h3>
              <textarea
                value={localExchangeData}
                readOnly
                rows={8}
                style={{ width: "100%", fontSize: "12px" }}
              />
            </div>
          )}
        </div>
      )}

      {/* Video Display */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div>
          <h3>Your Video</h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            style={{
              width: "300px",
              height: "200px",
              border: "2px solid black",
            }}
          />
        </div>
        <div>
          <h3>Remote Video</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            style={{
              width: "300px",
              height: "200px",
              border: "2px solid black",
            }}
          />
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={reset}
        style={{
          padding: "10px 20px",
          backgroundColor: "#ff4444",
          color: "white",
          border: "none",
        }}
      >
        Reset Demo
      </button>

      {/* Teaching Notes */}
      <div
        style={{
          marginTop: "30px",
          backgroundColor: "#f9f9f9",
          padding: "15px",
        }}
      >
        <h2>Teaching Notes</h2>
        <ul>
          <li>
            <strong>WebRTC Basics:</strong> Enables peer-to-peer video/audio
            calls directly between browsers without a central server for media.
          </li>
          <li>
            <strong>RTCPeerConnection:</strong> Manages the connection, media
            streams, and network paths (ICE candidates).
          </li>
          <li>
            <strong>SDP (Session Description Protocol):</strong> Describes media
            capabilities (codecs, formats) exchanged in offer/answer.
          </li>
          <li>
            <strong>ICE Candidates:</strong> Network addresses/ports for peers
            to connect, often including public IPs via STUN.
          </li>
          <li>
            <strong>Signaling:</strong> The process of exchanging SDP and
            candidates. Here, we do it manually (copy-paste); real apps use
            WebSocket servers.
          </li>
        </ul>

        <div
          style={{
            backgroundColor: "#e8f4fd",
            padding: "10px",
            marginTop: "15px",
            border: "1px solid #b3d9ff",
          }}
        >
          <h3>How to Test</h3>
          <ol>
            <li>
              Open this demo in <strong>two browser tabs</strong>.
            </li>
            <li>Tab 1: Click "Be Host" → "Create Offer" → Copy offer data.</li>
            <li>
              Tab 2: Click "Be Guest" → Paste offer data → "Create Answer" →
              Copy answer data.
            </li>
            <li>Tab 1: Paste answer data → "Set Answer & Connect".</li>
            <li>
              <strong>Result:</strong> Each tab shows the other's video in
              "Remote Video" when connected.
            </li>
          </ol>
          <p>
            <strong>Tip:</strong> Watch the browser console for logs to
            understand what's happening (e.g., "Connection state: connected").
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebRTCDemo;
