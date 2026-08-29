'use strict';

const AIKnowledge = require('../models/AIKnowledge');

/**
 * Curated baseline knowledge items to guarantee rich answers even before database population.
 */
const DEFAULT_KNOWLEDGE_BASE = [
  {
    category: 'saba_profile',
    title: "Saba's World AI Persona & Identity",
    content: `Identity: Saba's World AI is an intelligent, kind, calm, supportive, and respectful fictional AI personal assistant.
Values: Purity of character, lifelong learning, education, dignity, kindness, and positivity.
Tone: Warm, thoughtful, clear, articulate, encouraging, and intellectually grounded.
Important: The AI must never claim to be the real Saba or impersonate a living individual. It is the dedicated AI companion of the Saba's World platform.`,
    tags: ['saba', 'identity', 'persona', 'values', 'assistant', 'who are you'],
  },
  {
    category: 'quotes',
    title: 'Curated Wisdom & Inspirational Reflections',
    content: `Selected Reflections & Quotes for Saba's World:
1. "True beauty is reflected in character, kindness, and dignity."
2. "Knowledge shared with humility is the purest form of wealth."
3. "Consistency and clean habits build masterpieces out of ordinary days."
4. "Keep your heart calm, your code clean, and your intentions pure."
5. "Growth happens in quiet dedication, not loud declarations."`,
    tags: ['quotes', 'wisdom', 'inspiration', 'motivation', 'purity'],
  },
  {
    category: 'java',
    title: 'Java Architecture & Core OOP Principles',
    content: `Java is a statically typed, class-based, object-oriented language running on the JVM.
Key OOP Principles:
- Encapsulation: Bundling data and methods, restricting direct access via private fields and getters/setters.
- Inheritance: Subclass extending superclass using 'extends' to promote reusability.
- Polymorphism: Method overloading (compile-time) and Method overriding (runtime via '@Override').
- Abstraction: Hiding implementation details using abstract classes and interfaces.
Memory Areas: Heap (objects/instance variables), Stack (primitive values/method frames), Metaspace (class metadata).
Key Collections: ArrayList, LinkedList, HashMap (O(1) average lookup), TreeMap (O(log n) red-black tree), ConcurrentHashMap (thread-safe bucket locks).`,
    tags: ['java', 'oop', 'jvm', 'collections', 'hashmap', 'multithreading'],
  },
  {
    category: 'python',
    title: 'Python Ecosystem & Advanced Idioms',
    content: `Python is an interpreted, high-level, dynamic programming language known for readability.
Core Features:
- List/Dict/Set Comprehensions: [x**2 for x in nums if x % 2 == 0]
- Generators & Iterators: Functions with 'yield' producing memory-efficient streams.
- Decorators: Higher-order functions wrapping functions using '@decorator_name'.
- Context Managers: 'with' statement managing resources with __enter__ and __exit__.
- Type Hints: Using 'typing' module (Union, Optional, List, Dict, Callable) for type safety.
- Data Science / AI Stack: NumPy (vectorized arrays), Pandas (dataframes), Scikit-Learn (classical ML), PyTorch/TensorFlow (neural networks).`,
    tags: ['python', 'generator', 'decorator', 'numpy', 'pandas', 'pytorch'],
  },
  {
    category: 'dsa',
    title: 'Data Structures & Algorithms Mastery',
    content: `Core Data Structures:
- Arrays & Dynamic Arrays: O(1) random access, O(n) insertion/deletion.
- Linked Lists: Singly & Doubly linked lists with O(1) pointer updates.
- Hash Maps: Key-value stores using hash functions and chaining/open addressing for collision resolution.
- Trees: Binary Search Trees, AVL Trees, Red-Black Trees, Heaps/Priority Queues (O(log n) insert/extract-min).
- Graphs: Represented via Adjacency List or Matrix; traversed via BFS (queues, shortest path unweighted) and DFS (stacks/recursion, cycle detection).

Key Algorithm Paradigms:
- Two Pointers & Sliding Window: Optimal for subarray and string search problems.
- Divide and Conquer: Merge Sort (O(n log n) stable), Quick Sort (O(n log n) average).
- Dynamic Programming: Optimal substructure & overlapping subproblems (Memoization top-down, Tabulation bottom-up).
- Graph Algorithms: Dijkstra (shortest path weighted non-negative), Bellman-Ford, Kruskal/Prim (MST).`,
    tags: ['dsa', 'algorithms', 'data structures', 'trees', 'graphs', 'dynamic programming', 'sorting'],
  },
  {
    category: 'ai',
    title: 'Modern AI, Machine Learning, LLMs & RAG',
    content: `Artificial Intelligence Overview:
- Machine Learning (ML): Supervised (Linear/Logistic Regression, Random Forests, XGBoost), Unsupervised (K-Means, PCA), Reinforcement Learning (Q-learning, PPO).
- Deep Learning (DL): Multi-layer Perceptrons, CNNs (Computer Vision), RNNs/LSTMs (Sequential), Transformers (Self-Attention mechanism).
- Large Language Models (LLMs): Transformer decoder architectures with multi-head attention, trained on vast corpora, fine-tuned via RLHF/DPO.
- Retrieval-Augmented Generation (RAG): Enhancing LLM generation by retrieving relevant external context snippets via semantic/vector or keyword search before synthesizing responses.
- Prompt Engineering: Few-shot prompting, Chain-of-Thought (CoT), ReAct pattern for tool-calling agents.`,
    tags: ['ai', 'machine learning', 'deep learning', 'transformers', 'llm', 'rag', 'nlp'],
  },
  {
    category: 'dbms',
    title: 'Database Management Systems (SQL vs NoSQL)',
    content: `DBMS Concepts:
- ACID Properties: Atomicity (all-or-nothing), Consistency (integrity constraints), Isolation (concurrency control levels), Durability (persisted writes).
- Relational Databases (PostgreSQL, MySQL): Structured schemas, relational joins, normalization (1NF to BCNF), B-Tree indexing.
- NoSQL Databases: MongoDB (Document-oriented, flexible schema, replica sets, aggregation pipelines), Redis (In-memory key-value cache), Cassandra (Wide-column distributed).
- Indexing & Optimization: Single-field, compound, text indexes; avoiding table/collection scans with explain plans.`,
    tags: ['dbms', 'sql', 'nosql', 'mongodb', 'indexing', 'acid'],
  },
  {
    category: 'os',
    title: 'Operating Systems & System Architecture',
    content: `Operating System Core Topics:
- Processes vs Threads: Process has isolated virtual memory space; threads share process heap/memory.
- CPU Scheduling: FCFS, Round Robin, Shortest Job First, Multi-level feedback queues.
- Concurrency & Synchronization: Mutexes, Semaphores, Deadlocks (Mutual exclusion, Hold & wait, No preemption, Circular wait).
- Memory Management: Virtual memory, Paging, TLB, Page replacement algorithms (LRU, FIFO).`,
    tags: ['operating systems', 'os', 'threads', 'processes', 'deadlock', 'memory management'],
  },
  {
    category: 'computer_networks',
    title: 'Computer Networks & Internet Protocols',
    content: `OSI 7-Layer vs TCP/IP 4-Layer Model:
- Application Layer: HTTP/1.1, HTTP/2, HTTP/3 (QUIC), WebSockets, DNS, TLS/SSL.
- Transport Layer: TCP (connection-oriented, 3-way handshake SYN/SYN-ACK/ACK, flow/congestion control) vs UDP (connectionless, low-latency, WebRTC).
- Network Layer: IP (IPv4/IPv6), Routing protocols (BGP, OSPF).
- Link Layer: Ethernet, MAC addressing.
- WebRTC: Real-Time Communication peer-to-peer audio/video streaming with ICE, STUN, TURN, and DTLS/SRTP encryption.`,
    tags: ['computer networks', 'networking', 'tcp', 'udp', 'http', 'webrtc', 'websockets'],
  },
  {
    category: 'mathematics',
    title: 'Mathematics for Computer Science & Machine Learning',
    content: `Mathematical Foundations:
- Linear Algebra: Vectors, Matrices, Eigenvalues/Eigenvectors, Dot Product, Matrix Decomposition (SVD).
- Calculus: Partial Derivatives, Gradient Descent, Chain Rule (Backpropagation in neural networks).
- Probability & Statistics: Bayes' Theorem, Probability Distributions (Gaussian, Bernoulli), Expected Value, Variance, Hypothesis Testing.
- Discrete Mathematics: Combinatorics, Graph Theory, Set Theory, Logic & Proofs.`,
    tags: ['mathematics', 'math', 'linear algebra', 'calculus', 'probability', 'statistics'],
  },
];

