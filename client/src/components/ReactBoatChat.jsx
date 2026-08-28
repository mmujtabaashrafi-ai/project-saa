import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Trash2, Loader2, Sparkles, X } from 'lucide-react';
import { reactBoatApi } from '../services/api';
import { format } from 'date-fns';

// ─── Simple markdown renderer ─────────────────────────────────────────────
const renderMarkdown = (text) => {
  let html = text
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
    .replace(/^### (.+)$/gm, '<h3 style="font-size:0.95rem;font-weight:700;margin:8px 0 4px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1rem;font-weight:700;margin:8px 0 4px">$1</h2>')
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

  return (
    <div className={`flex items-end gap-2 mb-3 message-appear ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
      {isAI && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Bot size={16} className="text-white" />
        </div>
      )}
      <div className="max-w-[80%]">
        <div
          className={`px-4 py-3 ${isAI ? 'bubble-ai ai-message' : 'bubble-sent'}`}
          style={{ wordBreak: 'break-word' }}
        >
          {isAI ? (
            <div
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
          ) : (
            <p className="text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </p>
          )}
        </div>
        <div className={`text-xs mt-0.5 ${isAI ? 'text-left' : 'text-right'}`}
          style={{ color: 'var(--text-muted)' }}>
          {timeStr} {isAI && '· React Boat AI'}
        </div>
      </div>
    </div>
  );
};

// ─── Thinking indicator ───────────────────────────────────────────────────
const ThinkingIndicator = () => (
  <div className="flex items-end gap-2 mb-3">
    <div className="w-8 h-8 rounded-full flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
      <Bot size={16} className="text-white" />
    </div>
    <div className="px-4 py-3 bubble-ai">
      <div className="flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span key={i} className="typing-dot w-2 h-2 rounded-full bg-white/60"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
        <span className="text-xs text-white/60 ml-1">Thinking…</span>
      </div>
    </div>
  </div>
);

// ─── Quick prompts ────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: '☕', label: 'Java OOP', prompt: 'Explain Java OOP concepts with examples' },
  { icon: '🐍', label: 'Python Basics', prompt: 'What are the key Python fundamentals I should know?' },
  { icon: '🧩', label: 'DSA Tips', prompt: 'Give me a DSA study roadmap and key algorithms to learn' },
  { icon: '🤖', label: 'AI/ML Intro', prompt: 'How do I get started with machine learning?' },
];

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
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response, timestamp: new Date() },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
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
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
          <Bot size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">Saba's World</span>
            <span className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
              AI ✨
            </span>
          </div>
          <div className="text-xs text-green-500">● Online · AI Assistant</div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearHistory}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-400 transition-colors">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* ─── Messages ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4 px-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
          </div>
        ) : messages.length === 0 ? (
          /* Welcome screen */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6"
          >
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-pink-500/20"
                style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
                <Sparkles size={36} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Saba's World AI ✨</h2>
              <p className="text-[var(--text-muted)] text-sm mt-1">
                Your intelligent, kind & thoughtful assistant
              </p>
            </div>

            {/* Quick prompts */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {QUICK_PROMPTS.map((qp) => (
                <motion.button
                  key={qp.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendMessage(qp.prompt)}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="text-lg mb-1">{qp.icon}</div>
                  <div className="text-xs font-medium text-[var(--text-primary)]">{qp.label}</div>
                </motion.button>
              ))}
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
      <div className="px-4 py-3 border-t border-[var(--border)]"
        style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask React Boat anything…"
            rows={1}
            disabled={thinking}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-60"
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
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: input.trim() && !thinking
                ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                : 'var(--bg-secondary)',
              color: input.trim() && !thinking ? 'white' : 'var(--text-muted)',
            }}
          >
            {thinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </motion.button>
        </div>
        <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
          Powered by React Boat AI · {import.meta.env.PROD ? '' : 'Development Mode'}
        </p>
      </div>
    </div>
  );
}
