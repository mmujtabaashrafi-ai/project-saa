import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Activity, LogOut, Shield, Settings, MessageSquare,
  Trash2, RefreshCw, BarChart3, ChevronLeft, UserCheck, UserX,
  Clock, Server, Bot, Zap, Globe
} from 'lucide-react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';
import { formatDistanceToNow } from 'date-fns';

// ─── Stat Card ────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-5 rounded-2xl"
    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="p-2.5 rounded-xl" style={{ background: `${color}20` }}>
        <Icon size={20} style={{ color }} />
      </div>
    </div>
    <div className="text-3xl font-bold text-[var(--text-primary)]">{value ?? '—'}</div>
    <div className="text-sm text-[var(--text-muted)] mt-1">{label}</div>
    {sub && <div className="text-xs mt-1" style={{ color }}>{sub}</div>}
  </motion.div>
);

// ─── Tab button ───────────────────────────────────────────────────────────
const TabBtn = ({ label, icon: Icon, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
    }`}
    style={active ? { background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' } : {}}
  >
    <Icon size={15} />
    {label}
    {badge !== undefined && badge > 0 && (
      <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-500 text-white">{badge}</span>
    )}
  </button>
);

// ─── Main Admin Page ──────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, sessionsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getSessions(),
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users || []);
      setSessions(sessionsRes.data.sessions || []);
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleUser = async (userId, currentStatus) => {
    setActionLoading(userId);
    try {
      await adminApi.updateUserStatus(userId, !currentStatus);
      await load();
    } finally {
      setActionLoading('');
    }
  };

  const handleTerminateSession = async (sessionId) => {
    setActionLoading(sessionId);
    try {
      await adminApi.terminateSession(sessionId);
      await load();
    } finally {
      setActionLoading('');
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Terminate all sessions except yours?')) return;
    try {
      await adminApi.logoutAll();
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ─── Top Bar ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-[var(--border)] px-6 py-4 flex items-center justify-between"
        style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/chat')}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-yellow-400" />
            <span className="font-bold text-[var(--text-primary)]">Admin Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load}
            className={`p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw size={16} />
          </button>
          <UserAvatar user={user} size={32} showStatus isOnline />
          <button onClick={handleAdminLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* ─── Tabs ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-6 p-1.5 rounded-2xl"
          style={{ background: 'var(--bg-secondary)' }}>
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users, badge: users.filter(u => !u.isActive).length },
            { id: 'sessions', label: 'Sessions', icon: Activity, badge: sessions.length },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((t) => (
            <TabBtn
              key={t.id}
              label={t.label}
              icon={t.icon}
              active={tab === t.id}
              onClick={() => setTab(t.id)}
              badge={t.badge}
            />
          ))}
        </div>

        {/* ─── Overview Tab ──────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="#0ea5e9" />
                <StatCard icon={UserCheck} label="Active Users" value={stats?.activeUsers} color="#10b981" />
                <StatCard icon={Globe} label="Online Now" value={stats?.onlineUsers} color="#6366f1" />
                <StatCard
                  icon={Zap}
                  label="Active Sessions"
                  value={`${stats?.activeSessions ?? 0}/${stats?.maxSessions ?? 5}`}
                  color="#f59e0b"
                  sub={`${stats?.availableSlots ?? 5} slots free`}
                />
                <StatCard icon={MessageSquare} label="Total Messages" value={stats?.totalMessages} color="#8b5cf6" />
                <StatCard icon={Bot} label="Conversations" value={stats?.totalConversations} color="#ec4899" />
              </div>

              {/* Session limit bar */}
              <div className="p-5 rounded-2xl mb-6"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-[var(--text-primary)]">Session Slots</span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {stats?.activeSessions}/{stats?.maxSessions} used
                  </span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((stats?.activeSessions || 0) / (stats?.maxSessions || 5)) * 100}%`,
                      background: stats?.activeSessions >= stats?.maxSessions
                        ? '#ef4444'
                        : 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                    }}
                  />
                </div>
                {stats?.activeSessions >= stats?.maxSessions && (
                  <p className="text-xs text-red-400 mt-2">⚠️ All session slots occupied</p>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── Users Tab ──────────────────────────────────────────── */}
          {tab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">All Users ({users.length})</span>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {users.map((u) => (
                    <div key={u._id} className="flex items-center gap-4 px-5 py-4">
                      <UserAvatar user={u} size={40} showStatus isOnline={u.isOnline} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[var(--text-primary)] text-sm">{u.displayName}</span>
                          {u.role === 'admin' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400">admin</span>
                          )}
                          {!u.isActive && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">inactive</span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">@{u.username}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${u.isOnline ? 'text-green-400' : 'text-[var(--text-muted)]'}`}>
                          {u.isOnline ? '● Online' : u.lastSeen ? formatDistanceToNow(new Date(u.lastSeen), { addSuffix: true }) : 'Never'}
                        </span>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleUser(u._id, u.isActive)}
                            disabled={actionLoading === u._id}
                            className={`p-1.5 rounded-lg transition-colors text-xs ${
                              u.isActive
                                ? 'text-red-400 hover:bg-red-500/10'
                                : 'text-green-400 hover:bg-green-500/10'
                            }`}
                          >
                            {actionLoading === u._id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : u.isActive ? (
                              <UserX size={14} />
                            ) : (
                              <UserCheck size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Sessions Tab ────────────────────────────────────────── */}
          {tab === 'sessions' && (
            <motion.div key="sessions" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-[var(--text-primary)]">
                  Active Sessions ({sessions.length}/{stats?.maxSessions || 5})
                </span>
                <button onClick={handleLogoutAll}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors">
                  <LogOut size={14} />
                  Logout All
                </button>
              </div>
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <div className="text-center py-10 text-[var(--text-muted)]">No active sessions</div>
                ) : (
                  sessions.map((s) => (
                    <div key={s._id} className="flex items-center gap-4 p-4 rounded-2xl"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <UserAvatar user={s.userId} size={40} showStatus isOnline />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--text-primary)] text-sm">
                          {s.userId?.displayName}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          @{s.userId?.username} · Active {formatDistanceToNow(new Date(s.lastActivity || s.createdAt), { addSuffix: true })}
                        </div>
                        {s.ipAddress && (
                          <div className="text-xs text-[var(--text-muted)] mt-0.5">
                            IP: {s.ipAddress}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleTerminateSession(s._id)}
                        disabled={actionLoading === s._id}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                        {actionLoading === s._id ? (
                          <RefreshCw size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ─── Settings Tab ────────────────────────────────────────── */}
          {tab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="space-y-4">
                <div className="p-5 rounded-2xl"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Server size={18} className="text-[var(--accent)]" />
                    System Configuration
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                      <span className="text-[var(--text-muted)]">Max Active Sessions</span>
                      <span className="font-mono font-medium text-[var(--text-primary)]">{stats?.maxSessions || 5}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                      <span className="text-[var(--text-muted)]">Current Sessions</span>
                      <span className="font-mono font-medium text-[var(--text-primary)]">{stats?.activeSessions || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[var(--text-muted)]">Available Slots</span>
                      <span className="font-mono font-medium text-green-400">{stats?.availableSlots || 5}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Bot size={18} style={{ color: '#7c3aed' }} />
                    AI Configuration
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    AI provider is configured via <code className="px-1 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', fontSize: '12px' }}>AI_PROVIDER</code> environment variable on the server.
                    <br /><br />
                    Supported providers: <strong>openai</strong>, <strong>gemini</strong>, <strong>anthropic</strong>, <strong>fallback</strong>
                    <br /><br />
                    AI API keys are never exposed to the frontend.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-red-500/20"
                  style={{ background: 'rgba(239,68,68,0.05)' }}>
                  <h3 className="font-semibold text-red-400 mb-3">Danger Zone</h3>
                  <button onClick={handleLogoutAll}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white bg-red-500 hover:bg-red-600 transition-colors">
                    <LogOut size={15} />
                    Terminate All Sessions
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
