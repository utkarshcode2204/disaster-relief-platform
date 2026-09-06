import { useState, useRef, useEffect, useCallback } from 'react';
import socket from '../services/socket';

// Free public STUN server - helps two browsers discover how to connect
// directly to each other. No TURN server is set up, so calls may fail
// if either user is behind a strict corporate/university firewall - fine
// for a portfolio/demo project.
const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function useWebRTCCall(requestId, myName) {
  const [callStatus, setCallStatus] = useState('idle'); // idle | calling | incoming | in-call
  const [incomingCallerName, setIncomingCallerName] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pendingOfferRef = useRef(null);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    pendingOfferRef.current = null;
    setCallStatus('idle');
    setIsMuted(false);
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', { requestId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        cleanup();
      }
    };

    return pc;
  }, [requestId, cleanup]);

  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = createPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call_offer', { requestId, offer, callerName: myName });
      setCallStatus('calling');
    } catch (err) {
      console.error('Could not start call:', err);
      alert('Microphone access is needed to start a call.');
    }
  }, [requestId, myName, createPeerConnection]);

  const answerCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = createPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call_answer', { requestId, answer });
      setCallStatus('in-call');
    } catch (err) {
      console.error('Could not answer call:', err);
      alert('Microphone access is needed to answer the call.');
    }
  }, [requestId, createPeerConnection]);

  const declineCall = useCallback(() => {
    socket.emit('call_end', { requestId });
    pendingOfferRef.current = null;
    setCallStatus('idle');
  }, [requestId]);

  const endCall = useCallback(() => {
    socket.emit('call_end', { requestId });
    cleanup();
  }, [requestId, cleanup]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    if (!requestId) return;

    const handleOffer = ({ offer, callerName }) => {
      pendingOfferRef.current = offer;
      setIncomingCallerName(callerName || 'Someone');
      setCallStatus('incoming');
    };

    const handleAnswer = async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus('in-call');
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    };

    const handleCallEnd = () => {
      cleanup();
    };

    socket.on('call_offer', handleOffer);
    socket.on('call_answer', handleAnswer);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('call_end', handleCallEnd);

    return () => {
      socket.off('call_offer', handleOffer);
      socket.off('call_answer', handleAnswer);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('call_end', handleCallEnd);
    };
  }, [requestId, cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return {
    callStatus,
    incomingCallerName,
    isMuted,
    remoteAudioRef,
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
  };
}