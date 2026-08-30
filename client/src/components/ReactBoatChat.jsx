import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Trash2, Loader2, Sparkles, X } from 'lucide-react';
import { reactBoatApi } from '../services/api';
import { format } from 'date-fns';
import WelcomeSabaBanner from './WelcomeSabaBanner';
import { SABA_QUICK_PROMPTS } from '../data/sabaKnowledge';

// ─── Simple markdown renderer ─────────────────────────────────────────────
const renderMarkdown = (text) => {
  if (!text) return '';
  let html = String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Headings
    .replace(/^### (.+)$/gm, '<h3 style="font-size:0.95rem;font-weight:700;margin:8px 0 4px;color:#fbcfe8">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1rem;font-weight:700;margin:8px 0 4px;color:#f472b6">$1</h2>')
    // Lists
    .replace(/^- (.+)$/gm, '<li style="margin:2px 0">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\s*)+/gs, (m) => `<ul style="padding-left:16px;margin:4px 0">${m}</ul>`)
    // Tables (basic)
    .replace(/\|(.+)\|/g, (m) => {
      const cells = m.split('|').filter(Boolean).map((c) => c.trim());
      return `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\s*)+/gs, (m) => `<table>${m}</table>`)
    // Line breaks
    .replace(/\n/g, '<br>');

  return html;
};

// ─── AI Message bubble ─────────────────────────────────────────────────────
const AIMessage = ({ message }) => {
  const isAI = message.role === 'assistant';
  const timeStr = message.timestamp
    ? format(new Date(message.timestamp), 'HH:mm')
    : '';

  const messageText =
    typeof message.content === 'string'
      ? message.content
      : message.content?.content
      ? String(message.content.content)
      : message.content != null
      ? String(message.content)
      : 'I am here to assist you with thoughtful conversation.';

  return (
    <div className={`flex items-end gap-2 mb-3 message-appear ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
      {isAI && (
        <div className="w-8 h-8 rounded-full overflow-hidden border border-pink-400/50 shadow-md shadow-pink-500/20 bg-slate-900 flex-shrink-0">
          <img src="/saba_bg.jpg" alt="Saba AI" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="max-w-[82%]">
        <div
          className={`px-4 py-3 ${isAI ? 'bubble-ai ai-message' : 'bubble-sent'}`}
          style={{ wordBreak: 'break-word' }}
        >
          {isAI ? (
            <div
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(messageText) }}
            />
          ) : (
            <p className="text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
              {messageText}
            </p>
          )}
        </div>
        <div className={`text-xs mt-0.5 ${isAI ? 'text-left' : 'text-right'}`}
          style={{ color: 'var(--text-muted)' }}>
          {timeStr} {isAI && '· Saba AI'}
        </div>
      </div>
    </div>
  );
};

// ─── Thinking indicator ───────────────────────────────────────────────────
const ThinkingIndicator = () => (
  <div className="flex items-end gap-2 mb-3">
    <div className="w-8 h-8 rounded-full overflow-hidden border border-pink-400/50 shadow-md shadow-pink-500/20 bg-slate-900 flex-shrink-0">
      <img src="/saba_bg.jpg" alt="Saba AI" className="w-full h-full object-cover" />
    </div>
    <div className="px-4 py-3 bubble-ai">
      <div className="flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <span key={i} className="typing-dot w-2 h-2 rounded-full bg-pink-400/80"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
        <span className="text-xs text-slate-300 ml-1">Saba AI is reflecting…</span>
      </div>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────
export default function ReactBoatChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load history
  useEffect(() => {
    reactBoatApi.getHistory()
      .then(({ data }) => {
        if (data.success) setMessages(data.messages || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || thinking) return;

    setInput('');
    const userMsg = { role: 'user', content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    try {
      const { data } = await reactBoatApi.chat(trimmed);
      if (data && data.success) {
        const responseText =
          data.response ||
          (typeof data.message === 'string' ? data.message : data.message?.content) ||
          data.assistantMessage?.content ||
          'I am here to assist you with thoughtful conversation and learning.';

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: responseText, timestamp: new Date() },
        ]);
      } else {
        throw new Error(data?.message || 'Failed to get response');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm currently in development mode, but I can still help with Saba's World, programming, learning and thoughtful conversations. 🌸",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const clearHistory = async () => {
    try {
      await reactBoatApi.clearHistory();
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)' }}>
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]"
        style={{ background: 'var(--bg-card)' }}>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-pink-400/50 shadow-md shadow-pink-500/20 bg-slate-900">
          <img src="/saba_bg.jpg" alt="Saba AI" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">Saba's World AI</span>
            <span className="text-xs px-2 py-0.5 rounded-full text-white font-bold"
              style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
              AI ✨
            </span>
          </div>
          <div className="text-xs text-emerald-400 font-medium">● Online · Personal Assistant</div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearHistory}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-400 transition-colors"
            title="Clear Chat History">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* ─── Messages ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4 px-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-pink-400" />
          </div>
        ) : messages.length === 0 ? (
          /* Welcome screen */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-full py-6 gap-6 max-w-xl mx-auto"
          >
            <WelcomeSabaBanner />

            {/* Quick prompts */}
            <div className="w-full">
              <div className="text-xs font-semibold uppercase tracking-wider text-pink-300/80 mb-2.5 text-center flex items-center justify-center gap-1.5">
                <Sparkles size={13} className="text-pink-400" />
                <span>Quick Prompts</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                {SABA_QUICK_PROMPTS.map((qp) => (
                  <motion.button
                    key={qp.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => sendMessage(qp.prompt)}
                    className="p-3 rounded-2xl text-left transition-all flex items-center gap-3 glass-card hover:border-pink-500/40 hover:bg-pink-500/10"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div className="text-lg p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 flex-shrink-0">{qp.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-pink-200">{qp.label}</div>
                      <div className="text-[11px] text-[var(--text-muted)] line-clamp-1">{qp.description}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <AIMessage key={i} message={msg} />
            ))}
            {thinking && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ─── Input ───────────────────────────────────────────────────── */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 pb-20 md:pb-3 border-t border-[var(--border)]"
        style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-end gap-2 sm:gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Saba AI anything… (Shift+Enter for new line)"
            rows={1}
            disabled={thinking}
            className="flex-1 resize-none rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none transition-all disabled:opacity-60"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              maxHeight: '120px',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <motion.button
            onClick={() => sendMessage()}
            disabled={!input.trim() || thinking}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-md"
            style={{
              background: input.trim() && !thinking
                ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                : 'var(--bg-secondary)',
              color: input.trim() && !thinking ? 'white' : 'var(--text-muted)',
            }}
          >
            {thinking ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} />}
          </motion.button>
        </div>
        <p className="text-[10px] sm:text-xs mt-1.5 text-center hidden sm:block" style={{ color: 'var(--text-muted)' }}>
          Saba's World AI · Thoughtful, respectful & private assistance
        </p>
      </div>
    </div>
  );
}
