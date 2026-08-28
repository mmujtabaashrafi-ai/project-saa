const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Session = require('../models/Session');

const MAX_ACTIVE_USERS = parseInt(process.env.MAX_ACTIVE_USERS) || 5;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/** Helper: count currently active (non-expired) sessions */
const countActiveSessions = async () => {
  return Session.countDocuments({
    isActive: true,
    expiresAt: { $gt: new Date() },
  });
};

/** Helper: generate expiry date from JWT duration string */
const parseExpiry = (duration) => {
  const units = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  const match = duration.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 7 * 86400000);
  return new Date(Date.now() + parseInt(match[1]) * units[match[2]]);
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const loginIdentifier = username.toLowerCase().trim();

    // Find user with passwordHash (support username, legacy username, or admin email)
    const user = await User.findOne({
      $or: [
        { username: loginIdentifier },
        ...( ['mmujtabaashrafi@gmail.com', 'mohammed.mujtaba', 'mujtaba'].includes(loginIdentifier)
          ? [{ username: 'mujtaba' }, { role: 'admin' }]
          : [] )
      ]
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password. Please try again.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid username or password. Please try again.' });
    }

    // ─── 5-Session Limit ────────────────────────────────────────────────
    // First: check if this user already has an active session (re-login)
    const existingSession = await Session.findOne({
      userId: user._id,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!existingSession) {
      // User doesn't have an active session → check global limit
      const activeCount = await countActiveSessions();
      if (activeCount >= MAX_ACTIVE_USERS) {
        return res.status(403).json({
          success: false,
          message: `All ${MAX_ACTIVE_USERS} active spaces are currently occupied. Please try again later.`,
          code: 'SESSION_LIMIT_REACHED',
        });
      }
    } else {
      // Invalidate old session before creating new one
      existingSession.isActive = false;
      await existingSession.save();
    }

    // Create new session
    const sessionId = uuidv4();
    const expiresAt = parseExpiry(JWT_EXPIRES_IN);

    await Session.create({
      userId: user._id,
      sessionId,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '',
      expiresAt,
      isActive: true,
    });

    // Mark user as online
    await User.findByIdAndUpdate(user._id, { isOnline: true, lastSeen: new Date() });

    // Sign JWT
    const token = jwt.sign(
      { userId: user._id, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set http-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: true,
      },
    });
  } catch (err) {
    console.error('[AuthController.login]', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const sessionId = req.sessionId;

    if (sessionId) {
      await Session.findOneAndUpdate({ sessionId }, { isActive: false });
    }

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        isOnline: false,
        lastSeen: new Date(),
        socketId: null,
      });
    }

    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('[AuthController.logout]', err);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    console.error('[AuthController.getMe]', err);
    res.status(500).json({ success: false, message: 'Failed to get user info' });
  }
};

module.exports = { login, logout, getMe };
