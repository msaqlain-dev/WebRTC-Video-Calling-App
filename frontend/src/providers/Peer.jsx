import React, { useMemo, useCallback } from "react";

const PeerContext = React.createContext(null);

export const usePeer = () => React.useContext(PeerContext);

export const PeerProvider = (props) => {
  const peer = useMemo(() => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    // Enhanced logging
    peerConnection.onconnectionstatechange = () => {
      console.log("Peer connection state:", peerConnection.connectionState);
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", peerConnection.iceConnectionState);
    };

    return peerConnection;
  }, []);

  const createOffer = useCallback(async () => {
    try {
      console.log("Creating offer...");
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peer.setLocalDescription(offer);
      console.log("Offer created and set as local description");
      return offer;
    } catch (error) {
      console.error("Error creating offer:", error);
      throw error;
    }
  }, [peer]);

  const createAnswer = useCallback(
    async (offer) => {
      try {
        console.log("Creating answer for offer...");
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        console.log("Answer created and set as local description");
        return answer;
      } catch (error) {
        console.error("Error creating answer:", error);
        throw error;
      }
    },
    [peer]
  );

  const setRemoteAnswer = useCallback(
    async (answer) => {
      try {
        console.log("Setting remote answer...");
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("Remote answer set successfully");
      } catch (error) {
        console.error("Error setting remote answer:", error);
        throw error;
      }
    },
    [peer]
  );

  const addTrack = useCallback(
    (track, stream) => {
      return peer.addTrack(track, stream);
    },
    [peer]
  );

  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        setRemoteAnswer,
        addTrack,
      }}
    >
      {props.children}
    </PeerContext.Provider>
  );
};
