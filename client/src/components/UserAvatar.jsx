import React from 'react';

const SABA_QUOTES = [
  'True beauty is reflected in character, kindness, and dignity.',
  'Respect, modesty, and kindness create a beauty that time cannot diminish.',
  'Some people leave an impression through the quiet strength of their character.',
  'A pure heart sees beauty in everything it touches.',
  'Compassion is the most beautiful language the heart speaks.',
];

export default function UserAvatar({
  user,
  size = 40,
  showStatus = false,
  isOnline = false,
  className = '',
}) {
  const isSaba =
    user?.username === 'saba.the.purest.women' ||
    user?.isSabaAI ||
    user?.username?.toLowerCase().includes('saba') ||
    user?.displayName?.toLowerCase().includes('saba');
  const isAdmin = user?.role === 'admin';

  // Use princess image for Saba or user's custom avatar or DiceBear avatar
  const avatarSrc = isSaba
    ? '/saba_bg.jpg'
    : user?.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.username || 'default')}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  const fontSize = size * 0.4;
  const statusSize = Math.max(10, size * 0.28);
  const statusOffset = size * 0.05;

  return (
    <div
      className={`relative inline-flex flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Avatar image */}
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: isSaba
            ? 'linear-gradient(135deg, #f9a8d4, #c084fc)'
            : isAdmin
            ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
            : 'linear-gradient(135deg, #38bdf8, #6366f1)',
          border: isSaba
            ? '2px solid #f9a8d4'
            : isAdmin
            ? '2px solid #fbbf24'
            : '2px solid rgba(255,255,255,0.1)',
        }}
      >
        <img
          src={avatarSrc}
          alt={user?.displayName || 'User'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.querySelector('.fallback-initial')?.classList.remove('hidden');
          }}
        />
        <span
          className="fallback-initial hidden text-white font-semibold select-none"
          style={{ fontSize }}
        >
          {(user?.displayName || user?.username || '?')[0].toUpperCase()}
        </span>
      </div>

      {/* Admin crown badge */}
      {isAdmin && (
        <div
          className="absolute -top-1 -right-1 text-xs leading-none"
          style={{ fontSize: size * 0.3 }}
        >
          👑
        </div>
      )}

      {/* Online status dot */}
      {showStatus && (
        <div
          className={`absolute rounded-full border-2 border-[var(--sidebar-bg)] ${
            isOnline ? 'status-online online-pulse' : 'status-offline'
          }`}
          style={{
            width: statusSize,
            height: statusSize,
            bottom: statusOffset,
            right: statusOffset,
          }}
        />
      )}
    </div>
  );
}
