const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

/**
 * Authenticate request via JWT (Bearer token in header OR http-only cookie).
 * Attaches req.user (full DB user object, role from DB — never trusted from client).
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    // 2. Fallback: http-only cookie
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Validate session still exists in DB
    const session = await Session.findOne({
      sessionId: decoded.sessionId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({ success: false, message: 'Session expired or revoked' });
    }

    // Fetch user from DB (role always comes from DB, never the token payload)
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }

    // Update session activity
    session.lastActivity = new Date();
    await session.save();

    req.user = user;
    req.sessionId = decoded.sessionId;
    next();
  } catch (err) {
    console.error('[Auth Middleware]', err.message);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

module.exports = { authenticate };
