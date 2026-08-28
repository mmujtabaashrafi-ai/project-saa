import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const StatusIcon = ({ status }) => {
  if (status === 'read') return <CheckCheck size={13} className="text-blue-300" />;
  if (status === 'delivered') return <CheckCheck size={13} className="text-white/50" />;
  if (status === 'sent') return <Check size={13} className="text-white/50" />;
  return <Clock size={13} className="text-white/40" />;
};

export default function MessageBubble({ message, isOwn, showAvatar }) {
  const timeStr = message.createdAt
    ? format(new Date(message.createdAt), 'HH:mm')
    : '';

  return (
    <div className={`flex items-end gap-2 mb-1 message-appear ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar placeholder for spacing alignment */}
      <div className="w-6 flex-shrink-0" />

      {/* Bubble */}
      <div className={`max-w-[72%] sm:max-w-[60%] group relative`}>
        <div
          className={`px-4 py-2.5 ${isOwn ? 'bubble-sent' : 'bubble-received'}`}
          style={{ wordBreak: 'break-word' }}
        >
          <p className="text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
            {message.text}
          </p>
        </div>

        {/* Timestamp + status */}
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeStr}</span>
          {isOwn && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}
