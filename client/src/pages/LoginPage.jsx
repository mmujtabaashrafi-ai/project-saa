import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Sparkles, Lock, User, AlertCircle, Loader2, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoginSuccessCinematic from '../components/LoginSuccessCinematic';

// ─── Floating aesthetic sparkles & petals ──────────────────────────────────
const FloatingOrb = ({ style }) => (
  <div
    className="absolute rounded-full pointer-events-none blur-xl opacity-25"
    style={{
      background: style.bg || 'radial-gradient(circle, rgba(236,72,153,0.8) 0%, rgba(139,92,246,0.2) 70%)',
      animation: `floatOrb ${style.duration}s ease-in-out infinite alternate`,
      animationDelay: `${style.delay}s`,
      ...style,
    }}
  />
);

const FloatingSparkle = ({ style }) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: style.size,
      height: style.size,
      background: style.color || '#fdf4ff',
      boxShadow: `0 0 ${style.size * 3}px ${style.glow || '#f472b6'}`,
      left: `${style.left}%`,
      top: `${style.top}%`,
      animation: `twinkle ${style.duration}s ease-in-out infinite`,
      animationDelay: `${style.delay}s`,
    }}
  />
);

const orbs = [
  { width: 320, height: 320, left: '10%', top: '15%', duration: 8, delay: 0, bg: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)' },
  { width: 400, height: 400, right: '5%', bottom: '10%', duration: 10, delay: 2, bg: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)' },
  { width: 260, height: 260, right: '25%', top: '10%', duration: 9, delay: 1, bg: 'radial-gradient(circle, rgba(244,114,182,0.25) 0%, transparent 70%)' },
];

const sparkles = Array.from({ length: 24 }, (_, i) => ({
  size: Math.random() * 4 + 2,
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: Math.random() * 3 + 2,
  delay: Math.random() * 3,
  color: i % 3 === 0 ? '#fef08a' : i % 3 === 1 ? '#fbcfe8' : '#e0e7ff',
  glow: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#ec4899' : '#818cf8',
}));

