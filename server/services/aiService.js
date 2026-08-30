'use strict';

const AIMemory = require('../models/AIMemory');
const { retrieveKnowledge } = require('./knowledgeService');
const { findSabaResponse, SABA_QUOTES, WHO_IS_SABA_ANSWER } = require('../data/sabaKnowledge');
const { buildSystemPrompt, BASE_SYSTEM_PROMPT } = require('../config/systemPrompt');

// ─── Clean & Format Conversation History for Providers ──────────────────────
/**
 * Normalizes multi-turn message history into a strictly alternating sequence of user/assistant turns.
 * Guarantees provider compatibility (Anthropic, OpenAI, Gemini).
 */
const formatConversationHistory = (history = [], currentMessage = '') => {
  const normalized = [];

  for (const item of history) {
    if (!item) continue;
    const role = item.role === 'assistant' || item.role === 'model' ? 'assistant' : 'user';
    const content =
      typeof item.content === 'string'
        ? item.content.trim()
        : String(item.content || '').trim();

    if (!content) continue;

    // Merge consecutive identical roles to enforce strict turn alternation
    if (normalized.length > 0 && normalized[normalized.length - 1].role === role) {
      normalized[normalized.length - 1].content += `\n\n${content}`;
    } else {
      normalized.push({ role, content });
    }
  }

  // Ensure first message starts with 'user' role
  while (normalized.length > 0 && normalized[0].role !== 'user') {
    normalized.shift();
  }

  // Append current user message
  const trimmedCurr = (currentMessage || '').trim();
  if (trimmedCurr) {
    if (normalized.length > 0 && normalized[normalized.length - 1].role === 'user') {
      if (normalized[normalized.length - 1].content !== trimmedCurr) {
        normalized[normalized.length - 1].content += `\n\n${trimmedCurr}`;
      }
    } else {
      normalized.push({ role: 'user', content: trimmedCurr });
    }
  }

  return normalized;
};

// ─── Build Augmented Prompt with RAG & Memory ──────────────────────────────
const buildPromptContext = async (userId, userMessage, history = [], userName = null) => {
  // 1. Retrieve Knowledge
  const retrievedSnippets = await retrieveKnowledge(userMessage, null, 3);

  // 2. Retrieve User Memory
  let userMemories = [];
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1 && userId && mongoose.Types.ObjectId.isValid(userId)) {
      userMemories = await AIMemory.find({ userId }).sort({ updatedAt: -1 }).limit(20).lean();
    }
  } catch (err) {
    console.warn('[AIService] Memory lookup error:', err.message);
  }

  // 3. Retrieve pending todos for daily context
  let pendingTodos = [];
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1 && userId && mongoose.Types.ObjectId.isValid(userId)) {
      const Todo = require('../models/Todo');
      pendingTodos = await Todo.find({ userId, completed: false }).sort({ priority: -1 }).limit(5).lean();
    }
  } catch (err) {
    console.warn('[AIService] Todo lookup error:', err.message);
  }

  // 4. Construct System Context via centralized systemPrompt builder
  const augmentedSystemPrompt = buildSystemPrompt({
    userName,
    pendingTodos,
    retrievedSnippets,
    userMemories,
  });

  return {
    systemPrompt: augmentedSystemPrompt,
    retrievedSnippets,
    userMemories,
  };
};

