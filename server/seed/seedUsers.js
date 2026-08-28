/**
 * Seed Script — React Boat
 * Creates 22 predefined users with bcrypt-hashed passwords.
 * Idempotent: safe to run multiple times (no duplicates).
 *
 * Run: npm run seed (from /server directory)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/react-boat';
const SALT_ROUNDS = 12;

// ─── Seed User Definitions ──────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'mujjubhi143';
const SABA_PASSWORD = process.env.SEED_SABA_PASSWORD || 'sabathepurestlady';
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_USER_PASSWORD || 'ReactBoat@2024';

// Avatar URLs — using DiceBear Avatars (served from CDN, no signup needed)
const avatarBase = (seed, style = 'avataaars') =>
  `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

const users = [
  // ─── Admin ────────────────────────────────────────────────────────────
  {
    username: 'mohammed.mujtaba',
    displayName: 'Mohammed Mujtaba',
    password: ADMIN_PASSWORD,
    role: 'admin',
    avatar: avatarBase('Mohammed Mujtaba', 'avataaars'),
    bio: 'React Boat Administrator — Building connections one message at a time.',
  },

  // ─── Saba ─────────────────────────────────────────────────────────────
  {
    username: 'saba.the.purest.women',
    displayName: 'Saba the Purest Women',
    password: SABA_PASSWORD,
    role: 'user',
    avatar: avatarBase('Saba Hijabi', 'avataaars'),
    bio: '"True beauty is reflected in character, kindness, and dignity."',
  },

  // ─── Users 03–22 ──────────────────────────────────────────────────────
  ...Array.from({ length: 20 }, (_, i) => {
    const num = String(i + 3).padStart(2, '0');
    return {
      username: `user${num}`,
      displayName: `User ${num}`,
      password: DEFAULT_PASSWORD,
      role: 'user',
      avatar: avatarBase(`User${num}`, 'avataaars'),
      bio: `Hello! I'm User ${num} on React Boat.`,
    };
  }),
];

// ─── DB Schema (inline for seed script independence) ─────────────────────────
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: String,
  bio: String,
  isActive: { type: Boolean, default: true },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: null },
  socketId: { type: String, default: null },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// ─── Main Seed Function ───────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱 React Boat — Database Seeder');
  console.log('================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected to MongoDB: ${MONGODB_URI}\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const userData of users) {
    const { password, ...rest } = userData;

    try {
      const exists = await User.findOne({ username: userData.username });

      if (exists) {
        console.log(`   ⏭  Skipped  : ${userData.username} (already exists)`);
        skipped++;
        continue;
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      await User.create({
        ...rest,
        passwordHash,
      });

      const icon = userData.role === 'admin' ? '👑' : '👤';
      console.log(`   ✅ Created  : ${icon} ${userData.displayName} (@${userData.username})`);
      created++;
    } catch (err) {
      console.error(`   ❌ Error    : ${userData.username} — ${err.message}`);
      errors++;
    }
  }

  console.log('\n================================');
  console.log(`📊 Seed Summary:`);
  console.log(`   Created : ${created}`);
  console.log(`   Skipped : ${skipped} (already existed)`);
  console.log(`   Errors  : ${errors}`);
  console.log(`   Total   : ${users.length} accounts defined`);
  console.log('\n🚢 Seeding complete!\n');

  await mongoose.disconnect();
  process.exit(errors > 0 ? 1 : 0);
}

seed().catch((err) => {
  console.error('❌ Seed script failed:', err.message);
  process.exit(1);
});
