import { useCallback, useEffect, useRef, useState } from "react";
import type { DataMessage, SessionDescriptionPayload, SignalingTransport } from "../lib/signaling";

export interface UseWebRTCOptions {
  roomId: string;
  localName: string;
  signaling: SignalingTransport;
  localStream: MediaStream | null;
  onRemoteStream: (stream: MediaStream) => void;
  onDataMessage: (message: DataMessage) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange: (state: RTCIceConnectionState) => void;
}

export interface UseWebRTCReturn {
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  localConnectionCode: string | null;
  remoteConnectionCode: string;
  setRemoteConnectionCode: (code: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendData: (message: DataMessage) => void;
  isInitiator: boolean;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
};

function createPeerConnection(options: UseWebRTCOptions, isInitiator: boolean): RTCPeerConnection {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  pc.onconnectionstatechange = () => {
    options.onConnectionStateChange(pc.connectionState);
  };

  pc.oniceconnectionstatechange = () => {
    options.onIceConnectionStateChange(pc.iceConnectionState);
  };

  pc.ontrack = (event) => {
    if (event.streams[0]) {
      options.onRemoteStream(event.streams[0]);
    }
  };

  if (options.localStream) {
    options.localStream.getTracks().forEach((track) => {
      pc.addTrack(track, options.localStream!);
    });
  }

  const dataChannel = pc.createDataChannel("ishara-data", {
    ordered: true,
  });

  dataChannel.onopen = () => {
    console.log("[WebRTC] Data channel opened");
  };

  dataChannel.onclose = () => {
    console.log("[WebRTC] Data channel closed");
  };

  dataChannel.onerror = (error) => {
    console.error("[WebRTC] Data channel error:", error);
  };

  dataChannel.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as DataMessage;
      options.onDataMessage(message);
    } catch (error) {
      console.error("[WebRTC] Failed to parse data message:", error);
    }
  };

  return pc;
}

export function useWebRTC({
  roomId,
  localName,
  signaling,
  localStream,
  onRemoteStream,
  onDataMessage,
  onConnectionStateChange,
  onIceConnectionStateChange,
}: UseWebRTCOptions): UseWebRTCReturn {
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState>("new");
  const [localConnectionCode, setLocalConnectionCode] = useState<string | null>(null);
  const [remoteConnectionCode, setRemoteConnectionCode] = useState<string>("");
  const [isInitiator, setIsInitiator] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const isConnectingRef = useRef(false);

  const handleConnectionStateChange = useCallback(
    (state: RTCPeerConnectionState) => {
      setConnectionState(state);
      onConnectionStateChange(state);
    },
    [onConnectionStateChange],
  );

  const handleIceConnectionStateChange = useCallback(
    (state: RTCIceConnectionState) => {
      setIceConnectionState(state);
      onIceConnectionStateChange(state);
    },
    [onIceConnectionStateChange],
  );

  const handleRemoteStream = useCallback(
    (stream: MediaStream) => {
      onRemoteStream(stream);
    },
    [onRemoteStream],
  );

  const handleDataMessage = useCallback(
    (message: DataMessage) => {
      onDataMessage(message);
    },
    [onDataMessage],
  );

  const sendData = useCallback((message: DataMessage) => {
    if (dataChannelRef.current?.readyState === "open") {
      dataChannelRef.current.send(JSON.stringify(message));
    } else {
      console.warn("[WebRTC] Data channel not open, message not sent:", message);
    }
  }, []);

  const connect = useCallback(async () => {
    if (isConnectingRef.current || pcRef.current) return;
    isConnectingRef.current = true;

    try {
      const pc = createPeerConnection(
        {
          roomId,
          localName,
          signaling,
          localStream,
          onRemoteStream: handleRemoteStream,
          onDataMessage: handleDataMessage,
          onConnectionStateChange: handleConnectionStateChange,
          onIceConnectionStateChange: handleIceConnectionStateChange,
        },
        isInitiator,
      );

      pcRef.current = pc;
      dataChannelRef.current = pc.createDataChannel("ishara-data", { ordered: true });

      dataChannelRef.current.onopen = () => {
        console.log("[WebRTC] Data channel opened");
      };
      dataChannelRef.current.onclose = () => {
        console.log("[WebRTC] Data channel closed");
      };
      dataChannelRef.current.onerror = (error) => {
        console.error("[WebRTC] Data channel error:", error);
      };
      dataChannelRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as DataMessage;
          handleDataMessage(message);
        } catch (error) {
          console.error("[WebRTC] Failed to parse data message:", error);
        }
      };

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const code = await signaling.publish({
          roomId,
          sdp: pc.localDescription!,
          senderName: localName,
        });
        setLocalConnectionCode(code);
      }
    } catch (error) {
      console.error("[WebRTC] Connection failed:", error);
      isConnectingRef.current = false;
      throw error;
    }
  }, [
    roomId,
    localName,
    signaling,
    localStream,
    isInitiator,
    handleRemoteStream,
    handleDataMessage,
    handleConnectionStateChange,
    handleIceConnectionStateChange,
  ]);

  const handleRemoteCode = useCallback(
    async (code: string) => {
      if (!pcRef.current || isConnectingRef.current) return;
      isConnectingRef.current = true;

      try {
        const payload = await signaling.consume(code);

        if (payload.roomId !== roomId) {
          throw new Error("Connection code is for a different room");
        }

        await pcRef.current.setRemoteDescription(payload.sdp);

        if (pcRef.current.remoteDescription?.type === "offer") {
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);

          const answerCode = await signaling.publish({
            roomId,
            sdp: pcRef.current.localDescription!,
            senderName: localName,
          });
          setLocalConnectionCode(answerCode);
        }
      } catch (error) {
        console.error("[WebRTC] Failed to process remote code:", error);
        throw error;
      } finally {
        isConnectingRef.current = false;
      }
    },
    [roomId, localName, signaling],
  );

  const disconnect = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setLocalConnectionCode(null);
    setRemoteConnectionCode("");
    setConnectionState("new");
    setIceConnectionState("new");
    isConnectingRef.current = false;
  }, []);

  const initiateCall = useCallback(async () => {
    setIsInitiator(true);
    await connect();
  }, [connect]);

  const joinCall = useCallback(
    async (code: string) => {
      setIsInitiator(false);
      setRemoteConnectionCode(code);
      await connect();
      await handleRemoteCode(code);
    },
    [connect, handleRemoteCode],
  );

  useEffect(() => {
    if (remoteConnectionCode && !isInitiator && pcRef.current?.remoteDescription === null) {
      handleRemoteCode(remoteConnectionCode).catch(console.error);
    }
  }, [remoteConnectionCode, isInitiator, handleRemoteCode]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionState,
    iceConnectionState,
    localConnectionCode,
    remoteConnectionCode,
    setRemoteConnectionCode,
    connect: isInitiator ? initiateCall : joinCall,
    disconnect,
    sendData,
    isInitiator,
  };
}
