import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const WebRTCDemo = () => {
  const [isHost, setIsHost] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [localExchangeData, setLocalExchangeData] = useState("");
  const [remoteExchangeData, setRemoteExchangeData] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const navigate = useNavigate();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = stream;
      localStreamRef.current = stream;
      console.log("Local stream captured (video + audio)");
    } catch (error) {
      console.error("Error accessing camera/microphone:", error);
    }
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
        console.log(`Added ${track.kind} track to peer connection`);
      });
    }

    pc.ontrack = (event) => {
      console.log("Received remote stream!");
      const remoteStream = event.streams[0];
      remoteVideoRef.current.srcObject = remoteStream;
      console.log("Set remote stream to video element");
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        console.log("✅ WebRTC connection established!");
      }
    };

    const candidates = [];
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Generated ICE candidate:", event.candidate.candidate);
        candidates.push(event.candidate);
      } else {
        console.log("ICE candidate gathering complete");
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

  const createOffer = async () => {
    if (!peerConnectionRef.current) {
      createPeerConnection();
    }
    const pc = peerConnectionRef.current;

    try {
      console.log("Creating offer...");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("Offer created and set");
      setCurrentStep(3);

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

  const createAnswer = async () => {
    if (!remoteExchangeData) {
      alert("Please paste the Host's exchange data first");
      return;
    }

    if (!peerConnectionRef.current) {
      createPeerConnection();
    }
    const pc = peerConnectionRef.current;

    try {
      const exchangeData = JSON.parse(remoteExchangeData);
      console.log("Setting remote offer...");
      await pc.setRemoteDescription(
        new RTCSessionDescription(exchangeData.sdp)
      );
      console.log("Remote offer set");

      for (const candidate of exchangeData.candidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("Added host ICE candidate:", candidate.candidate);
      }

      console.log("Creating answer...");
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("Answer created and set");
      setCurrentStep(4);

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

  const setAnswer = async () => {
    if (!remoteExchangeData || !peerConnectionRef.current) {
      alert("Please create offer and paste Guest's exchange data");
      return;
    }

    const pc = peerConnectionRef.current;
    try {
      const exchangeData = JSON.parse(remoteExchangeData);
      console.log("Setting remote answer...");
      await pc.setRemoteDescription(
        new RTCSessionDescription(exchangeData.sdp)
      );
      console.log("Remote answer set");

      for (const candidate of exchangeData.candidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("Added guest ICE candidate:", candidate.candidate);
      }
      console.log("Connection setup complete; media should flow");
    } catch (error) {
      console.error("Error setting answer:", error);
    }
  };

  const reset = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsHost(false);
    setIsGuest(false);
    setLocalExchangeData("");
    setRemoteExchangeData("");
    setCurrentStep(1);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    console.log("Demo reset");
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/")}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  WebRTC Demo
                </h1>
                <p className="text-gray-600">
                  Learn how peer-to-peer video calls work
                </p>
              </div>
            </div>

            <button
              onClick={reset}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Reset Demo
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 5 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      currentStep > step ? "bg-blue-500" : "bg-gray-200"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-sm text-gray-600">
              Step {currentStep}:{" "}
              {currentStep === 1
                ? "Choose Role"
                : currentStep === 2
                ? "Create Connection"
                : currentStep === 3
                ? "Exchange Data"
                : currentStep === 4
                ? "Complete Setup"
                : "Connected"}
            </span>
          </div>
        </div>

        {/* Role Selection */}
        {!isHost && !isGuest && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Step 1: Choose Your Role
                </h2>
                <p className="text-gray-600">
                  Select whether you want to start the call (Host) or join an
                  existing call (Guest)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setIsHost(true);
                    setCurrentStep(2);
                  }}
                  className="p-6 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Be Host
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Start the call and create the initial offer
                  </p>
                </button>

                <button
                  onClick={() => {
                    setIsGuest(true);
                    setCurrentStep(2);
                  }}
                  className="p-6 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Be Guest
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Join an existing call by responding to an offer
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Host Flow */}
        {isHost && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-blue-500">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Host Steps</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <button
                    onClick={createOffer}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Step 2: Create Offer
                  </button>
                </div>

                {localExchangeData && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Step 3: Copy Offer Data (send to Guest)
                    </h3>
                    <div className="relative">
                      <textarea
                        value={localExchangeData}
                        readOnly
                        rows={6}
                        className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(localExchangeData)}
                        className="absolute top-2 right-2 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                        title="Copy to clipboard"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Step 4: Paste Guest's Answer Data
                  </h3>
                  <textarea
                    value={remoteExchangeData}
                    onChange={(e) => setRemoteExchangeData(e.target.value)}
                    placeholder="Paste Guest's answer data here..."
                    rows={6}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <button
                    onClick={setAnswer}
                    className="mt-3 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Step 5: Set Answer & Connect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guest Flow */}
        {isGuest && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-green-500">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Guest Steps
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Step 2: Paste Host's Offer Data
                  </h3>
                  <textarea
                    value={remoteExchangeData}
                    onChange={(e) => setRemoteExchangeData(e.target.value)}
                    placeholder="Paste Host's offer data here..."
                    rows={6}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                  />
                  <button
                    onClick={createAnswer}
                    className="mt-3 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Step 3: Create Answer
                  </button>
                </div>

                {localExchangeData && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Step 4: Copy Answer Data (send to Host)
                    </h3>
                    <div className="relative">
                      <textarea
                        value={localExchangeData}
                        readOnly
                        rows={6}
                        className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(localExchangeData)}
                        className="absolute top-2 right-2 p-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                        title="Copy to clipboard"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Video Display */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Your Video</h3>
              </div>
              <div className="aspect-video bg-gray-900">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Remote Video</h3>
              </div>
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  className="w-full h-full object-cover"
                />
                {!remoteVideoRef.current?.srcObject && (
                  <div className="absolute text-white text-center">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                    <p className="text-gray-400">Waiting for connection...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Educational Content */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              How WebRTC Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Media Capture
                </h3>
                <p className="text-sm text-gray-600">
                  Get access to camera and microphone
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Peer Connection
                </h3>
                <p className="text-sm text-gray-600">
                  Establish direct browser-to-browser connection
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Signaling</h3>
                <p className="text-sm text-gray-600">
                  Exchange connection information (SDP & ICE)
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Media Flow</h3>
                <p className="text-sm text-gray-600">
                  Stream video and audio directly between peers
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📚 Key Concepts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    SDP (Session Description Protocol)
                  </h4>
                  <p className="text-gray-600">
                    Describes media capabilities, codecs, and connection
                    parameters
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    ICE Candidates
                  </h4>
                  <p className="text-gray-600">
                    Network addresses and ports for establishing connection
                    paths
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    STUN Server
                  </h4>
                  <p className="text-gray-600">
                    Helps discover public IP addresses behind NAT/firewalls
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Peer-to-Peer
                  </h4>
                  <p className="text-gray-600">
                    Direct communication without routing through central servers
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🧪 How to Test This Demo
              </h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    5
                  </span>
                  <span>
                    <strong>Result:</strong> Both tabs should show each other's
                    video streams!
                  </span>
                </li>
              </ol>
              <p className="mt-4 text-sm text-gray-600">
                <strong>💡 Tip:</strong> Open browser console (F12) to see
                detailed logs of the WebRTC process
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebRTCDemo;
