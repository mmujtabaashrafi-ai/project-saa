# 🚢 REACT BOAT — Full-Stack MERN AI Chat Application

> **Connect. Communicate. Think.**
> A production-quality real-time messaging application inspired by WhatsApp and Instagram, equipped with an integrated AI chatbot, session limiting (MAX 5 active users), and a dedicated administrative console.

---

## 📁 Project Structure

```text
react-boat/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ConversationPanel.jsx   # Message view, real-time typing, send bar
│   │   │   ├── MessageBubble.jsx       # Bubble with sent/delivered/read status
│   │   │   ├── ProfileModal.jsx        # User profile & Saba's special cards & quotes
│   │   │   ├── ReactBoatChat.jsx       # Dedicated AI assistant chat interface
│   │   │   ├── Sidebar.jsx             # User search, conversation list, status
│   │   │   ├── TypingIndicator.jsx     # Animated typing indicator
│   │   │   └── UserAvatar.jsx          # Illustrated avatars with online status
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # User state, JWT storage, login/logout
│   │   │   ├── SocketContext.jsx       # Authenticated Socket.IO connection
│   │   │   └── ThemeContext.jsx        # Glassmorphism Dark / Light mode toggle
│   │   ├── pages/
│   │   │   ├── AdminPage.jsx           # Administrative management dashboard
│   │   │   ├── ChatPage.jsx            # Main responsive messaging view
│   │   │   ├── LoginPage.jsx           # Secure login (no registration)
│   │   │   └── NotFoundPage.jsx        # 404 page
│   │   ├── services/
│   │   │   └── api.js                  # Centralized Axios API client
│   │   ├── App.jsx                     # Route definitions & guards
│   │   ├── index.css                   # Tailwind + Custom Design System
│   │   └── main.jsx
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── db.js                       # MongoDB connection & reconnect logic
│   ├── controllers/
│   │   ├── adminController.js          # User status, sessions, logout-all, stats
│   │   ├── authController.js           # 5-active-session login, JWT, cookies
│   │   ├── conversationController.js   # Direct conversation management
│   │   ├── messageController.js        # Message history, read receipts
│   │   ├── reactBoatController.js      # AI chat, history persistence
│   │   └── userController.js           # Search & profile updates
│   ├── middleware/
│   │   ├── adminOnly.js                # Server-side DB role validation
│   │   ├── auth.js                     # JWT auth & active session check
│   │   └── rateLimiter.js              # IP rate limiting
│   ├── models/
│   │   ├── ChatbotConversation.js      # AI conversation history
│   │   ├── Conversation.js             # Direct chat conversations
│   │   ├── Message.js                  # Chat messages with status tracking
│   │   ├── Notification.js             # Notification records
│   │   ├── Session.js                  # Active user sessions (TTL index)
│   │   └── User.js                     # Predefined accounts (bcrypt hashed)
│   ├── routes/
│   │   ├── admin.js                    # Admin routes
│   │   ├── auth.js                     # Login & Logout routes
│   │   ├── conversations.js            # Conversation endpoints
│   │   ├── messages.js                 # Message endpoints
│   │   ├── reactBoat.js                # AI endpoints
│   │   └── users.js                    # User directory & search
│   ├── seed/
│   │   └── seedUsers.js                # 22 predefined accounts seeder
│   ├── services/
│   │   └── reactBoatService.js         # LLM Provider Abstraction Layer
│   ├── sockets/
│   │   └── socketHandler.js            # Authenticated Socket.IO events
│   ├── package.json
│   └── server.js                       # Express server entry point
│
├── .env.example
├── package.json
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18+ installed
- **MongoDB**: Local MongoDB instance running on `localhost:27017` OR a MongoDB Atlas cluster URI.

### 2. Environment Setup
Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```

Ensure `MONGODB_URI` points to your database:
```env
MONGODB_URI=mongodb://localhost:27017/react-boat
```

### 3. Install Dependencies
```bash
# From the root directory:
npm install

# Or install in server and client separately:
cd server && npm install
cd ../client && npm install
```

### 4. Seed the 22 Predefined Accounts
```bash
cd server
npm run seed
```

This will automatically create the core accounts with bcrypt-hashed passwords (salt rounds = 12).

### 5. Start Development Servers
From root directory:
```bash
npm run dev
```
Or separately:
- **Backend**: `cd server && npm run dev` (Runs on `http://localhost:5000`)
- **Frontend**: `cd client && npm run dev` (Runs on `http://localhost:5173`)

---

## 👥 Authentic Core Accounts

### 👑 Admin Account
- **Username**: `mohammed.mujtaba` (aliases: `mujtaba`)
- **Display Name**: `Mohammed Mujtaba`
- **Password**: `MUJTABA.26`
- **Role**: `admin` (Full dashboard access, session control, user activation/deactivation)

### 🌸 Saba Account
- **Username**: `saba` (alias: `saba.the.purest.women`)
- **Display Name**: `Saba`
- **Password**: `saba.26`
- **Role**: `user` (Dignified profile with modest quotes and illustrated avatar)

---

## 🔒 5-Active-Session Limit

The backend enforces a strict concurrency rule:
```js
MAX_ACTIVE_USERS = 5;
```
- Only **5 simultaneous user sessions** can be active in the system at once.
- When 5 active sessions exist, any additional login attempt returns:
  `All 5 active spaces are currently occupied.` (HTTP 403)
- When a user logs out or the admin terminates a session from the Admin Dashboard, the slot is immediately freed.

---

## 🤖 React Boat AI Service Architecture

The AI layer in `server/services/reactBoatService.js` provides an LLM abstraction layer:

```text
React Client
    ↓
Express API (/api/react-boat/chat)
    ↓
ReactBoatService (generateResponse)
    ↓
Configured LLM Provider (OpenAI / Gemini / Anthropic / Smart Fallback)
```

- **Zero Client Leakage**: AI API keys are **never** exposed to the React frontend.
- **Provider Switch**: Configure `AI_PROVIDER=openai|gemini|anthropic|fallback` in `server/.env`.
- Built-in intelligent programming assistant covers Java, Python, DSA, AI/ML, and system architecture out of the box even without external API keys.

---

## 🛡️ Security Features
- **Bcrypt Hashing**: Password hashes are calculated with 12 salt rounds; plaintext passwords never persist in the DB.
- **JWT Authentication**: Validated on every HTTP request and Socket.IO handshake.
- **Role Isolation**: Admin endpoints are verified against database records on every request, completely ignoring client claims.
- **Rate Limiting**: Custom limiters for general API calls, authentication, and AI interaction.
- **HTTP Security**: Protected by Helmet headers and strict CORS origin validation.