export default function LoginPage() {
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const displayError = formError || error;

  const handleUsernameChange = (e) => {
    if (formError) setFormError('');
    if (error) setError(null);
    setForm((f) => ({ ...f, username: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    if (formError) setFormError('');
    if (error) setError(null);
    setForm((f) => ({ ...f, password: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (error) setError(null);

    if (!form.username.trim()) return setFormError('Username is required');
    if (!form.password) return setFormError('Password is required');
    if (form.password.length < 4) return setFormError('Password is too short');

    setSubmitting(true);
    const result = await login(form.username.trim(), form.password);
    setSubmitting(false);

    if (result.success) {
      // Trigger cinematic princess login-success experience
      setLoginSuccess(true);
    } else {
      setFormError(result.message || 'Invalid username or password. Please try again.');
    }
  };

  if (loginSuccess) {
    return <LoginSuccessCinematic onComplete={() => navigate('/home', { replace: true })} />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#070913] text-white">
      {/* ─── Animated Background Artwork ───────────────────────────────── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: `url('/saba_bg.jpg')`,
          filter: 'brightness(0.68) saturate(1.15)',
          transform: 'scale(1.03)',
          animation: 'gentleZoom 18s ease-in-out infinite alternate',
        }}
      />

      {/* ─── Deep Atmospheric Gradient Overlays ───────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(15, 12, 35, 0.45) 0%, rgba(7, 9, 19, 0.85) 75%, #070913 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          background: 'linear-gradient(135deg, rgba(236,72,153,0.3) 0%, transparent 50%, rgba(139,92,246,0.3) 100%)',
        }}
      />

      {/* Floating ambient glow orbs */}
      {orbs.map((orb, i) => (
        <FloatingOrb key={i} style={orb} />
      ))}

      {/* Floating sparkles */}
      {sparkles.map((sp, i) => (
        <FloatingSparkle key={i} style={sp} />
      ))}

      {/* Subtle animated grid */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
          backgroundSize: '45px 45px',
        }}
      />

      {/* ─── Login Card ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4 my-6"
      >
        <div
          className="relative p-8 sm:p-10 rounded-3xl backdrop-blur-2xl transition-all duration-300"
          style={{
            background: 'rgba(18, 16, 38, 0.72)',
            border: '1px solid rgba(244, 114, 182, 0.28)',
            boxShadow:
              '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 40px -10px rgba(236, 72, 153, 0.2), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Subtle top card glow line */}
          <div
            className="absolute top-0 left-1/4 right-1/4 h-[1.5px] rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(244,114,182,0.8), transparent)',
            }}
          />

          {/* ─── Logo / Brand Header ───────────────────────────────────── */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5, type: 'spring' }}
            className="flex flex-col items-center mb-6"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3.5 shadow-lg shadow-pink-500/25 border border-white/20 relative"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)',
              }}
            >
              <Sparkles size={30} className="text-white drop-shadow-md animate-pulse" />
              <div className="absolute -inset-1 rounded-2xl bg-pink-500/20 blur-sm -z-10" />
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-1.5 bg-gradient-to-r from-pink-200 via-white to-purple-200 bg-clip-text text-transparent">
              SABA'S WORLD
              <span className="text-pink-400 text-2xl">✨</span>
            </h1>
            <p className="text-xs font-medium tracking-wider uppercase mt-1 text-pink-200/60">
              Connect · Communicate · Think
            </p>
          </motion.div>

          {/* ─── Welcome note ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mb-5 text-center"
          >
            <h2 className="text-lg font-semibold text-white/90">Welcome back 👋</h2>
            <p className="text-xs mt-0.5 text-white/50">
              Sign in to your private, secure account
            </p>
          </motion.div>

          {/* ─── Error Banner ─────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {displayError && (
              <motion.div
                key="login-error-banner"
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-2.5 p-3.5 rounded-2xl mb-4 text-xs sm:text-sm font-medium shadow-md shadow-red-950/40"
                style={{
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1px solid rgba(248, 113, 113, 0.4)',
                  color: '#fca5a5',
                }}
              >
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-400" />
                <span className="leading-snug">{displayError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Login Form ───────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-pink-100/70">
                Username
              </label>
              <div className="relative group">
                <User
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors text-white/40 group-focus-within:text-pink-400"
                />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  value={form.username}
                  onChange={handleUsernameChange}
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(236, 72, 153, 0.7)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(236, 72, 153, 0.18)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.09)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.14)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-pink-100/70">
                Password
              </label>
              <div className="relative group">
                <Lock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors text-white/40 group-focus-within:text-pink-400"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(236, 72, 153, 0.7)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(236, 72, 153, 0.18)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.09)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.14)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-pink-300 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={submitting || loading}
              whileHover={{ scale: 1.015, filter: 'brightness(1.08)' }}
              whileTap={{ scale: 0.985 }}
              className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wider uppercase text-white flex items-center justify-center gap-2 mt-6 transition-all duration-200 relative overflow-hidden"
              style={{
                background: submitting
                  ? 'rgba(236, 72, 153, 0.5)'
                  : 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)',
                boxShadow: '0 8px 25px -4px rgba(236, 72, 153, 0.45), 0 0 15px rgba(168, 85, 247, 0.25)',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>Signing in…</span>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles size={16} />
                  SIGN IN
                </span>
              )}
            </motion.button>
          </form>

          {/* ─── Footer note ──────────────────────────────────────────── */}
          <div className="text-center text-[11px] mt-6 flex items-center justify-center gap-1.5 text-white/40">
            <span>Saba's World</span>
            <span>·</span>
            <span>Secure</span>
            <span>·</span>
            <span>Private Messaging</span>
          </div>
        </div>
      </motion.div>

      {/* ─── Custom CSS Animations ─────────────────────────────────────── */}
      <style>{`
        @keyframes floatOrb {
          0% { transform: translateY(0px) scale(1); }
          100% { transform: translateY(-30px) scale(1.08); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.95; transform: scale(1.3); }
        }
        @keyframes gentleZoom {
          0% { transform: scale(1.02); }
          100% { transform: scale(1.08) translate(-8px, -5px); }
        }
      `}</style>
    </div>
  );
}
