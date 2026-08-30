import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, RefreshCw, Quote } from 'lucide-react';
import { SABA_QUOTES, SABA_WELCOME_CONFIG } from '../data/sabaKnowledge';

export default function WelcomeSabaBanner({ compact = false, showQuote = true }) {
  const [quoteIndex, setQuoteIndex] = useState(0);

  const nextQuote = (e) => {
    e?.stopPropagation();
    setQuoteIndex((prev) => (prev + 1) % SABA_QUOTES.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col items-center text-center select-none my-2 px-4 max-w-xl mx-auto w-full"
    >
      {/* Soft Ambient Radial Glow */}
      <div
        className="absolute -inset-6 rounded-full pointer-events-none opacity-40 blur-3xl -z-10"
        style={{
          background:
            'radial-gradient(circle, rgba(236,72,153,0.3) 0%, rgba(139,92,246,0.2) 50%, transparent 75%)',
        }}
      />

      {/* Royal Avatar / Crest */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
        className="relative mb-3.5 group"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-pink-400/40 shadow-[0_0_30px_rgba(236,72,153,0.3)] bg-slate-900 p-0.5 relative">
          <img
            src="/saba_bg.jpg"
            alt="Saba's World"
            className="w-full h-full object-cover rounded-[14px] sm:rounded-[22px]"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md border border-white/40">
          <Sparkles size={12} className="animate-pulse" />
        </div>
      </motion.div>

      {/* Main Welcome Heading */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6 }}
        className="space-y-2 w-full"
      >
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-500/10 border border-pink-400/30 text-pink-300 text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md">
          <Heart size={12} className="text-pink-400 fill-pink-400/50" />
          <span>{SABA_WELCOME_CONFIG.badge}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-pink-100 via-rose-50 to-purple-200 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(236,72,153,0.35)] leading-tight">
          {SABA_WELCOME_CONFIG.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-300/85 font-medium max-w-md mx-auto pt-0.5 leading-relaxed">
          {SABA_WELCOME_CONFIG.subtitle}
        </p>

        {/* Words of Grace Quote Card */}
        {!compact && showQuote && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-4 p-4 rounded-2xl bg-white/[0.04] border border-pink-500/20 backdrop-blur-md shadow-lg relative overflow-hidden group text-left"
          >
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/5">
              <span className="text-[11px] font-bold tracking-wider text-pink-300 flex items-center gap-1.5 uppercase">
                <Quote size={13} className="text-pink-400" />
                {SABA_WELCOME_CONFIG.wordsOfGraceTitle}
              </span>
              <button
                onClick={nextQuote}
                className="p-1 rounded-lg text-slate-400 hover:text-pink-300 hover:bg-white/5 transition-colors text-xs flex items-center gap-1"
                title="Next reflection"
              >
                <RefreshCw size={12} />
                <span className="text-[10px]">Next</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={quoteIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="text-xs sm:text-sm text-slate-200 italic font-medium leading-relaxed"
              >
                "{SABA_QUOTES[quoteIndex]}"
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
