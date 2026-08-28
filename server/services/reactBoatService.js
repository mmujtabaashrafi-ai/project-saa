/**
 * ReactBoatService — LLM Provider Abstraction Layer
 *
 * Architecture:
 *   React
 *     ↓
 *   Express API
 *     ↓
 *   ReactBoatService
 *     ↓
 *   LLMProvider (OpenAI / Gemini / Anthropic / SmartFallback)
 *
 * AI API keys NEVER leave this file. They are never returned to the frontend.
 * To switch providers, change AI_PROVIDER in your .env file.
 */

'use strict';

// ─── Smart Fallback Responses ───────────────────────────────────────────────
const FALLBACK_PERSONA = `You are React Boat AI, an intelligent assistant built into the React Boat chat application.
You specialize in programming, Java, Python, Data Structures & Algorithms, AI/ML, and general study help.
You are helpful, clear, and friendly. You always identify yourself as an AI assistant.`;

const PROGRAMMING_KEYWORDS = [
  'java', 'python', 'javascript', 'typescript', 'react', 'node', 'express',
  'mongodb', 'sql', 'algorithm', 'dsa', 'data structure', 'array', 'linked list',
  'stack', 'queue', 'tree', 'graph', 'sort', 'search', 'recursion', 'loop',
  'function', 'class', 'object', 'api', 'rest', 'code', 'program', 'debug',
  'error', 'bug', 'compile', 'runtime', 'ai', 'ml', 'machine learning', 'neural',
  'model', 'training', 'dataset', 'tensor', 'pytorch', 'tensorflow', 'flask',
  'spring', 'maven', 'gradle', 'git', 'docker', 'kubernetes', 'css', 'html',
];

const smartFallback = (message, history) => {
  const lower = message.toLowerCase();
  const isGreeting = /^(hi|hello|hey|greetings|salaam|assalam)/i.test(lower.trim());
  const isProgramming = PROGRAMMING_KEYWORDS.some((kw) => lower.includes(kw));
  const isQuestion = lower.includes('?') || lower.startsWith('what') || lower.startsWith('how') || lower.startsWith('why') || lower.startsWith('explain') || lower.startsWith('tell me');

  if (isGreeting) {
    return `Hello! 👋 I'm **React Boat AI**, your intelligent assistant. I'm here to help you with:

- 💻 **Programming** — Java, Python, JavaScript, and more
- 🧠 **DSA** — Data structures, algorithms, problem-solving
- 🤖 **AI/ML** — Machine learning concepts, frameworks
- 📚 **Study Help** — Explanations, summaries, concepts
- 🛠️ **Project Development** — Architecture, debugging, code review

What can I help you with today?`;
  }

  if (lower.includes('java') && isProgramming) {
    return `Great question about Java! ☕

Java is a powerful, object-oriented, platform-independent language. Here are some key concepts:

**Core Java Topics:**
- **OOP Principles**: Encapsulation, Inheritance, Polymorphism, Abstraction
- **Collections**: ArrayList, HashMap, LinkedList, TreeMap
- **Multithreading**: Thread, Runnable, ExecutorService
- **Streams**: Java 8+ functional programming with Stream API
- **Exception Handling**: try-catch-finally, custom exceptions

**Example — Simple Java class:**
\`\`\`java
public class Example {
    private String name;
    
    public Example(String name) {
        this.name = name;
    }
    
    public String getName() {
        return name;
    }
    
    public static void main(String[] args) {
        Example e = new Example("React Boat");
        System.out.println("Hello from " + e.getName());
    }
}
\`\`\`

What specific Java topic would you like to explore? 🚀`;
  }

  if (lower.includes('python') && isProgramming) {
    return `Python is an excellent choice! 🐍

**Why Python?**
- Clean, readable syntax
- Huge ecosystem (NumPy, Pandas, TensorFlow, Django, Flask)
- Great for AI/ML, data science, automation, and web dev

**Example — Python basics:**
\`\`\`python
# List comprehension
squares = [x**2 for x in range(10)]

# Dictionary
student = {"name": "Ali", "grade": "A", "score": 95}

# Function with type hints
def greet(name: str) -> str:
    return f"Hello, {name}! Welcome to React Boat."

# Class
class Animal:
    def __init__(self, species: str):
        self.species = species
    
    def speak(self) -> str:
        return f"I am a {self.species}"
        
print(greet("World"))
\`\`\`

What Python concept are you working on? 🔥`;
  }

  if ((lower.includes('dsa') || lower.includes('data structure') || lower.includes('algorithm')) && isProgramming) {
    return `Data Structures & Algorithms — the backbone of CS! 🧩

**Core Data Structures:**
| Structure | Access | Search | Insert | Delete |
|-----------|--------|--------|--------|--------|
| Array | O(1) | O(n) | O(n) | O(n) |
| Linked List | O(n) | O(n) | O(1) | O(1) |
| Hash Map | O(1) | O(1) | O(1) | O(1) |
| Binary Tree | O(log n) | O(log n) | O(log n) | O(log n) |

**Popular Algorithms:**
- **Sorting**: Bubble, Merge, Quick, Heap sort
- **Searching**: Binary search, BFS, DFS
- **Dynamic Programming**: Memoization, tabulation
- **Graph**: Dijkstra, Floyd-Warshall, Kruskal

What problem are you solving? Share your code and I'll help debug or optimize it! 💪`;
  }

  if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('ml') || lower.includes('neural')) {
    return `Excellent topic — AI/ML is transforming everything! 🤖

**Machine Learning Roadmap:**
1. **Math Foundations** → Linear algebra, calculus, probability
2. **Python** → NumPy, Pandas, Matplotlib
3. **Classical ML** → scikit-learn (regression, classification, clustering)
4. **Deep Learning** → PyTorch or TensorFlow
5. **Specializations** → NLP, Computer Vision, Reinforcement Learning

**Quick Example — Linear Regression:**
\`\`\`python
from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 5, 4, 5])

model = LinearRegression()
model.fit(X, y)

prediction = model.predict([[6]])
print(f"Prediction for 6: {prediction[0]:.2f}")
\`\`\`

What AI/ML topic interests you most? 🚀`;
  }

  if (isQuestion) {
    return `That's a great question! 🤔

I'm **React Boat AI** — here to help with programming, DSA, AI/ML, and study topics.

To give you the best answer, could you be more specific about:
- What programming language or technology are you using?
- What's the specific problem or concept you'd like explained?
- What have you tried so far?

I'm fully powered and ready to help you learn and solve problems! 💡

*(Note: For enhanced AI responses, configure an API key in server .env — see AI_PROVIDER setting.)*`;
  }

  return `I'm **React Boat AI** 🤖, your intelligent assistant!

I can help you with:
- **Programming**: Java, Python, JavaScript, TypeScript, C++
- **DSA**: Algorithms, data structures, complexity analysis
- **AI/ML**: Machine learning, deep learning, NLP
- **Study**: Concept explanations, summaries, Q&A
- **Projects**: Architecture, code review, debugging

Just ask me anything technical! What would you like to learn or solve today? 🚀`;
};

