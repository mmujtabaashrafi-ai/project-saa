import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <div className="text-center text-white">
        <div className="text-8xl mb-4 float-anim">✨</div>
        <h1 className="text-6xl font-black mb-2">404</h1>
        <p className="text-xl opacity-70 mb-6">Page not found</p>
        <Link to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
          <Sparkles size={18} />
          Back to Saba's World
        </Link>
      </div>
    </div>
  );
}
