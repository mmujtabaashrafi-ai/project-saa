import React from 'react';

export default function TypingIndicator({ displayName }) {
  return (
    <div className="flex items-end gap-2 mb-1 px-4">
      <div className="flex items-center gap-2 px-4 py-2.5 bubble-received">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="typing-dot w-2 h-2 rounded-full"
              style={{ background: 'var(--text-muted)', animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        {displayName && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {displayName} is typing
          </span>
        )}
      </div>
    </div>
  );
}