// ─── OpenAI Provider ────────────────────────────────────────────────────────
const callOpenAI = async (message, history) => {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const messages = [
    { role: 'system', content: FALLBACK_PERSONA },
    ...history.slice(-20).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

// ─── Google Gemini Provider ──────────────────────────────────────────────────
const callGemini = async (message, history) => {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

  const chat = model.startChat({
    history: history.slice(-20).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    systemInstruction: FALLBACK_PERSONA,
  });

  const result = await chat.sendMessage(message);
  return result.response.text();
};

// ─── Anthropic Provider ──────────────────────────────────────────────────────
const callAnthropic = async (message, history) => {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

  const messages = [
    ...history.slice(-20).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
    max_tokens: 1024,
    system: FALLBACK_PERSONA,
    messages,
  });

  return response.content[0].text;
};

// ─── Main Service Export ──────────────────────────────────────────────────────
/**
 * generateResponse — Call the configured LLM provider.
 * @param {string} message — the user's message
 * @param {Array}  conversationHistory — [{role, content}] previous messages
 * @returns {Promise<string>} — AI response text
 */
const generateResponse = async (message, conversationHistory = []) => {
  const provider = (process.env.AI_PROVIDER || 'fallback').toLowerCase();

  try {
    switch (provider) {
      case 'openai':
        return await callOpenAI(message, conversationHistory);

      case 'gemini':
        return await callGemini(message, conversationHistory);

      case 'anthropic':
        return await callAnthropic(message, conversationHistory);

      case 'fallback':
      default:
        return smartFallback(message, conversationHistory);
    }
  } catch (err) {
    console.error(`[ReactBoatService] ${provider} provider error:`, err.message);
    // Graceful fallback if provider fails
    return smartFallback(message, conversationHistory);
  }
};

module.exports = { generateResponse };
