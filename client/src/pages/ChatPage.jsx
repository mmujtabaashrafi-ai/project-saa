import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ConversationPanel from '../components/ConversationPanel';
import ReactBoatChat from '../components/ReactBoatChat';
import WelcomeSabaBanner from '../components/WelcomeSabaBanner';
import { conversationsApi } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { user } = useAuth();
  const { on, off } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isAIActive, setIsAIActive] = useState(true);
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
        prev
          .map((c) =>
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
          )
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
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
    setShowSidebar(false); // On phone: switch to conversation view
  };

  const handleSelectAI = () => {
    setActiveConversation(null);
    setIsAIActive(true);
    setShowSidebar(false); // On phone: switch to AI view
  };

  const handleBackToSidebar = () => {
    setShowSidebar(true);
    setActiveConversation(null);
    setIsAIActive(false);
  };

  return (
    <div className="h-dvh w-full overflow-hidden flex flex-col md:flex-row bg-[var(--bg-primary)] pt-12 md:pt-0">
      {/* ─── Sidebar (Conversations List) ─────────────────────────── */}
      <div
        className={`
          ${!showSidebar ? 'hidden md:flex' : 'flex'}
          flex-col
          w-full md:w-80 lg:w-[340px]
          flex-shrink-0
          border-r border-white/10
          h-full
        `}
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

      {/* ─── Main Chat Panel ──────────────────────────────────────── */}
      <div
        className={`
          ${showSidebar ? 'hidden md:flex' : 'flex'}
          flex-1 min-w-0
          flex-col
          h-full
          relative
        `}
      >
        {/* Mobile Top Back Bar when in AI chat */}
        {isAIActive && (
          <div className="md:hidden flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-white/10 flex-shrink-0">
            <button
              onClick={handleBackToSidebar}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs font-semibold hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to chats</span>
            </button>
            <span className="text-xs font-bold text-pink-300">Saba AI Hub</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isAIActive ? (
            <motion.div
              key="ai"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 h-full min-h-0 flex flex-col"
            >
              <ReactBoatChat />
            </motion.div>
          ) : activeConversation ? (
            <motion.div
              key={activeConversation._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 h-full min-h-0 flex flex-col"
            >
              <ConversationPanel
                conversation={activeConversation}
                onBack={handleBackToSidebar}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 overflow-y-auto text-center"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <WelcomeSabaBanner />
              <button
                onClick={() => setIsAIActive(true)}
                className="mt-6 px-6 py-3 rounded-2xl text-white font-semibold text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-pink-500/25 hover:brightness-110 active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
              >
                <span>Chat with Saba AI</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
