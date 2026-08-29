import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function LoginSuccessCinematic({ onComplete, duration = 2800 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);
    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  // Generate lightweight ambient blue embers / flame sparks
  const embers = useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: `${(i * 4.5 + Math.random() * 4) % 100}%`,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 2 + 1.8,
      delay: Math.random() * 1.5,
      drift: (Math.random() - 0.5) * 40,
    }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#02040a] overflow-hidden select-none"
    >
      {/* ─── Deep Atmospheric Ambient Backing ─────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(14, 165, 233, 0.18) 0%, rgba(37, 99, 235, 0.1) 40%, rgba(2, 6, 23, 0.9) 75%, #02040a 100%)',
        }}
      />

      {/* Blurred ambient portrait glow in the background for ultra-wide displays */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 scale-110 blur-3xl hidden md:block"
        style={{
          backgroundImage: `url('/saba_bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* ─── Subtle Ambient Flame Particles (Blue Flames Aura) ────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {embers.map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, y: 50, x: 0 }}
            animate={{
              opacity: [0, 0.9, 0],
              y: [-10, -180],
              x: [0, e.drift],
              scale: [0.8, 1.4, 0.6],
            }}
            transition={{
              duration: e.duration,
              delay: e.delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              left: e.left,
              bottom: '12%',
              width: e.size,
              height: e.size * 1.4,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #67e8f9 0%, #38bdf8 60%, #2563eb 100%)',
              boxShadow: '0 0 12px #38bdf8, 0 0 24px #2563eb',
            }}
          />
        ))}
      </div>

      {/* ─── 9:16 Portrait Canvas (Princess & Blue Flames) ─────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 h-[100dvh] md:h-[88vh] md:max-h-[840px] w-auto aspect-[9/16] max-w-full md:rounded-3xl overflow-hidden flex flex-col justify-end shadow-[0_0_60px_rgba(14,165,233,0.35),0_0_120px_rgba(37,99,235,0.2)] md:border md:border-cyan-400/30 bg-black"
      >
        {/* The Exact Princess Image */}
        <motion.img
          src="/saba_bg.jpg"
          alt="Login Success — Saba's World"
          initial={{ scale: 1.01 }}
          animate={{ scale: 1.07 }}
          transition={{ duration: 3.2, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />

        {/* Soft edge vignetting to blend with dark surrounds without covering character face */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(2, 6, 23, 0.94) 0%, rgba(2, 6, 23, 0.45) 26%, transparent 55%, rgba(2, 6, 23, 0.35) 100%)',
          }}
        />

        {/* Subtle royal blue flame glow accent overlay */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40"
          style={{
            background:
              'radial-gradient(circle at 50% 70%, rgba(56, 189, 248, 0.4) 0%, transparent 60%)',
          }}
        />

        {/* ─── Bottom Minimal Elegant Text ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          className="relative z-30 px-6 pb-8 pt-12 text-center flex flex-col items-center"
        >
          {/* Glowing Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 text-[11px] font-semibold tracking-wider uppercase mb-2 shadow-[0_0_18px_rgba(6,182,212,0.35)] backdrop-blur-md">
            <Sparkles size={13} className="text-cyan-400 animate-pulse" />
            <span>Authenticated</span>
          </div>

          {/* Welcome Heading */}
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-100 via-cyan-100 to-indigo-100 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(6,182,212,0.6)]">
            Welcome to your intelligent world
          </h1>

          <p className="text-xs text-cyan-200/70 mt-1 font-medium tracking-wide">
            Entering Saba's World…
          </p>

          {/* Subtle Shimmer Progress Line */}
          <div className="w-36 h-1 rounded-full bg-white/10 mt-4 overflow-hidden relative">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }}
              className="w-full h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
