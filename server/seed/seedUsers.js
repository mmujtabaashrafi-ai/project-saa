/**
 * Comprehensive Seed Script — Saba's World
 * Creates predefined users, seeds curated AI knowledge base,
 * and populates initial social media demo content.
 *
 * Idempotent: safe to run multiple times without duplicating.
 * Run: npm run seed (from /server directory)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const AIKnowledge = require('../models/AIKnowledge');
const Post = require('../models/Post');
const Story = require('../models/Story');
const Reel = require('../models/Reel');
const { DEFAULT_KNOWLEDGE_BASE } = require('../services/knowledgeService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/react-boat';
const SALT_ROUNDS = 12;

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'MUJTABA.26';
const SABA_PASSWORD = process.env.SEED_SABA_PASSWORD || 'saba.26';
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_USER_PASSWORD || 'ReactBoat@2024';

const avatarBase = (seed, style = 'avataaars') =>
  `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

const usersData = [
  // Admin
  {
    username: 'mohammed.mujtaba',
    displayName: 'Mohammed Mujtaba',
    password: ADMIN_PASSWORD,
    role: 'admin',
    avatar: avatarBase('Mohammed Mujtaba', 'avataaars'),
    bio: "Saba's World Administrator & Lead Architect — Building connections & intelligent platforms.",
  },
  // Saba (username: saba)
  {
    username: 'saba',
    displayName: 'Saba',
    password: SABA_PASSWORD,
    role: 'user',
    avatar: '/saba_bg.jpg',
    bio: '"True beauty is reflected in character, kindness, and dignity."',
  },
  // Saba legacy alias
  {
    username: 'saba.the.purest.women',
    displayName: 'Saba the Purest Women',
    password: SABA_PASSWORD,
    role: 'user',
    avatar: '/saba_bg.jpg',
    bio: '"True beauty is reflected in character, kindness, and dignity."',
  },
  // Users 03–22
  ...Array.from({ length: 20 }, (_, i) => {
    const num = String(i + 3).padStart(2, '0');
    return {
      username: `user${num}`,
      displayName: `User ${num}`,
      password: DEFAULT_PASSWORD,
      role: 'user',
      avatar: avatarBase(`User${num}`, 'avataaars'),
      bio: `Hello! I'm User ${num} on Saba's World. Exploring AI, coding & social connections.`,
    };
  }),
];

async function seed() {
  console.log('\n✨ Saba’s World — Full Database Seeder');
  console.log('====================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected to MongoDB: ${MONGODB_URI}\n`);

  // 1. Seed Users
  console.log('👤 Seeding Users...');
  let usersCreated = 0;
  let usersUpdated = 0;
  for (const u of usersData) {
    const { password, ...rest } = u;
    const exists = await User.findOne({ username: u.username });
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    if (!exists) {
      await User.create({ ...rest, passwordHash });
      usersCreated++;
    } else {
      // Update password and avatar
      await User.updateOne({ username: u.username }, { $set: { passwordHash, avatar: rest.avatar } });
      usersUpdated++;
    }
  }
  console.log(`   Users: ${usersCreated} created, ${usersUpdated} updated (total ${usersData.length})\n`);

  // 2. Seed AI Knowledge
  console.log('🧠 Seeding Curated AI Knowledge Base...');
  let knowledgeCreated = 0;
  for (const k of DEFAULT_KNOWLEDGE_BASE) {
    const exists = await AIKnowledge.findOne({ title: k.title });
    if (!exists) {
      await AIKnowledge.create({
        ...k,
        priority: 10,
        enabled: true,
        source: 'curated_system',
      });
      knowledgeCreated++;
    }
  }
  console.log(`   Knowledge items: ${knowledgeCreated} created (total ${DEFAULT_KNOWLEDGE_BASE.length})\n`);

  // 3. Seed Initial Demo Social Content if none exists
  const adminUser = await User.findOne({ username: 'mohammed.mujtaba' });
  const sabaUser = await User.findOne({ username: 'saba.the.purest.women' });
  const user03 = await User.findOne({ username: 'user03' });

  const existingPosts = await Post.countDocuments();
  if (existingPosts === 0 && adminUser && sabaUser) {
    console.log('📸 Seeding Demo Social Posts...');
    await Post.create([
      {
        author: adminUser._id,
        caption: "Welcome everyone to Saba's World! 🚀 Where real-time chat, open social sharing, and personal AI intelligence converge. #SabasWorld #AI #Technology #Welcome",
        mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        mediaType: 'image',
        tags: ['sabasworld', 'ai', 'technology', 'welcome'],
        likesCount: 12,
        commentsCount: 2,
      },
      {
        author: sabaUser._id,
        caption: "“True beauty is reflected in character, kindness, and dignity.” Wishing everyone a blessed and peaceful day filled with positive learning. ✨ #Wisdom #Character #Kindness #Peace",
        mediaUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
        mediaType: 'image',
        tags: ['wisdom', 'character', 'kindness', 'peace'],
        likesCount: 28,
        commentsCount: 5,
      },
      {
        author: user03?._id || adminUser._id,
        caption: "Building full-stack MERN with WebRTC audio/video and RAG AI assistants! The modern web development stack is incredible. 💻 #Coding #MERN #WebDev #React",
        mediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        mediaType: 'image',
        tags: ['coding', 'mern', 'webdev', 'react'],
        likesCount: 15,
        commentsCount: 3,
      },
    ]);
    console.log('   Demo posts created.\n');
  }

  // 4. Seed Demo Stories
  const existingStories = await Story.countDocuments();
  if (existingStories === 0 && adminUser && sabaUser) {
    console.log('📖 Seeding Demo Stories (24-hour expiration)...');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await Story.create([
      {
        author: sabaUser._id,
        mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        mediaType: 'image',
        caption: 'Morning serenity and calm reflections ✨',
        expiresAt,
      },
      {
        author: adminUser._id,
        mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
        mediaType: 'image',
        caption: 'Saba’s World 2.0 Launch Day! 🚀',
        expiresAt,
      },
    ]);
    console.log('   Demo stories created.\n');
  }

  // 5. Seed Demo Reels
  const existingReels = await Reel.countDocuments();
  if (existingReels === 0 && adminUser && sabaUser) {
    console.log('🎬 Seeding Demo Reels...');
    await Reel.create([
      {
        author: adminUser._id,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
        caption: 'AI-assisted coding and architectural innovation at speed! ⚡ #Innovation #AI #Tech',
        audioTitle: 'Original Audio · Saba’s World Future',
        tags: ['innovation', 'ai', 'tech'],
        likesCount: 45,
        commentsCount: 7,
        viewsCount: 320,
      },
      {
        author: sabaUser._id,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
        caption: 'Peaceful landscapes and moments of quiet contemplation. 🌿 #Nature #Serenity #Peace',
        audioTitle: 'Gentle Waves · Pure Reflection',
        tags: ['nature', 'serenity', 'peace'],
        likesCount: 82,
        commentsCount: 14,
        viewsCount: 650,
      },
    ]);
    console.log('   Demo reels created.\n');
  }

  console.log('====================================');
  console.log('✨ All Seeding completed successfully!\n');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});
