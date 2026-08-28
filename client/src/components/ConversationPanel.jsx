import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone, Video, MoreVertical, ArrowLeft, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messagesApi } from '../services/api';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import UserAvatar from './UserAvatar';
import { format } from 'date-fns';
import ProfileModal from './ProfileModal';

export default function ConversationPanel({
  conversation,
  onBack,
  onTypingUpdate,
}) {
  const { user } = useAuth();
  const { socket, onlineUsers, emit, on, off } = useSocket();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const otherParticipant = conversation?.participants?.find(
    (p) => p._id !== user?._id
  );
  const isOtherOnline = otherParticipant ? onlineUsers.has(otherParticipant._id) : false;

  // ─── Load messages ─────────────────────────────────────────────────
  useEffect(() => {
    if (!conversation?._id) return;
    setMessages([]);
    setLoading(true);

    messagesApi.getByConversation(conversation._id)
      .then(({ data }) => {
        if (data.success) setMessages(data.messages || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    inputRef.current?.focus();
  }, [conversation?._id]);

  // ─── Auto-scroll ────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ─── Socket: receive messages ────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleReceive = ({ message, conversationId }) => {
      if (conversationId === conversation?._id) {
        setMessages((prev) => [...prev, message]);
        // Mark as read
        if (message._id && message.sender?._id !== user?._id) {
          emit('message:read', {
            messageId: message._id,
            senderId: message.sender?._id,
            conversationId,
          });
        }
      }
    };

    const handleDelivered = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status: 'delivered' } : m))
      );
    };

    const handleRead = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status: 'read' } : m))
      );
    };

    const handleTypingStart = ({ userId }) => {
      if (userId === otherParticipant?._id) setIsTyping(true);
    };

    const handleTypingStop = ({ userId }) => {
      if (userId === otherParticipant?._id) setIsTyping(false);
    };

    on('message:receive', handleReceive);
    on('message:delivered', handleDelivered);
    on('message:read', handleRead);
    on('typing:start', handleTypingStart);
    on('typing:stop', handleTypingStop);

    return () => {
      off('message:receive', handleReceive);
      off('message:delivered', handleDelivered);
      off('message:read', handleRead);
      off('typing:start', handleTypingStart);
      off('typing:stop', handleTypingStop);
    };
  }, [socket, conversation?._id, otherParticipant?._id]);

  // ─── Typing detection ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (!typingTimeout) {
      emit('typing:start', {
        receiverId: otherParticipant?._id,
        conversationId: conversation?._id,
      });
    }

    clearTimeout(typingTimeout);
    setTypingTimeout(
      setTimeout(() => {
        emit('typing:stop', {
          receiverId: otherParticipant?._id,
          conversationId: conversation?._id,
        });
        setTypingTimeout(null);
      }, 2000)
    );
  };

  // ─── Send message ────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);

    // Stop typing
    clearTimeout(typingTimeout);
    emit('typing:stop', {
      receiverId: otherParticipant?._id,
      conversationId: conversation?._id,
    });

    // Optimistic UI
    const tempMessage = {
      _id: `temp_${Date.now()}`,
      text,
      sender: user,
      conversationId: conversation._id,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    // Send via Socket.IO for real-time
    emit(
      'message:send',
      {
        conversationId: conversation._id,
        text,
        receiverId: otherParticipant?._id,
      },
      (response) => {
        if (response?.success) {
          // Replace temp message with real one
          setMessages((prev) =>
            prev.map((m) => (m._id === tempMessage._id ? response.message : m))
          );
        }
        setSending(false);
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="text-center opacity-40">
          <div className="text-5xl mb-3">💬</div>
          <p className="text-[var(--text-secondary)]">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)' }}>
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]"
        style={{ background: 'var(--bg-card)' }}>
        {/* Mobile back button */}
        <button onClick={onBack} className="md:hidden p-1 rounded-lg hover:bg-[var(--bg-secondary)] mr-1">
          <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
        </button>

        <button onClick={() => setShowProfile(true)} className="flex items-center gap-3 flex-1 min-w-0">
          <UserAvatar user={otherParticipant} size={40} showStatus isOnline={isOtherOnline} />
          <div className="text-left min-w-0">
            <div className="font-semibold text-[var(--text-primary)] truncate">
              {otherParticipant?.displayName || 'Unknown'}
            </div>
            <div className="text-xs" style={{ color: isOtherOnline ? 'var(--success)' : 'var(--text-muted)' }}>
              {isTyping ? '✍️ typing…' : isOtherOnline ? '● Online' : 'Offline'}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <Phone size={18} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <Video size={18} />
          </button>
          <button onClick={() => setShowProfile(true)}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <Info size={18} />
          </button>
        </div>
      </div>

      {/* ─── Messages ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4 px-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-[var(--text-muted)] text-sm animate-pulse">Loading messages…</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
            <UserAvatar user={otherParticipant} size={64} />
            <p className="text-[var(--text-muted)] text-sm">
              Say hello to {otherParticipant?.displayName} 👋
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id;
              const prevMsg = messages[idx - 1];
              const showDate =
                idx === 0 ||
                format(new Date(msg.createdAt), 'yyyy-MM-dd') !==
                  format(new Date(prevMsg.createdAt), 'yyyy-MM-dd');

              return (
                <React.Fragment key={msg._id}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="text-xs px-3 py-1 rounded-full"
                        style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                        {format(new Date(msg.createdAt), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  <MessageBubble message={msg} isOwn={isOwn} />
                </React.Fragment>
              );
            })}

            {isTyping && <TypingIndicator displayName={otherParticipant?.displayName} />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ─── Message Input ────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-[var(--border)]"
        style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              maxHeight: '120px',
              lineHeight: '1.5',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <motion.button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: input.trim()
                ? 'linear-gradient(135deg, #0ea5e9, #6366f1)'
                : 'var(--bg-secondary)',
              color: input.trim() ? 'white' : 'var(--text-muted)',
            }}
          >
            <Send size={18} />
          </motion.button>
        </div>
        <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <ProfileModal user={otherParticipant} onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
