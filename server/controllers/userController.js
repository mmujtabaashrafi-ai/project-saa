const User = require('../models/User');

// ─── GET /api/users ──────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = { _id: { $ne: req.user._id }, isActive: true };

    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('username displayName avatar isOnline lastSeen bio role')
      .sort({ displayName: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ success: true, users });
  } catch (err) {
    console.error('[UserController.getUsers]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// ─── GET /api/users/:id ──────────────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'username displayName avatar isOnline lastSeen bio role createdAt'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('[UserController.getUserById]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

// ─── PATCH /api/users/:id ─────────────────────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const targetId = req.params.id;

    // Users can only update themselves (admins can update anyone)
    if (req.user.role !== 'admin' && req.user._id.toString() !== targetId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
    }

    // Fields users can update
    const allowedFields = ['displayName', 'bio', 'avatar'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updatedUser = await User.findByIdAndUpdate(targetId, updates, {
      new: true,
      runValidators: true,
    }).select('username displayName avatar bio isOnline lastSeen role');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('[UserController.updateUser]', err);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

module.exports = { getUsers, getUserById, updateUser };