// ─── Memory Extractor Heuristic ───────────────────────────────────────────
const extractAndSaveMemory = async (userId, userMessage) => {
  if (!userId || !userMessage) return 0;
  let count = 0;

  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(userId)) {
      return 0;
    }
    const text = userMessage.trim();
    const nameMatch = text.match(/my name is ([A-Za-z0-9_\s]{2,30})/i);
    const prefMatch = text.match(/i prefer (using|learning|working with|to study) ([A-Za-z0-9_\s#+.-]{2,40})/i);
    const learningMatch = text.match(/i am learning ([A-Za-z0-9_\s#+.-]{2,40})/i);
    const roleMatch = text.match(/i am a ([A-Za-z0-9_\s-]{2,40})/i);

    if (nameMatch) {
      await AIMemory.findOneAndUpdate(
        { userId, key: 'preferred_name' },
        { value: nameMatch[1].trim(), source: 'conversation' },
        { upsert: true, new: true }
      );
      count++;
    }
    if (prefMatch) {
      await AIMemory.findOneAndUpdate(
        { userId, key: `preference_${prefMatch[1].replace(/\s+/g, '_')}` },
        { value: prefMatch[2].trim(), source: 'conversation' },
        { upsert: true, new: true }
      );
      count++;
    }
    if (learningMatch) {
      await AIMemory.findOneAndUpdate(
        { userId, key: 'current_learning_topic' },
        { value: learningMatch[1].trim(), source: 'conversation' },
        { upsert: true, new: true }
      );
      count++;
    }
    if (roleMatch) {
      await AIMemory.findOneAndUpdate(
        { userId, key: 'user_profession' },
        { value: roleMatch[1].trim(), source: 'conversation' },
        { upsert: true, new: true }
      );
      count++;
    }
  } catch (err) {
    console.warn('[AIService] Failed to extract memory:', err.message);
  }

  return count;
};

// ─── Knowledge-Infused Fallback Engine ─────────────────────────────────────
const generateSmartFallback = (message, snippets = [], memories = []) => {
  const lower = (message || '').toLowerCase().trim();

  // 1. Direct Saba knowledge / quick prompt match
  const sabaDirectReply = findSabaResponse(message);
  if (sabaDirectReply) {
    return sabaDirectReply;
  }

  // 2. If direct knowledge snippet matches exist, synthesize a detailed response from them
  if (snippets.length > 0) {
    const topDoc = snippets[0];
    return `### 💡 ${topDoc.title}\n\n${topDoc.content}\n\n---\n*Generated by Saba's World AI Knowledge Engine. Ask me to dive deeper into any of these concepts!*`;
  }

  // 3. Common greetings
  if (/^(hi|hello|hey|salaam|assalam|greetings)/i.test(lower)) {
    return `Hello! ✨ I am **Saba's World AI**, your private personal assistant for thoughtful conversation, learning, and inspiration.

How can I assist you today?
- 🌸 **Saba's World**: Reflections on character, modesty, hijab, and grace
- ☕ **Programming**: Java, Python, C++, JavaScript & TypeScript
- 🧩 **DSA & CS**: Data structures, algorithms, DBMS, OS, Networks
- 🤖 **AI & ML**: Neural networks, LLMs, Transformers, RAG architecture
- 📖 **Inspiration & Quotes**: Uplifting thoughts for personal growth`;
  }

  // 4. Identity query
  if (lower.includes('who are you') || lower.includes('your name') || lower.includes('real saba')) {
    return `I am **Saba's World AI**, a private, respectful, and intelligent personal assistant dedicated to Saba's World.

I reflect the core values of dignity, character, modesty, and lifelong learning. I am here to help with your questions, studies, and thoughtful reflections.`;
  }

  // 5. Java queries
  if (lower.includes('java') || lower.includes('spring') || lower.includes('jvm')) {
    return `### ☕ Java & OOP Architecture

Java is a robust, object-oriented language running on the Java Virtual Machine (JVM).

**Key Pillars of OOP:**
1. **Encapsulation:** Protect data state with \`private\` fields and public getters/setters.
2. **Inheritance:** Reuse code with class extension (\`extends\`).
3. **Polymorphism:** Method overriding (runtime) & method overloading (compile-time).
4. **Abstraction:** Interfaces and \`abstract\` classes defining contracts.

**Example — Clean Java Record / Class:**
\`\`\`java
public record UserProfile(String id, String displayName, String role) {
    public void printWelcome() {
        System.out.println("Welcome to Saba's World, " + displayName + "!");
    }
}
\`\`\`

Would you like to explore Java Streams, Multithreading, or Spring Boot REST APIs? 🚀`;
  }

  // 6. DBMS queries
  if (lower.includes('dbms') || lower.includes('database') || lower.includes('sql') || lower.includes('nosql')) {
    return `### 🗄️ Database Management Systems (DBMS) in Simple Words

A **DBMS** is software that stores, manages, and retrieves data securely and efficiently.

**1. Relational (SQL) vs Non-Relational (NoSQL):**
- **SQL (PostgreSQL, MySQL):** Structured tables with rows & columns, strict schemas, strong relational joins.
- **NoSQL (MongoDB, Redis):** Flexible documents (JSON/BSON), key-value pairs, or graphs; designed for rapid scalability.

**2. The ACID Guarantees:**
- **A (Atomicity):** All parts of a transaction succeed, or none do ("all-or-nothing").
- **C (Consistency):** Data moves only between valid states conforming to constraints.
- **I (Isolation):** Concurrent transactions do not interfere with each other.
- **D (Durability):** Once committed, data is permanently saved even during power failure.

**3. Indexing & Performance:**
- **B-Trees & B+Trees** enable fast $O(\\log n)$ searches instead of costly full-table scans.

What specific database or query optimization would you like to explore?`;
  }

  // 7. Python queries
  if (lower.includes('python') || lower.includes('fastapi') || lower.includes('django')) {
    return `### 🐍 Python Mastery & Best Practices

Python excels in clean syntax, rapid prototyping, AI/ML, and web backend development.

**Python 3 Essentials:**
\`\`\`python
from typing import List, Dict

class KnowledgeAssistant:
    def __init__(self, name: str = "Saba's World AI"):
        self.name = name

    def summarize(self, topics: List[str]) -> Dict[str, str]:
        """Generate structured summaries using list/dict comprehensions."""
        return {topic: f"Key insights for {topic}" for topic in topics}

assistant = KnowledgeAssistant()
print(assistant.summarize(["DSA", "Machine Learning", "System Design"]))
\`\`\`

What specific Python topic or library are you working on?`;
  }

  // 8. DSA queries
  if (lower.includes('dsa') || lower.includes('binary tree') || lower.includes('graph') || lower.includes('algorithm') || lower.includes('sorting')) {
    return `### 🧩 Data Structures & Algorithms Roadmap

**Core Complexity Cheat Sheet:**
| Structure | Lookup | Insertion | Deletion | Space |
| :--- | :--- | :--- | :--- | :--- |
| **Array** | O(1) | O(n) | O(n) | O(n) |
| **Hash Map** | O(1) avg | O(1) avg | O(1) avg | O(n) |
| **Balanced BST** | O(log n) | O(log n) | O(log n) | O(n) |
| **Min/Max Heap** | O(1) top | O(log n) | O(log n) | O(n) |

**Key Algorithmic Patterns:**
- **Two Pointers & Sliding Window** for optimal string/array slices.
- **BFS & DFS** for shortest paths and cycle detection in graphs.
- **Dynamic Programming** with Memoization or Tabulation.

Share your specific problem or code snippet, and I'll help you optimize it step-by-step!`;
  }

  // 9. Operating Systems
  if (lower.includes('os') || lower.includes('operating system') || lower.includes('deadlock') || lower.includes('thread')) {
    return `### ⚙️ Operating Systems & System Architecture

**1. Processes vs. Threads:**
- **Process:** An executing program with its own dedicated address space (Heap, Stack, Data, Text).
- **Thread:** Lightweight unit of execution within a process; threads share process memory and resources.

**2. Deadlock Conditions (Coffman Conditions):**
1. **Mutual Exclusion:** Resources cannot be shared simultaneously.
2. **Hold and Wait:** Process holds at least one resource while waiting for others.
3. **No Preemption:** Resources can only be released voluntarily by the holding process.
4. **Circular Wait:** Closed chain of processes waiting on each other.

**3. Memory Management:**
- **Virtual Memory & Paging:** Maps logical memory to physical RAM frames; uses Page Tables and TLB (Translation Lookaside Buffer) for high-speed lookup.`;
  }

  // Default response
  return `### ✨ Saba's World AI Assistant

I'm currently in development mode, but I can still help with Saba's World, programming, learning and thoughtful conversations.

What would you like to explore today?
- **Saba's World & Wisdom**: Reflections on modesty, character, dignity, and grace
- **Programming**: Java, Python, C++, JavaScript & TypeScript
- **Computer Science**: DSA, DBMS, OS, Computer Networks, and AI
- **Daily Inspiration**: Uplifting messages on personal growth`;
};

// ─── OpenAI Provider (using native fetch) ──────────────────────────────────
const callOpenAI = async (systemPrompt, userMessage, history = []) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  // Full conversation history + system prompt
  const formattedHistory = formatConversationHistory(history, userMessage);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...formattedHistory,
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || null;
};

// ─── Gemini Provider (using native fetch) ──────────────────────────────────
const callGemini = async (systemPrompt, userMessage, history = []) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Map history to Gemini format ({ role: 'user' | 'model', parts: [{ text }] })
  const formattedHistory = formatConversationHistory(history, userMessage);
  const contents = formattedHistory.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini HTTP ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || null;
};

// ─── Anthropic Provider (using native fetch) ────────────────────────────────
const callAnthropic = async (systemPrompt, userMessage, history = []) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  // Format history with strict user/assistant turn alternation
  const messages = formatConversationHistory(history, userMessage);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Anthropic HTTP ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  return data?.content?.[0]?.text || null;
};

// ─── Main Service Pipeline ─────────────────────────────────────────────────
/**
 * generateAIResponse
 * @param {Object} params
 * @param {string} params.userId      - Authenticated user ID
 * @param {string} params.userName    - User's display name (for personalization)
 * @param {string} params.message     - Current user query
 * @param {Array}  params.history     - Previous messages in conversation
 * @returns {Promise<{ content: string, contextSources: Array, memoryExtracted: number, provider: string }>}
 */
const generateAIResponse = async ({ userId, userName = null, message, history = [] }) => {
  const { systemPrompt, retrievedSnippets, userMemories } = await buildPromptContext(
    userId,
    message,
    history,
    userName
  );

  // Background memory extraction
  let memoryExtracted = 0;
  try {
    memoryExtracted = await extractAndSaveMemory(userId, message);
  } catch (memErr) {
    console.warn('[AIService] Memory extraction error:', memErr.message);
  }

  // Auto-detect provider: explicit env → key-based fallback chain
  let provider = (process.env.AI_PROVIDER || 'auto').toLowerCase();
  if (provider === 'auto' || provider === 'fallback') {
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim()) {
      provider = 'anthropic';
    } else if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
      provider = 'openai';
    } else if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
      provider = 'gemini';
    } else {
      provider = 'fallback';
    }
  }

  try {
    let replyText = null;

    if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      replyText = await callAnthropic(systemPrompt, message, history);
    } else if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      replyText = await callOpenAI(systemPrompt, message, history);
    } else if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
      replyText = await callGemini(systemPrompt, message, history);
    }

    if (replyText && typeof replyText === 'string' && replyText.trim()) {
      return {
        content: replyText.trim(),
        contextSources: retrievedSnippets.map((s) => ({
          title: s.title,
          category: s.category,
          source: s.source,
        })),
        memoryExtracted,
        provider,
      };
    }

    // Smart Fallback Engine
    const fallbackText = generateSmartFallback(message, retrievedSnippets, userMemories);
    return {
      content: fallbackText,
      contextSources: retrievedSnippets.map((s) => ({
        title: s.title,
        category: s.category,
        source: s.source,
      })),
      memoryExtracted,
      provider: 'fallback',
    };
  } catch (err) {
    console.error(`[AIService] ${provider} provider failed:`, err.message);
    const fallbackText = generateSmartFallback(message, retrievedSnippets, userMemories);
    return {
      content: fallbackText,
      contextSources: retrievedSnippets.map((s) => ({
        title: s.title,
        category: s.category,
        source: s.source,
      })),
      memoryExtracted,
      provider: 'fallback',
    };
  }
};

module.exports = {
  generateAIResponse,
  buildPromptContext,
  extractAndSaveMemory,
  formatConversationHistory,
};
