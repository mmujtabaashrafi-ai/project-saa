import { useState, useRef, useCallback, useEffect } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const useWebRTC = ({ socket, user }) => {
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected'
  const [callType, setCallType] = useState('audio'); // 'audio' | 'video'
  const [activeCall, setActiveCall] = useState(null); // { callId, otherUser, type }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);

  // ─── Cleanup call ──────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (activeCall && socket) {
      socket.emit('call:end', {
        targetUserId: activeCall.otherUser?._id,
        callId: activeCall.callId,
        duration: callDuration,
      });
    }

    setCallState('idle');
    setActiveCall(null);
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsVideoDisabled(false);
    setCallDuration(0);
  }, [activeCall, socket, callDuration]);

  // ─── Initialize Media Stream ───────────────────────────────────────────────
  const getMedia = async (type) => {
    try {
      const constraints = {
        audio: true,
        video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('[WebRTC] Media access error:', err);
      // Fallback to audio-only if camera fails
      if (type === 'video') {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioStream;
        setLocalStream(audioStream);
        return audioStream;
      }
      throw err;
    }
  };

  // ─── Create PeerConnection ────────────────────────────────────────────────
  const createPeerConnection = (otherUserId, callId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Send local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Receive remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Send ICE candidates to remote peer via socket
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:signal', {
          targetUserId: otherUserId,
          signal: { type: 'candidate', candidate: event.candidate },
          callId,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('connected');
        // Start duration counter
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    return pc;
  };

  // ─── Initiate Outgoing Call ───────────────────────────────────────────────
  const startCall = async (otherUser, type = 'audio') => {
    try {
      setCallType(type);
      setActiveCall({ otherUser, type });
      setCallState('calling');

      const stream = await getMedia(type);

      socket.emit(
        'call:initiate',
        { receiverId: otherUser._id, type },
        async (res) => {
          if (res?.error) {
            alert(res.error);
            endCall();
            return;
          }

          const callId = res.callId;
          setActiveCall({ otherUser, type, callId });

          const pc = createPeerConnection(otherUser._id, callId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('call:signal', {
            targetUserId: otherUser._id,
            signal: { type: 'offer', sdp: offer },
            callId,
          });
        }
      );
    } catch (err) {
      console.error('[WebRTC] Start call error:', err);
      endCall();
    }
  };

  // ─── Accept Incoming Call ─────────────────────────────────────────────────
  const acceptCall = async () => {
    if (!activeCall) return;

    try {
      setCallState('connected');
      const stream = await getMedia(activeCall.type);

      const pc = createPeerConnection(activeCall.otherUser._id, activeCall.callId);

      socket.emit('call:accept', {
        callerId: activeCall.otherUser._id,
        callId: activeCall.callId,
      });
    } catch (err) {
      console.error('[WebRTC] Accept call error:', err);
      endCall();
    }
  };

  // ─── Reject Incoming Call ─────────────────────────────────────────────────
  const rejectCall = () => {
    if (activeCall && socket) {
      socket.emit('call:reject', {
        callerId: activeCall.otherUser._id,
        callId: activeCall.callId,
      });
    }
    endCall();
  };

  // ─── Toggle Mute ──────────────────────────────────────────────────────────
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // ─── Toggle Video Camera ──────────────────────────────────────────────────
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoDisabled(!videoTrack.enabled);
      }
    }
  };

  // ─── Socket Signal Listeners ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Incoming call notification
    const handleIncomingCall = (data) => {
      if (callState !== 'idle') {
        // Busy
        socket.emit('call:reject', { callerId: data.caller._id, callId: data.callId });
        return;
      }
      setCallType(data.type || 'audio');
      setActiveCall({
        callId: data.callId,
        otherUser: data.caller,
        type: data.type || 'audio',
      });
      setCallState('incoming');
    };

    // Caller receives acceptance
    const handleCallAccepted = async () => {
      setCallState('connected');
    };

    // Call rejected by other party
    const handleCallRejected = () => {
      alert('Call declined or user is busy.');
      endCall();
    };

    // Call ended
    const handleCallEnded = () => {
      endCall();
    };

    // WebRTC Signaling exchange
    const handleCallSignal = async (data) => {
      const { signal } = data;
      const pc = pcRef.current;

      if (!pc && signal.type === 'offer') {
        // Received offer while answering
        return;
      }

      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('call:signal', {
          targetUserId: data.senderId,
          signal: { type: 'answer', sdp: answer },
          callId: data.callId,
        });
      } else if (signal.type === 'answer') {
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
      } else if (signal.type === 'candidate') {
        if (pc && signal.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.warn('[WebRTC] Candidate error:', e);
          }
        }
      }
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:signal', handleCallSignal);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:signal', handleCallSignal);
    };
  }, [socket, callState, endCall]);

  return {
    callState,
    callType,
    activeCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoDisabled,
    callDuration,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
};
