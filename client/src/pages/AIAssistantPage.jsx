import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Plus,
  Sparkles,
  ChevronDown,
  Trash2,
  Brain,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  X,
  MessageSquare,
  Menu,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { aiApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import WelcomeSabaBanner from '../components/WelcomeSabaBanner';
import { SABA_QUICK_PROMPTS } from '../data/sabaKnowledge';

function AIMessageBubble({ msg }) {
  if (!msg) return null;
  const isUser = msg.role === 'user';
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = (code, blockId) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(blockId);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const messageText =
    typeof msg.content === 'string'
      ? msg.content
      : msg.content?.content
      ? String(msg.content.content)
      : msg.content != null
      ? String(msg.content)
      : 'I am here to assist you with thoughtful conversation and learning.';

  return (
    <div className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold uppercase shadow-md">
            You
          </div>
        ) : (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-pink-400/50 shadow-md shadow-pink-500/20 bg-slate-900">
            <img src="/saba_bg.jpg" alt="Saba AI" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl sm:rounded-3xl px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-lg ${
          isUser
            ? 'bg-gradient-to-br from-pink-600 to-purple-700 text-white rounded-tr-sm'
            : 'bg-slate-800/90 border border-white/10 text-slate-100 rounded-tl-sm'
        }`}
      >
        {isUser ? (
          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{messageText}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none text-xs sm:text-sm leading-relaxed">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeStr = String(children).replace(/\n$/, '');
                  const blockId = `${codeStr.slice(0, 20)}`;

                  if (!inline && match) {
                    return (
                      <div className="relative my-2 sm:my-3 rounded-xl overflow-hidden border border-white/10">
                        <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-white/10 text-[10px] sm:text-[11px]">
                          <span className="text-slate-400 font-mono font-semibold uppercase">
                            {match[1]}
                          </span>
                          <button
                            onClick={() => handleCopyCode(codeStr, blockId)}
                            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedCode === blockId ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="!m-0 !rounded-none text-[11px] sm:text-xs"
                          {...props}
                        >
                          {codeStr}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }
                  return (
                    <code
                      className="bg-white/10 px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-mono text-pink-300"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => <p className="my-1.5 text-xs sm:text-sm">{children}</p>,
                ul: ({ children }) => <ul className="my-1.5 ml-4 list-disc text-xs sm:text-sm">{children}</ul>,
                ol: ({ children }) => <ol className="my-1.5 ml-4 list-decimal text-xs sm:text-sm">{children}</ol>,
                li: ({ children }) => <li className="my-0.5">{children}</li>,
                h1: ({ children }) => <h1 className="text-sm sm:text-base font-bold mt-2.5 mb-1 text-pink-200">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xs sm:text-sm font-bold mt-2 mb-1 text-purple-200">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xs font-bold mt-1.5 mb-0.5 text-purple-300">{children}</h3>,
                strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-pink-400 pl-3 my-2 text-slate-200 italic text-xs bg-pink-500/5 py-1 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {messageText}
            </ReactMarkdown>
          </div>
        )}

        {msg.contextSources?.length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-white/10 text-[9px] sm:text-[10px] text-pink-300/70 flex items-center gap-1">
            <Brain size={10} />
            <span>Answered from {msg.contextSources.length} knowledge source(s)</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [memoryCount, setMemoryCount] = useState(0);
  const [showDrawer, setShowDrawer] = useState(false);
  const [clearingMemory, setClearingMemory] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversations list & memory count
  const loadConversations = useCallback(async () => {
    try {
      const [convsRes, memRes] = await Promise.all([
        aiApi.getConversations(),
        aiApi.getMemory(),
      ]);
      if (convsRes.data?.success) {
        setConversations(convsRes.data.conversations || []);
      }
      if (memRes.data?.success) {
        setMemoryCount((memRes.data.memory || []).length);
      }
    } catch (err) {
      console.error('Load conversations error:', err);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      const { data } = await aiApi.getMessages(convId);
      if (data?.success) setMessages(data.messages || []);
    } catch (err) {
      console.error('Load messages error:', err);
    }
  }, []);

  useEffect(() => {
    loadMessages(activeConvId);
  }, [activeConvId, loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleNewConversation = async () => {
    try {
      const { data } = await aiApi.createConversation({ title: 'New Conversation' });
      if (data?.success) {
        setConversations((prev) => [data.conversation, ...prev]);
        setActiveConvId(data.conversation._id);
        setMessages([]);
        setShowDrawer(false);
      }
    } catch (err) {
      console.error('Create conversation error:', err);
    }
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await aiApi.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (activeConvId === convId) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Delete conversation error:', err);
    }
  };

  const handleClearMemory = async () => {
    if (!confirm('Clear all AI memory? This cannot be undone.')) return;
    setClearingMemory(true);
    try {
      await aiApi.clearMemory();
      setMemoryCount(0);
    } catch (err) {
      console.error('Clear memory error:', err);
    } finally {
      setClearingMemory(false);
    }
  };

  const sendMessageCore = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);

    // Optimistically add user message
    const tempMsg = { _id: `temp_${Date.now()}`, role: 'user', content: text };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      let convId = activeConvId;

      // Auto-create conversation if none
      if (!convId) {
        const { data: convData } = await aiApi.createConversation({
          title: text.slice(0, 35),
        });
        if (convData?.success) {
          convId = convData.conversation._id;
          setActiveConvId(convId);
          setConversations((prev) => [convData.conversation, ...prev]);
        }
      }

      const { data } = await aiApi.sendMessage({ conversationId: convId, message: text });
      if (data && data.success) {
        const userMsg = data.userMessage || tempMsg;
        const rawAssistant = data.assistantMessage || data.message || {};
        const assistantContent =
          typeof rawAssistant === 'string'
            ? rawAssistant
            : rawAssistant.content || data.response || "I am here to assist you with thoughtful conversation and learning.";

        const assistantMsg = {
          _id: rawAssistant._id || `ai_${Date.now()}`,
          role: 'assistant',
          content: assistantContent,
          contextSources: rawAssistant.contextSources || data.contextSources || [],
          createdAt: rawAssistant.createdAt || new Date().toISOString(),
        };

        setMessages((prev) => {
          const filtered = prev.filter((m) => m._id !== tempMsg._id);
          return [...filtered, userMsg, assistantMsg];
        });

        if (data.memoryExtracted) {
          setMemoryCount((prev) => prev + data.memoryExtracted);
        }
        await loadConversations();
      } else {
        throw new Error(data?.message || 'Failed to receive AI response');
      }
    } catch (err) {
      console.error('AI send error:', err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "I'm currently in development mode, but I can still help with Saba's World, programming, learning and thoughtful conversations. 🌸";
      setMessages((prev) => [
        ...prev,
        {
          _id: `err_${Date.now()}`,
          role: 'assistant',
          content: `🌸 ${errMsg}`,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    sendMessageCore(input);
  };

  const handleQuickPromptClick = (promptText) => {
    sendMessageCore(promptText);
  };

  return (
    <div className="flex-1 h-dvh w-full flex overflow-hidden bg-[var(--bg-primary)] pt-12 md:pt-0">
      {/* ─── Conversation Drawer (Desktop Sidebar) ─────────────────── */}
      <div className="hidden md:flex w-72 flex-col border-r border-white/10 bg-slate-950/60 backdrop-blur flex-shrink-0">
        {/* Drawer Header */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-pink-400/40 shadow bg-slate-900 flex items-center justify-center">
              <img src="/saba_bg.jpg" alt="Saba AI" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Saba AI Assistant</h2>
              <p className="text-[10px] text-pink-300/80">Conversational Assistant</p>
            </div>
          </div>

          {/* Memory Badge */}
          {memoryCount > 0 && (
            <button
              onClick={handleClearMemory}
              disabled={clearingMemory}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-300 transition-all"
            >
              <Brain size={13} />
              <span className="flex-1 text-left truncate">
                {clearingMemory ? 'Clearing…' : `${memoryCount} memories stored`}
              </span>
              {!clearingMemory && <Trash2 size={12} />}
            </button>
          )}

          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-xs transition-all shadow-md hover:brightness-110 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
          >
            <Plus size={15} />
            New Conversation
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {loadingConvs ? (
            <div className="py-10 text-center text-slate-500 text-xs">Loading…</div>
          ) : conversations.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">No conversations yet.</div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                onClick={() => setActiveConvId(conv._id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer group transition-all ${
                  activeConvId === conv._id
                    ? 'bg-white/10 border border-white/10 text-white'
                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <MessageSquare size={14} className="flex-shrink-0 text-slate-500" />
                <span className="flex-1 truncate text-xs font-medium">
                  {conv.title || 'Untitled Chat'}
                </span>
                <button
                  onClick={(e) => handleDeleteConversation(conv._id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Main Chat Area ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 h-full relative">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 border-b border-white/10 bg-slate-900/80 backdrop-blur z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-pink-400/50 shadow-md shadow-pink-500/25 bg-slate-900 flex items-center justify-center flex-shrink-0">
              <img src="/saba_bg.jpg" alt="Saba's World AI" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-bold text-white text-xs sm:text-sm">Saba's World AI</h2>
              <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Online · Conversational Assistant
              </p>
            </div>
          </div>

          {/* Header Action: Mobile Drawer Toggle & New Chat */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleNewConversation}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-pink-300 hover:bg-white/10 transition-colors md:hidden"
              title="New Chat"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setShowDrawer(true)}
              className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
              title="History"
            >
              <Menu size={16} />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full py-4 gap-4 sm:gap-5 text-center px-2 max-w-2xl mx-auto">
              <WelcomeSabaBanner />

              {/* Saba Quick Prompts Cards */}
              <div className="w-full mt-1">
                <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-pink-300/80 mb-2 flex items-center justify-center gap-1.5">
                  <Sparkles size={13} className="text-pink-400" />
                  <span>Quick Inquiries & Reflections</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full">
                  {SABA_QUICK_PROMPTS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleQuickPromptClick(item.prompt)}
                      className="text-left px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-pink-500/40 hover:bg-pink-500/10 text-xs text-slate-200 hover:text-white transition-all shadow-sm flex items-center gap-3 group active:scale-[0.98]"
                    >
                      <span className="text-base sm:text-lg p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-xs truncate group-hover:text-pink-200 transition-colors">
                          {item.label}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-1">
                          {item.description}
                        </div>
                      </div>
                      <Sparkles size={12} className="text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => <AIMessageBubble key={msg._id} msg={msg} />)
          )}

          {/* AI Typing Indicator */}
          {loading && (
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-pink-400/50 shadow-md shadow-pink-500/20 bg-slate-900 flex items-center justify-center flex-shrink-0">
                <img src="/saba_bg.jpg" alt="Saba AI" className="w-full h-full object-cover" />
              </div>
              <div className="bg-slate-800/80 border border-white/10 rounded-2xl sm:rounded-3xl rounded-tl-sm px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center gap-1.5">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-pink-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
                <span className="text-[11px] sm:text-xs text-slate-300 ml-1.5">Saba AI is reflecting…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area (with mobile bottom padding so it sits above mobile nav bar) */}
        <div className="p-3 sm:p-4 pb-20 md:pb-4 border-t border-white/10 bg-slate-900/90 backdrop-blur-xl flex-shrink-0">
          <form onSubmit={handleSend} className="flex items-end gap-2 sm:gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Ask Saba AI anything… (Shift+Enter for new line)"
                rows={1}
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-slate-800/90 border border-white/10 text-white text-xs sm:text-sm outline-none focus:border-pink-400 transition-all resize-none"
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 sm:p-3.5 rounded-2xl text-white font-semibold disabled:opacity-50 shadow-lg transition-all flex items-center justify-center flex-shrink-0 hover:brightness-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
            >
              <Send size={16} />
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-500 mt-1.5 hidden sm:block">
            Saba's World AI · Thoughtful, conversational & private assistance
          </p>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex md:hidden"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDrawer(false)} />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="relative w-80 max-w-[85vw] h-full bg-slate-950 border-r border-white/10 flex flex-col z-10"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg overflow-hidden border border-pink-400/40">
                    <img src="/saba_bg.jpg" alt="Saba AI" className="w-full h-full object-cover" />
                  </div>
                  <h2 className="font-bold text-white text-sm">Conversations</h2>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-3">
                <button
                  onClick={handleNewConversation}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-xs transition-all shadow-md"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
                >
                  <Plus size={15} />
                  New Conversation
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-20 space-y-0.5">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">No conversations yet</div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv._id}
                      onClick={() => {
                        setActiveConvId(conv._id);
                        setShowDrawer(false);
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        activeConvId === conv._id
                          ? 'bg-white/10 text-white font-semibold'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <MessageSquare size={14} className="flex-shrink-0 text-slate-500" />
                      <span className="flex-1 truncate text-xs">{conv.title || 'Untitled'}</span>
                      <button
                        onClick={(e) => handleDeleteConversation(conv._id, e)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
