'use strict';

/**
 * ReactBoatService — Legacy / Unified AI Assistant Provider Layer
 * Uses centralized system prompt and robust multi-provider handling.
 */

const { BASE_SYSTEM_PROMPT, buildSystemPrompt } = require('../config/systemPrompt');
const { formatConversationHistory } = require('./aiService');
const { findSabaResponse } = require('../data/sabaKnowledge');

// ─── Smart Fallback Engine ──────────────────────────────────────────────────
const smartFallback = (message, history = []) => {
  const directSaba = findSabaResponse(message);
  if (directSaba) return directSaba;

  const lower = (message || '').toLowerCase().trim();

  if (/^(hi|hello|hey|salaam|assalam|greetings)/i.test(lower)) {
    return `Hello! 👋 I'm **Saba's World AI**, your intelligent personal assistant.

I can assist you with:
- 🌸 **Saba's World**: Reflections on character, modesty, hijab, and wisdom
- 💻 **Programming & Development**: Java, Python, JavaScript, TypeScript, React, Node.js
- 🧠 **Computer Science**: DSA, System Design, DBMS, OS, Computer Networks
- 🤖 **AI/ML**: Neural networks, Transformers, LLMs, and RAG architectures
- 📚 **Learning & Productivity**: Conceptual explanations, debugging, and study planning

What would you like to explore or solve today?`;
  }

  if (lower.includes('java')) {
    return `### ☕ Java & OOP Concepts

Java is an enterprise-grade, object-oriented language that emphasizes reliability, portability, and strong typing.

**Core OOP Principles:**
1. **Encapsulation:** Hiding internal state with access modifiers and getters/setters.
2. **Inheritance:** Code reuse through hierarchical class relationships.
3. **Polymorphism:** Method overriding (dynamic) and method overloading (static).
4. **Abstraction:** Exposing essential interfaces while hiding underlying complexity.

\`\`\`java
public record UserProfile(String username, String role) {
    public void display() {
        System.out.println("User: " + username + " [" + role + "]");
    }
}
\`\`\`

Would you like to dive into Java Concurrency, Streams, or Spring Boot?`;
  }

  if (lower.includes('python')) {
    return `### 🐍 Python Fundamentals & Best Practices

Python offers unmatched readability, dynamic typing, and a vast ecosystem for backend, automation, and AI.

\`\`\`python
from typing import List, Dict

def analyze_data(items: List[str]) -> Dict[str, int]:
    """Return word frequency counts using dictionary comprehension."""
    return {item: items.count(item) for item in set(items)}

print(analyze_data(["python", "ai", "python", "dsa"]))
\`\`\`

What specific Python topic or library are you working on?`;
  }

  if (lower.includes('dsa') || lower.includes('algorithm') || lower.includes('data structure')) {
    return `### 🧩 Data Structures & Algorithms (DSA)

**Core Time Complexities (Average):**
- **Hash Map:** Lookup $O(1)$, Insert $O(1)$, Delete $O(1)$
- **Balanced Binary Search Tree:** Lookup $O(\\log n)$, Insert $O(\\log n)$, Delete $O(\\log n)$
- **Array / Dynamic Array:** Index access $O(1)$, Search $O(n)$, Insert/Delete $O(n)$

Share your specific algorithm challenge or code snippet, and I'll help you analyze and optimize it!`;
  }

  return `I am **Saba's World AI**, here to assist you with thoughtful conversation, technical learning, programming, and personal growth.

What can I help you with today? Feel free to ask any technical, conceptual, or reflective question! 🚀`;
};

// ─── OpenAI Provider ────────────────────────────────────────────────────────
const callOpenAI = async (message, history = []) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const formattedHistory = formatConversationHistory(history, message);
  const messages = [
    { role: 'system', content: BASE_SYSTEM_PROMPT },
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
    const errText = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || null;
};

// ─── Google Gemini Provider ──────────────────────────────────────────────────
const callGemini = async (message, history = []) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const formattedHistory = formatConversationHistory(history, message);
  const contents = formattedHistory.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    systemInstruction: {
      parts: [{ text: BASE_SYSTEM_PROMPT }],
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
    const errText = await res.text();
    throw new Error(`Gemini HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
};

// ─── Anthropic Provider ──────────────────────────────────────────────────────
const callAnthropic = async (message, history = []) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  const messages = formatConversationHistory(history, message);

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
      system: BASE_SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data?.content?.[0]?.text || null;
};

// ─── Main Service Export ──────────────────────────────────────────────────────
const generateResponse = async (message, conversationHistory = []) => {
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
    let result = null;
    switch (provider) {
      case 'openai':
        if (process.env.OPENAI_API_KEY) {
          result = await callOpenAI(message, conversationHistory);
        }
        break;

      case 'gemini':
        if (process.env.GEMINI_API_KEY) {
          result = await callGemini(message, conversationHistory);
        }
        break;

      case 'anthropic':
        if (process.env.ANTHROPIC_API_KEY) {
          result = await callAnthropic(message, conversationHistory);
        }
        break;

      case 'fallback':
      default:
        result = smartFallback(message, conversationHistory);
        break;
    }

    if (result && typeof result === 'string' && result.trim()) {
      return result.trim();
    }
    return smartFallback(message, conversationHistory);
  } catch (err) {
    console.error(`[ReactBoatService] ${provider} provider error:`, err.message);
    return smartFallback(message, conversationHistory);
  }
};

module.exports = { generateResponse };
