import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, Plus, Trash2, X, Sun, Moon, Sunset,
  Smile, Meh, Frown, Heart, ListTodo, RotateCcw, Sparkles, Star,
} from 'lucide-react';
import { todosApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PRIORITY_COLORS = {
  high: 'text-rose-400 border-rose-400/30 bg-rose-500/10',
  medium: 'text-amber-400 border-amber-400/30 bg-amber-500/10',
  low: 'text-emerald-400 border-emerald-400/30 bg-emerald-500/10',
};

const CATEGORY_EMOJI = {
  routine: '⏰', work: '💼', study: '📚', wellness: '🌿', reminder: '🔔', general: '📝',
};

const MOODS = [
  { icon: '😊', label: 'Great', color: 'text-emerald-400' },
  { icon: '😐', label: 'Okay', color: 'text-amber-400' },
  { icon: '😔', label: 'Low', color: 'text-blue-400' },
  { icon: '😤', label: 'Stressed', color: 'text-rose-400' },
];

const MOOD_MESSAGES = {
  '😊': "That's wonderful! Keep that positive energy going! ✨",
  '😐': "Hanging in there — that's perfectly okay! 💪",
  '😔': "I'm here for you. Take it one step at a time. 💙",
  '😤': "Let's breathe and take it slow. You've got this! 🌿",
};

export default function DailyPanel({ onSendToChat }) {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newCategory, setNewCategory] = useState('general');
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodMessage, setMoodMessage] = useState('');
  const [tab, setTab] = useState('summary'); // 'summary' | 'todos' | 'mood'

  const loadData = useCallback(async () => {
    try {
      const [todosRes, summaryRes] = await Promise.all([
        todosApi.getAll(),
        todosApi.getDailySummary(),
      ]);
      if (todosRes.data.success) setTodos(todosRes.data.todos);
      if (summaryRes.data.success) setSummary(summaryRes.data.summary);
    } catch (err) {
      console.error('DailyPanel load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleTodo = async (todo) => {
    try {
      const res = await todosApi.update(todo._id, { completed: !todo.completed });
      if (res.data.success) {
        setTodos((prev) => prev.map((t) => (t._id === todo._id ? res.data.todo : t)));
      }
    } catch (err) {
      console.error('Toggle todo error:', err);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setAdding(true);
    try {
      const res = await todosApi.create({ text: newTodo, priority: newPriority, category: newCategory });
      if (res.data.success) {
        setTodos((prev) => [res.data.todo, ...prev]);
        setNewTodo('');
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Add todo error:', err);
    } finally {
      setAdding(false);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await todosApi.delete(id);
      setTodos((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error('Delete todo error:', err);
    }
  };

  const clearCompleted = async () => {
    try {
      await todosApi.clearCompleted();
      setTodos((prev) => prev.filter((t) => !t.completed));
    } catch (err) {
      console.error('Clear completed error:', err);
    }
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood.icon);
    setMoodMessage(MOOD_MESSAGES[mood.icon]);
    if (onSendToChat) {
      onSendToChat(`I'm feeling ${mood.label.toLowerCase()} today (${mood.icon}). Can you check in with me and help me make the most of my day?`);
    }
  };

  const sendDailySummaryToChat = () => {
    if (!onSendToChat || !summary) return;
    const todoPart = summary.topTodos.length > 0
      ? ` My top tasks are: ${summary.topTodos.map((t) => t.text).join(', ')}.`
      : '';
    onSendToChat(`Good morning! Please give me my daily summary and help me plan my day.${todoPart}`);
  };

  const hour = new Date().getHours();
  const TimeIcon = hour < 12 ? Sun : hour < 18 ? Sunset : Moon;
  const timeLabel = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';

  const pending = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
            <TimeIcon size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white truncate">Good {timeLabel}, {user?.displayName?.split(' ')[0]}!</p>
            {summary && <p className="text-[11px] text-slate-400">{pending.length} pending · {summary.completedToday} done today</p>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          {[
            { id: 'summary', label: 'Summary', icon: Sparkles },
            { id: 'todos', label: `Tasks (${pending.length})`, icon: ListTodo },
            { id: 'mood', label: 'Mood', icon: Heart },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                tab === id
                  ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-white border border-pink-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={11} />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <AnimatePresence mode="wait">
          {/* ─── SUMMARY TAB ─── */}
          {tab === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {summary ? (
                <>
                  <div className="p-3 rounded-2xl border border-pink-500/20 bg-pink-500/5">
                    <p className="text-sm font-bold text-white mb-1">{summary.greeting}</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{summary.message}</p>
                  </div>

                  {summary.topTodos.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Top Tasks</p>
                      <div className="space-y-1.5">
                        {summary.topTodos.map((t) => (
                          <div key={t._id} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-base flex-shrink-0">{CATEGORY_EMOJI[t.category] || '📝'}</span>
                            <span className="text-xs text-slate-200 flex-1 truncate">{t.text}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${PRIORITY_COLORS[t.priority]}`}>
                              {t.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={sendDailySummaryToChat}
                    className="w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md"
                    style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
                  >
                    <Sparkles size={13} />
                    Ask AI for Daily Plan
                  </button>
                </>
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm">Loading summary…</div>
              )}
            </motion.div>
          )}

          {/* ─── TODOS TAB ─── */}
          {tab === 'todos' && (
            <motion.div
              key="todos"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-2"
            >
              {/* Add button */}
              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-pink-500/30 text-pink-300 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-pink-500/10 transition-all"
              >
                <Plus size={14} /> New Task
              </button>

              {/* Add form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.form
                    onSubmit={addTodo}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <input
                        type="text"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        placeholder="What do you need to do?"
                        autoFocus
                        className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-pink-400/50"
                      />
                      <div className="flex gap-2">
                        <select
                          value={newPriority}
                          onChange={(e) => setNewPriority(e.target.value)}
                          className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none"
                        >
                          <option value="high">🔴 High</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="low">🟢 Low</option>
                        </select>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none"
                        >
                          <option value="general">📝 General</option>
                          <option value="routine">⏰ Routine</option>
                          <option value="study">📚 Study</option>
                          <option value="work">💼 Work</option>
                          <option value="wellness">🌿 Wellness</option>
                          <option value="reminder">🔔 Reminder</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={adding || !newTodo.trim()}
                          className="flex-1 py-1.5 rounded-lg text-white text-xs font-bold disabled:opacity-50 transition-all"
                          style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
                        >
                          {adding ? 'Adding…' : 'Add Task'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Pending todos */}
              {pending.length > 0 && (
                <div className="space-y-1.5">
                  {pending.map((todo) => (
                    <motion.div
                      key={todo._id}
                      layout
                      className="group flex items-start gap-2.5 p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-all"
                    >
                      <button onClick={() => toggleTodo(todo)} className="flex-shrink-0 mt-0.5">
                        <Circle size={16} className="text-slate-500 hover:text-pink-400 transition-colors" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-200 leading-snug">{todo.text}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px]">{CATEGORY_EMOJI[todo.category]}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${PRIORITY_COLORS[todo.priority]}`}>
                            {todo.priority}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTodo(todo._id)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Completed todos */}
              {completed.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Completed ({completed.length})
                    </p>
                    <button onClick={clearCompleted} className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors">
                      <RotateCcw size={10} /> Clear
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {completed.map((todo) => (
                      <div key={todo._id} className="flex items-center gap-2.5 p-2 rounded-xl opacity-50">
                        <button onClick={() => toggleTodo(todo)} className="flex-shrink-0">
                          <CheckCircle2 size={16} className="text-emerald-400" />
                        </button>
                        <p className="text-xs text-slate-400 line-through truncate">{todo.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {todos.length === 0 && !loading && (
                <div className="text-center py-8 text-slate-500">
                  <ListTodo size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No tasks yet. Add one above!</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── MOOD TAB ─── */}
          {tab === 'mood' && (
            <motion.div
              key="mood"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <p className="text-xs text-slate-400 text-center">How are you feeling right now?</p>
              <div className="grid grid-cols-2 gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood.icon}
                    onClick={() => handleMoodSelect(mood)}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${
                      selectedMood === mood.icon
                        ? 'border-pink-400/50 bg-pink-500/15 shadow-lg shadow-pink-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl">{mood.icon}</span>
                    <span className={`text-[11px] font-bold ${mood.color}`}>{mood.label}</span>
                  </button>
                ))}
              </div>

              {selectedMood && moodMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20"
                >
                  <p className="text-xs text-purple-200 leading-relaxed">{moodMessage}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">💬 Check-in sent to your AI assistant!</p>
                </motion.div>
              )}

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs font-bold text-white mb-1">Helpful Prompts</p>
                <div className="space-y-1.5">
                  {[
                    'I need help planning my day',
                    'Give me a motivational message',
                    'Help me prioritize my tasks',
                    'I need to take a break — suggest something relaxing',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => onSendToChat?.(prompt)}
                      className="w-full text-left text-[11px] text-slate-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/10 transition-all"
                    >
                      → {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