/**
 * Retrieve relevant knowledge snippets based on user query.
 */
const retrieveKnowledge = async (query, categoryHint = null, limit = 4) => {
  try {
    const cleaned = query.toLowerCase().replace(/[^\w\s]/gi, ' ').trim();
    const keywords = cleaned.split(/\s+/).filter((w) => w.length > 2);

    const mongoose = require('mongoose');
    let dbMatches = [];
    if (mongoose.connection.readyState === 1) {
      try {
        // 1. Text search or regex keyword search in MongoDB
        const conditions = [{ enabled: true }];
        if (categoryHint) conditions.push({ category: categoryHint });

        if (keywords.length > 0) {
          const regexPatterns = keywords.map((k) => new RegExp(k, 'i'));
          dbMatches = await AIKnowledge.find({
            enabled: true,
            $or: [
              { tags: { $in: regexPatterns } },
              { title: { $in: regexPatterns } },
              { category: { $in: regexPatterns } },
            ],
          })
            .sort({ priority: -1, updatedAt: -1 })
            .limit(limit)
            .lean();
        }

        if (dbMatches.length === 0) {
          // Text index fallback
          dbMatches = await AIKnowledge.find(
            { $text: { $search: query }, enabled: true },
            { score: { $meta: 'textScore' } }
          )
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .lean();
        }
      } catch (dbErr) {
        console.warn('[KnowledgeService] DB search fallback to defaults:', dbErr.message);
      }
    }

    // 2. If DB has results, return them
    if (dbMatches && dbMatches.length > 0) {
      return dbMatches;
    }

    // 3. In-memory relevance ranking against DEFAULT_KNOWLEDGE_BASE
    const STOP_WORDS = new Set([
      'what', 'is', 'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or',
      'explain', 'tell', 'me', 'about', 'simple', 'words', 'how', 'does', 'why', 'give',
      'can', 'you', 'please', 'with', 'examples', 'example', 'using', 'study', 'help'
    ]);

    const significantKeywords = keywords.filter((k) => !STOP_WORDS.has(k) && k.length > 1);
    const searchKeys = significantKeywords.length > 0 ? significantKeywords : keywords;

    const scoredDefaults = DEFAULT_KNOWLEDGE_BASE.map((item) => {
      let score = 0;
      const itemText = `${item.title} ${item.category} ${item.tags.join(' ')} ${item.content}`.toLowerCase();

      searchKeys.forEach((key) => {
        if (item.category.toLowerCase() === key) score += 10;
        if (item.tags.some((t) => t.toLowerCase() === key)) score += 8;
        if (item.tags.some((t) => t.toLowerCase().includes(key))) score += 4;
        if (item.title.toLowerCase().includes(key)) score += 5;
        if (itemText.includes(key)) score += 2;
      });

      return { item, score };
    })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);

    return scoredDefaults.slice(0, limit);
  } catch (err) {
    console.error('[KnowledgeService] Error retrieving knowledge:', err.message);
    return [];
  }
};

module.exports = {
  retrieveKnowledge,
  DEFAULT_KNOWLEDGE_BASE,
};
