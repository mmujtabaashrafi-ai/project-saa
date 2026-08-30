/**
 * Seed & Auto-Init Script — Saba's World
 * Creates core authentic users (Admin & Saba) and seeds curated AI knowledge base.
 * Removes fictional placeholder accounts (user03–user22) and dummy demo media.
 *
 * Idempotent: safe to run multiple times without duplicating.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const AIKnowledge = require('../models/AIKnowledge');
const { DEFAULT_KNOWLEDGE_BASE } = require('../services/knowledgeService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/react-boat';
const SALT_ROUNDS = 12;

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'MUJTABA.26';
const SABA_PASSWORD = process.env.SEED_SABA_PASSWORD || 'saba.26';

const coreUsersData = [
  // Admin
  {
    username: 'mohammed.mujtaba',
    displayName: 'Mohammed Mujtaba',
    password: ADMIN_PASSWORD,
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammed%20Mujtaba',
    bio: "Saba's World Administrator & Lead Architect — Building connections & intelligent platforms.",
  },
  // Saba
  {
    username: 'saba',
    displayName: 'Saba',
    password: SABA_PASSWORD,
    role: 'user',
    avatar: '/saba_bg.jpg',
    bio: '"True beauty is reflected in character, kindness, and dignity."',
  },
];

/**
 * Ensures core users and curated knowledge exist in the database.
 * Also purges fictional dummy placeholder accounts (user03–user22).
 */
async function ensureCoreUsersAndData() {
  try {
    // 1. Purge fictional dummy users (user03..user22) if present
    await User.deleteMany({ username: { $regex: /^user\d+$/i } });

    // 2. Ensure core accounts exist with valid password hashes
    for (const u of coreUsersData) {
      const { password, ...rest } = u;
      const existing = await User.findOne({
        $or: [{ username: u.username }, ...(u.username === 'saba' ? [{ username: 'saba.the.purest.women' }] : [])],
      });

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      if (!existing) {
        await User.create({ ...rest, passwordHash });
      } else {
        await User.updateOne(
          { _id: existing._id },
          {
            $set: {
              username: u.username,
              displayName: u.displayName,
              role: u.role,
              avatar: rest.avatar,
              bio: rest.bio,
              passwordHash,
              isActive: true,
            },
          }
        );
      }
    }

    // 3. Ensure Curated AI Knowledge Base exists
    for (const k of DEFAULT_KNOWLEDGE_BASE) {
      const exists = await AIKnowledge.findOne({ title: k.title });
      if (!exists) {
        await AIKnowledge.create({
          ...k,
          priority: 10,
          enabled: true,
          source: 'curated_system',
        });
      }
    }

    console.log("✅ Core users & AI knowledge verified in database.");
  } catch (err) {
    console.error('⚠️  Failed during ensureCoreUsersAndData:', err.message);
  }
}

async function seed() {
  console.log('\n✨ Saba’s World — Database Seeder');
  console.log('===================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected to MongoDB: ${MONGODB_URI}\n`);

  await ensureCoreUsersAndData();

  console.log('===================================');
  console.log('✨ Seeding completed successfully!\n');
  await mongoose.disconnect();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('❌ Seeder failed:', err);
    process.exit(1);
  });
}

module.exports = { ensureCoreUsersAndData, coreUsersData };
