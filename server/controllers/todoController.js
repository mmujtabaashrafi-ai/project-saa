'use strict';

const Todo = require('../models/Todo');

// ─── GET /api/todos ──────────────────────────────────────────────────────────
const getTodos = async (req, res) => {
  try {
    const { completed, category } = req.query;
    const filter = { userId: req.user._id };
    if (completed !== undefined) filter.completed = completed === 'true';
    if (category) filter.category = category;

    const todos = await Todo.find(filter).sort({ completed: 1, priority: -1, createdAt: -1 }).lean();
    res.json({ success: true, todos });
  } catch (err) {
    console.error('[TodoController.getTodos]', err);
    res.status(500).json({ success: false, message: 'Failed to load todos' });
  }
};

// ─── POST /api/todos ─────────────────────────────────────────────────────────
const createTodo = async (req, res) => {
  try {
    const { text, category = 'general', priority = 'medium', dueDate } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Todo text is required' });
    }

    const todo = await Todo.create({
      userId: req.user._id,
      text: text.trim(),
      category,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    res.status(201).json({ success: true, todo });
  } catch (err) {
    console.error('[TodoController.createTodo]', err);
    res.status(500).json({ success: false, message: 'Failed to create todo' });
  }
};

// ─── PATCH /api/todos/:id ────────────────────────────────────────────────────
const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed, category, priority, dueDate } = req.body;

    const todo = await Todo.findOne({ _id: id, userId: req.user._id });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    if (text !== undefined) todo.text = text.trim();
    if (completed !== undefined) todo.completed = completed;
    if (category !== undefined) todo.category = category;
    if (priority !== undefined) todo.priority = priority;
    if (dueDate !== undefined) todo.dueDate = dueDate ? new Date(dueDate) : null;

    await todo.save();
    res.json({ success: true, todo });
  } catch (err) {
    console.error('[TodoController.updateTodo]', err);
    res.status(500).json({ success: false, message: 'Failed to update todo' });
  }
};

// ─── DELETE /api/todos/:id ───────────────────────────────────────────────────
const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    await Todo.findOneAndDelete({ _id: id, userId: req.user._id });
    res.json({ success: true, message: 'Todo deleted' });
  } catch (err) {
    console.error('[TodoController.deleteTodo]', err);
    res.status(500).json({ success: false, message: 'Failed to delete todo' });
  }
};

// ─── DELETE /api/todos/completed ─────────────────────────────────────────────
const clearCompleted = async (req, res) => {
  try {
    const result = await Todo.deleteMany({ userId: req.user._id, completed: true });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error('[TodoController.clearCompleted]', err);
    res.status(500).json({ success: false, message: 'Failed to clear completed todos' });
  }
};

// ─── GET /api/todos/daily-summary ────────────────────────────────────────────
const getDailySummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 86400000);
    const hour = now.getHours();

    const [pending, completedToday, overdueCount] = await Promise.all([
      Todo.find({ userId, completed: false }).sort({ priority: -1 }).limit(5).lean(),
      Todo.countDocuments({ userId, completed: true, updatedAt: { $gte: today, $lt: tomorrow } }),
      Todo.countDocuments({ userId, completed: false, dueDate: { $lt: today } }),
    ]);

    // Greeting based on time of day
    let greeting = 'Hello';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    else if (hour < 21) greeting = 'Good evening';
    else greeting = 'Good night';

    const displayName = req.user.displayName || req.user.username;

    res.json({
      success: true,
      summary: {
        greeting: `${greeting}, ${displayName}! ✨`,
        pendingCount: pending.length,
        completedToday,
        overdueCount,
        topTodos: pending.slice(0, 3),
        message: buildDailyMessage(pending, completedToday, overdueCount, hour, displayName),
      },
    });
  } catch (err) {
    console.error('[TodoController.getDailySummary]', err);
    res.status(500).json({ success: false, message: 'Failed to get daily summary' });
  }
};

function buildDailyMessage(pending, completed, overdue, hour, name) {
  const parts = [];
  if (hour < 12) {
    parts.push(`Rise and shine, ${name}! 🌸 Here's what awaits you today.`);
  } else if (hour < 17) {
    parts.push(`Hope your day is going well, ${name}! Here's your current status.`);
  } else {
    parts.push(`Evening check-in, ${name}! Let's see how your day went.`);
  }

  if (completed > 0) parts.push(`✅ You've already completed **${completed} task${completed > 1 ? 's' : ''}** today — great work!`);
  if (overdue > 0) parts.push(`⚠️ You have **${overdue} overdue task${overdue > 1 ? 's' : ''}** that need attention.`);
  if (pending.length === 0) parts.push(`🎉 Your task list is clear — enjoy the peace of mind!`);
  else parts.push(`📋 **${pending.length} task${pending.length > 1 ? 's' : ''}** pending. You've got this!`);

  return parts.join(' ');
}

module.exports = { getTodos, createTodo, updateTodo, deleteTodo, clearCompleted, getDailySummary };
