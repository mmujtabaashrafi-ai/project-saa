import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function CallManager() {
  const { socket } = useSocket();
  const { user } = useAuth();

  const {
    callState,
    callType,
    activeCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoDisabled,
    callDuration,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useWebRTC({ socket, user });


  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (callState === 'idle') return null;

  return (
    <AnimatePresence>
      {/* ─── Incoming Call Dialog ─────────────────────────────────────── */}
      {callState === 'incoming' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          className="fixed bottom-6 right-6 z-50 p-6 rounded-2xl shadow-2xl glass-card flex flex-col items-center gap-4 border border-white/20"
          style={{ background: 'rgba(15, 23, 42, 0.95)', minWidth: '320px' }}
        >
          <div className="relative">
            <UserAvatar user={activeCall?.otherUser} size={72} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {callType === 'video' ? <Video size={14} /> : <Phone size={14} />}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-white">
              {activeCall?.otherUser?.displayName || 'Incoming Call'}
            </h3>
            <p className="text-xs text-blue-400 animate-pulse mt-0.5">
              Incoming {callType === 'video' ? 'Video' : 'Voice'} Call…
            </p>
          </div>

          <div className="flex items-center gap-6 mt-2">
            <button
              onClick={rejectCall}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110"
              title="Decline"
            >
              <PhoneOff size={24} />
            </button>
            <button
              onClick={acceptCall}
              className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 animate-bounce"
              title="Accept"
            >
              <Phone size={24} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── Active / Outgoing Call Overlay ─────────────────────────────── */}
      {(callState === 'calling' || callState === 'connected') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div className="relative w-full max-w-4xl h-[80vh] rounded-3xl overflow-hidden glass border border-white/10 flex flex-col bg-slate-950">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-3">
                <UserAvatar user={activeCall?.otherUser} size={44} />
                <div>
                  <h3 className="font-bold text-white text-base">
                    {activeCall?.otherUser?.displayName}
                  </h3>
                  <div className="text-xs text-slate-300 flex items-center gap-2">
                    {callState === 'calling' ? (
                      <span className="text-yellow-400 animate-pulse">Calling…</span>
                    ) : (
                      <span className="text-emerald-400">Connected · {formatDuration(callDuration)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-full bg-white/10 text-xs text-white backdrop-blur">
                {callType === 'video' ? 'HD Video Call' : 'Encrypted Voice Call'}
              </div>
            </div>

            {/* Video / Audio Area */}
            <div className="flex-1 relative flex items-center justify-center bg-slate-900 overflow-hidden">
              {callType === 'video' ? (
                <>
                  {/* Remote Stream Video */}
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 opacity-60">
                      <UserAvatar user={activeCall?.otherUser} size={96} />
                      <p className="text-white text-sm">Connecting video stream…</p>
                    </div>
                  )}

                  {/* Local Stream (Picture-in-Picture) */}
                  <div className="absolute bottom-6 right-6 w-40 h-52 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-800">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${isVideoDisabled ? 'hidden' : ''}`}
                    />
                    {isVideoDisabled && (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white/50 text-xs">
                        Camera Off
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Voice Call Visualization */
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <UserAvatar user={activeCall?.otherUser} size={110} />
                    {callState === 'connected' && (
                      <div className="absolute -inset-3 rounded-full border-2 border-purple-500/50 animate-ping" />
                    )}
                  </div>

                  <div className="text-center">
                    <h2 className="text-xl font-bold text-white mb-1">
                      {activeCall?.otherUser?.displayName}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {callState === 'calling' ? 'Ringing…' : formatDuration(callDuration)}
                    </p>
                  </div>

                  {/* Audio waveform simulation */}
                  {callState === 'connected' && (
                    <div className="flex items-center gap-1.5 h-12">
                      {[30, 60, 90, 45, 75, 100, 50, 80, 40, 60, 85, 30].map((h, i) => (
                        <span
                          key={i}
                          className="w-1.5 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full animate-pulse"
                          style={{
                            height: `${h}%`,
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: '0.8s',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls Toolbar */}
            <div className="p-6 bg-slate-950/90 border-t border-white/10 flex items-center justify-center gap-6 z-20">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all ${
                  isMuted
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-all ${
                    isVideoDisabled
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title={isVideoDisabled ? 'Turn On Camera' : 'Turn Off Camera'}
                >
                  {isVideoDisabled ? <VideoOff size={22} /> : <Video size={22} />}
                </button>
              )}

              <button
                onClick={endCall}
                className="px-8 py-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-transform hover:scale-105"
                title="End Call"
              >
                <PhoneOff size={22} />
                <span>End Call</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
