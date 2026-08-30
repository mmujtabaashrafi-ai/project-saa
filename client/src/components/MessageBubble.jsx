import React, { useState } from 'react';
import { Check, CheckCheck, Clock, Trash2, Pencil, X, Check as CheckIcon } from 'lucide-react';
import { format } from 'date-fns';
import { messagesApi } from '../services/api';

const StatusIcon = ({ status }) => {
  if (status === 'read') return <CheckCheck size={13} className="text-blue-300" />;
  if (status === 'delivered') return <CheckCheck size={13} className="text-white/50" />;
  if (status === 'sent') return <Check size={13} className="text-white/50" />;
  return <Clock size={13} className="text-white/40" />;
};

export default function MessageBubble({ message, isOwn, showAvatar }) {
  const [deleting, setDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(message.isDeleted || false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [currentText, setCurrentText] = useState(message.text);
  const [isEdited, setIsEdited] = useState(message.isEdited || false);
  const [saving, setSaving] = useState(false);

  const timeStr = message.createdAt
    ? format(new Date(message.createdAt), 'HH:mm')
    : '';

  const handleDelete = async () => {
    if (!window.confirm('Delete this message?')) return;
    setDeleting(true);
    try {
      await messagesApi.delete(message._id);
      setIsDeleted(true);
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Failed to delete message. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText === currentText) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await messagesApi.edit(message._id, editText.trim());
      setCurrentText(editText.trim());
      setIsEdited(true);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to edit message:', err);
      alert('Failed to edit message. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(currentText);
    setIsEditing(false);
  };

  return (
    <div className={`flex items-end gap-2 mb-1 message-appear ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-6 flex-shrink-0" />
      <div className="max-w-[72%] sm:max-w-[60%] group relative">
        <div
          className={`px-4 py-2.5 ${isOwn ? 'bubble-sent' : 'bubble-received'}`}
          style={{ wordBreak: 'break-word' }}
        >
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="text-sm bg-white/10 rounded p-2 outline-none resize-none w-full text-white"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button onClick={handleCancelEdit} className="p-1 rounded bg-white/10 hover:bg-white/20">
                  <X size={14} />
                </button>
                <button onClick={handleSaveEdit} disabled={saving} className="p-1 rounded bg-green-500/80 hover:bg-green-500">
                  <CheckIcon size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
              {isDeleted ? (
                <span className="italic opacity-60">This message was deleted</span>
              ) : (
                <>
                  {currentText}
                  {isEdited && <span className="text-[10px] opacity-50 ml-1">(edited)</span>}
                </>
              )}
            </p>
          )}
        </div>

        {isOwn && !isDeleted && !isEditing && (
          <div className="absolute -top-2 -left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 shadow-md"
              aria-label="Edit message"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md"
              aria-label="Delete message"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}

        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeStr}</span>
          {isOwn && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}
