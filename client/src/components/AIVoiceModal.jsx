import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Sparkles, Volume2, Bot, Loader2 } from 'lucide-react';
import { aiApi } from '../services/api';

export default function AIVoiceModal({ isOpen, onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('Hello! I am Saba’s World AI. Ask me anything by voice!');
  const [isMuted, setIsMuted] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize Speech Recognition if supported in browser
  useEffect(() => {
    if (!isOpen) {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);

        if (event.results[current].isFinal) {
          handleVoiceSubmit(text);
        }
      };

      recognition.onerror = (event) => {
        console.warn('[SpeechRecognition error]', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {}
    } else {
      setTranscript('Speech recognition is not supported in this browser. You can speak or use AI chat!');
    }

    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isOpen]);

  const speakText = (text) => {
    if (!synthRef.current || isMuted) return;

    synthRef.current.cancel();
    // Clean markdown tags for natural speech
    const cleanText = text.replace(/[#*`_~[\]()|>-]/g, ' ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 400));
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // Restart listening after AI finishes speaking
      if (recognitionRef.current && !isMuted) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    };
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
      setAiResponse('I encountered a momentary issue. Please try speaking again.');
    } finally {
      setIsThinking(false);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (synthRef.current) synthRef.current.cancel();
      setIsSpeaking(false);
      try {
        recognitionRef.current?.start();
      } catch (e) {}
    }
  };

  const handleClose = () => {
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
        <div className="relative w-full max-w-md p-8 rounded-3xl glass-card flex flex-col items-center gap-6 bg-slate-950 border border-purple-500/20 shadow-2xl shadow-purple-500/10 text-center">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Sparkles size={14} className="text-purple-400 animate-spin" />
            <span>Saba’s World AI · Voice Mode</span>
          </div>

          {/* Animated AI Voice Avatar */}
          <div className="relative my-4 flex items-center justify-center">
            {/* Pulsing rings */}
            {(isSpeaking || isListening) && (
              <>
                <div className="absolute w-44 h-44 rounded-full border border-purple-500/40 animate-ping" />
                <div className="absolute w-36 h-36 rounded-full bg-purple-600/20 blur-xl animate-pulse" />
              </>
            )}

            <motion.div
              animate={{
                scale: isSpeaking ? [1, 1.08, 1] : isListening ? [1, 1.04, 1] : 1,
              }}
              transition={{ repeat: Infinity, duration: isSpeaking ? 0.8 : 2 }}
              className="w-28 h-28 rounded-full flex items-center justify-center shadow-2xl z-10"
              style={{
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)',
              }}
            >
              <Bot size={48} className="text-white" />
            </motion.div>
          </div>

          {/* Status Text */}
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Saba's World AI</h2>
            <p className="text-xs text-purple-300 flex items-center justify-center gap-1.5 font-medium">
              {isThinking ? (
                <>
                  <Loader2 size={13} className="animate-spin text-purple-400" />
                  <span>Thinking…</span>
                </>
              ) : isSpeaking ? (
                <>
                  <Volume2 size={13} className="animate-pulse text-pink-400" />
                  <span>Speaking…</span>
                </>
              ) : isListening ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Listening to your voice…</span>
                </>
              ) : (
                <span>Tap microphone to speak</span>
              )}
            </p>
          </div>

          {/* Interactive Speech Visualizer & Transcript */}
          <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 min-h-[90px] flex flex-col justify-center">
            {transcript && (
              <p className="text-xs text-slate-400 italic mb-1">“{transcript}”</p>
            )}
            <p className="text-sm text-slate-200 line-clamp-3 leading-relaxed">
              {aiResponse}
            </p>
          </div>

          {/* Waveform Animation */}
          <div className="flex items-center gap-1.5 h-8">
            {[20, 50, 80, 40, 70, 95, 45, 60, 30, 85, 40, 65, 25].map((h, i) => (
              <span
                key={i}
                className="w-1.5 bg-gradient-to-t from-pink-500 to-purple-500 rounded-full transition-all duration-150"
                style={{
                  height: isSpeaking || isListening ? `${h}%` : '15%',
                  animation: isSpeaking ? 'pulse 0.6s infinite alternate' : 'none',
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-2">
            <button
              onClick={toggleListen}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isListening
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 scale-110'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak'}
            >
              {isListening ? <Mic size={24} /> : <MicOff size={24} />}
            </button>

            <button
              onClick={handleClose}
              className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-transform hover:scale-105"
            >
              <PhoneOff size={18} />
              <span>End Call</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
