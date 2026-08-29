import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, MicOff, Video, VideoOff, PhoneOff, Bot, Volume2, Loader2 } from 'lucide-react';
import { aiApi } from '../services/api';

export default function AIVideoModal({ isOpen, onClose }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('Welcome to Saba’s World AI Video Experience! I am your AI assistant.');
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);

  const userVideoRef = useRef(null);
  const userStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize Camera for user picture-in-picture
  useEffect(() => {
    if (!isOpen) {
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((t) => t.stop());
        userStreamRef.current = null;
      }
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
      return;
    }

    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        userStreamRef.current = stream;
        if (userVideoRef.current) userVideoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.warn('[AIVideoModal] Camera access optional or denied:', err);
      });

    // Voice recognition setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
        if (event.results[current].isFinal) {
          handleVoiceSubmit(text);
        }
      };

      recognition.onend = () => {
        if (!isMicMuted && isOpen) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {}
    }

    return () => {
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isOpen]);

  const speakText = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const cleanText = text.replace(/[#*`_~[\]()|>-]/g, ' ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 400));
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const handleVoiceSubmit = async (queryText) => {
    if (!queryText.trim()) return;
    if (synthRef.current) synthRef.current.cancel();
    setIsThinking(true);

    try {
      const { data } = await aiApi.chat({ message: queryText });
      if (data.success) {
        const reply = data.message.content;
        setAiResponse(reply);
        speakText(reply);
      }
    } catch (err) {
      setAiResponse('I experienced an error connecting to the service.');
    } finally {
      setIsThinking(false);
    }
  };

  const toggleCamera = () => {
    if (userStreamRef.current) {
      const videoTrack = userStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (userStreamRef.current) {
      const audioTrack = userStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const handleClose = () => {
    if (userStreamRef.current) {
      userStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg"
      >
        <div className="relative w-full max-w-4xl h-[82vh] rounded-3xl overflow-hidden glass border border-purple-500/30 flex flex-col bg-slate-950 shadow-2xl">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-6 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
              >
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Saba’s World AI</h3>
                <div className="text-xs text-purple-300 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Simulated AI Video Presence · Active</span>
                </div>
              </div>
            </div>

            <div className="px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-xs text-purple-200 font-semibold backdrop-blur flex items-center gap-1.5">
              <Sparkles size={13} className="text-pink-400" />
              <span>Interactive AI Studio</span>
            </div>
          </div>

          {/* Center Stage: Simulated AI Visual Entity */}
          <div className="flex-1 relative flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 overflow-hidden p-6">
            {/* Background Ambient Aura */}
            <motion.div
              animate={{
                scale: isSpeaking ? [1, 1.25, 1] : [1, 1.05, 1],
                opacity: isSpeaking ? [0.4, 0.7, 0.4] : [0.2, 0.3, 0.2],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-pink-500/30 via-purple-600/30 to-blue-500/30 blur-3xl pointer-events-none"
            />

            {/* AI Avatar Video Entity */}
            <div className="relative flex flex-col items-center gap-6 z-10">
              <motion.div
                animate={{
                  y: isSpeaking ? [-5, 5, -5] : [0, -4, 0],
                  scale: isSpeaking ? [1, 1.06, 1] : 1,
                }}
                transition={{ repeat: Infinity, duration: isSpeaking ? 1.2 : 3 }}
                className="w-36 h-36 rounded-3xl p-1 shadow-2xl relative flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)',
                }}
              >
                <div className="w-full h-full rounded-[22px] bg-slate-900 flex flex-col items-center justify-center gap-2 overflow-hidden relative">
                  <Bot size={54} className="text-white" />
                  {isSpeaking && (
                    <div className="absolute inset-0 bg-pink-500/10 backdrop-blur-xs flex items-center justify-center animate-pulse">
                      <Volume2 size={32} className="text-white opacity-80" />
                    </div>
                  )}
                </div>
              </motion.div>

              <div className="max-w-xl text-center px-4">
                {transcript && (
                  <p className="text-xs text-purple-300 italic mb-2">“{transcript}”</p>
                )}
                <p className="text-base text-slate-100 leading-relaxed font-medium">
                  {aiResponse}
                </p>
              </div>
            </div>

            {/* Local User Stream (Picture-in-Picture) */}
            <div className="absolute bottom-6 right-6 w-44 h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-900 z-20">
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`}
              />
              {isVideoMuted && (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white/50 text-xs">
                  Camera Off
                </div>
              )}
            </div>
          </div>

          {/* Toolbar Controls */}
          <div className="p-6 bg-slate-950/90 border-t border-white/10 flex items-center justify-center gap-6 z-20">
            <button
              onClick={toggleMic}
              className={`p-4 rounded-full transition-all ${
                isMicMuted
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMicMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            <button
              onClick={toggleCamera}
              className={`p-4 rounded-full transition-all ${
                isVideoMuted
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isVideoMuted ? <VideoOff size={22} /> : <Video size={22} />}
            </button>

            <button
              onClick={handleClose}
              className="px-8 py-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-transform hover:scale-105"
            >
              <PhoneOff size={22} />
              <span>Leave Studio</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
