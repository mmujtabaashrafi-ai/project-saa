import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import ConversationPanel from '../components/ConversationPanel';
import ReactBoatChat from '../components/ReactBoatChat';
import { conversationsApi } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { user } = useAuth();
  const { on, off } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isAIActive, setIsAIActive] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Map());

  // ─── Load conversations ──────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const { data } = await conversationsApi.getAll();
      if (data.success) setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ─── Socket: incoming messages update conversation list ──────────────
  useEffect(() => {
    const handleReceive = ({ message, conversationId }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? {
                ...c,
                lastMessage: {
                  text: message.text,
                  sender: message.sender?._id,
                  timestamp: message.createdAt,
                },
                updatedAt: message.createdAt,
              }
            : c
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    };

    const handleTypingStart = ({ userId, conversationId }) => {
      setTypingUsers((prev) => new Map(prev).set(userId, conversationId));
    };

    const handleTypingStop = ({ userId }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    };

    on('message:receive', handleReceive);
    on('typing:start', handleTypingStart);
    on('typing:stop', handleTypingStop);

    return () => {
      off('message:receive', handleReceive);
      off('typing:start', handleTypingStart);
      off('typing:stop', handleTypingStop);
    };
  }, [on, off]);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setIsAIActive(false);
    setShowSidebar(false); // mobile: hide sidebar
  };

  const handleSelectAI = () => {
    setActiveConversation(null);
    setIsAIActive(true);
    setShowSidebar(false); // mobile: hide sidebar
  };

  const handleBack = () => {
    setShowSidebar(true);
    setActiveConversation(null);
    setIsAIActive(false);
  };

  const isMobile = () => window.innerWidth < 768;

  return (
    <div className="h-screen overflow-hidden flex">
      {/* ─── Sidebar ────────────────────────────────────────────────── */}
      <div
        className={`
          ${isMobile() && !showSidebar ? 'hidden' : 'flex'}
          flex-col
          w-full md:w-80 lg:w-[320px]
          flex-shrink-0
          md:flex
        `}
        style={{ maxWidth: '320px' }}
      >
        <Sidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={handleSelectConversation}
          onSelectAI={handleSelectAI}
          isAIActive={isAIActive}
          typingUsers={typingUsers}
          onRefreshConversations={loadConversations}
        />
      </div>

      {/* ─── Main Panel ─────────────────────────────────────────────── */}
      <div
        className={`
          flex-1 min-w-0
          ${isMobile() && showSidebar ? 'hidden' : 'flex'}
          flex-col
          md:flex
        `}
      >
        <AnimatePresence mode="wait">
          {isAIActive ? (
            <motion.div
              key="ai"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 h-full"
            >
              <ReactBoatChat />
            </motion.div>
          ) : activeConversation ? (
            <motion.div
              key={activeConversation._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 h-full"
            >
              <ConversationPanel
                conversation={activeConversation}
                onBack={handleBack}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <div className="text-center opacity-50 p-8">
                <div className="text-6xl mb-4 animate-pulse">✨</div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                  Saba's World ✨
                </h2>
                <p className="text-[var(--text-muted)] text-sm">
                  Select a conversation or start chatting with Saba's World AI
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
