'use strict';

/**
 * Dedicated Saba Knowledge Base & Curated Wisdom
 * Contains authentic, respectful, and elegant responses and quotes.
 * Modifiable without touching core server logic.
 */

const SABA_QUOTES = [
  "Saba is a reminder that true beauty begins with a beautiful character.",
  "Her hijab does not hide her beauty; it reflects the dignity with which she carries it.",
  "Saba is the kind of elegance that speaks softly and leaves a lasting impression.",
  "She made modesty look graceful, confident and beautiful.",
  "Behind her hijab is a personality defined by dignity, kindness and strength.",
  "Saba's beauty is not only in how she looks, but in the grace with which she carries herself.",
  "A hijabi girl like Saba shows that modesty and elegance can walk together beautifully.",
  "Her greatest beauty is the respect, kindness and dignity she brings into the world.",
  "Saba represents a quiet kind of beauty — graceful, modest and unforgettable.",
  "The beauty of Saba is found not only in her appearance, but in the character behind her smile.",
  "She doesn't need to seek attention; her grace speaks for itself.",
  "Saba is a beautiful example of how confidence, modesty and elegance can exist together.",
  "Her hijab is a symbol of her choice to carry herself with dignity and grace.",
  "Some people shine through appearance; others shine through character. Saba carries both grace and character."
];

const WHO_IS_SABA_ANSWER = `Saba is a beautiful soul known for her grace, modesty, kindness and quiet strength. Her hijab is not merely an appearance; it represents dignity, confidence and the beauty of modesty. She carries herself with elegance and respect, making her presence truly special.`;

const SABA_KNOWLEDGE_TOPICS = [
  {
    category: 'who_is_saba',
    title: 'Who is Saba?',
    tags: ['who is saba', 'about saba', 'tell me about saba', 'who saba', 'who is she'],
    content: WHO_IS_SABA_ANSWER,
  },
  {
    category: 'saba_elegance',
    title: "Saba's Elegance & Grace",
    tags: ['elegance', "saba's elegance", 'grace', 'quiet strength', 'poise'],
    content: `Saba's elegance is gentle and natural. It is reflected in how she speaks softly, treats everyone with respect, and carries herself with quiet confidence. True grace does not seek noise or attention; it shines effortlessly through character, poise, and dignified presence.`,
  },
  {
    category: 'saba_hijab',
    title: 'The Beauty of Saba’s Hijab',
    tags: ['hijab', 'why is her hijab beautiful', 'beauty of hijab', 'modesty', 'hijabi'],
    content: `Her hijab is a meaningful symbol of dignity, faith, and intentional choice. It does not hide who she is; rather, it frames her character with respect and confidence. Saba shows that modesty and elegance complement one another in the most graceful way.`,
  },
  {
    category: 'saba_quotes',
    title: 'Quotes & Reflections on Saba',
    tags: ['quote about saba', 'saba quote', 'give me a quote about saba', 'quote on saba'],
    content: `Here are reflections on Saba's grace and character:
• *"Saba is a reminder that true beauty begins with a beautiful character."*
• *"Her hijab does not hide her beauty; it reflects the dignity with which she carries it."*
• *"She made modesty look graceful, confident and beautiful."*
• *"Some people shine through appearance; others shine through character. Saba carries both grace and character."*`,
  },
  {
    category: 'saba_appreciation',
    title: 'Respectful Appreciation for Saba',
    tags: ['respectful appreciation', 'appreciation', 'appreciate saba', 'write an appreciation'],
    content: `In a world full of noise, Saba stands out through quiet dignity, kindness, and genuine grace. Her modesty is an inspiring expression of self-respect, and her warm character brings calm and inspiration to everyone around her. She represents the timeless truth that the most lasting beauty comes from a noble heart and an elevated mind.`,
  },
  {
    category: 'modesty',
    title: 'The Philosophy of Modesty & Dignity',
    tags: ['tell me about modesty', 'modesty', 'chastity', 'dignity', 'haya'],
    content: `Modesty is not about diminishing oneself; it is about self-value, dignity, and elevated standards. It allows a person's intelligence, character, and values to take center stage. When paired with quiet confidence, modesty creates an unmatched, timeless elegance.`,
  },
  {
    category: 'motivation',
    title: 'Motivational Reflection for the Day',
    tags: ['give me a motivational message', 'motivational message', 'motivation', 'inspiration'],
    content: `Every day is an opportunity to cultivate your mind, strengthen your character, and act with kindness. Focus on steady, quiet progress rather than instant applause. Consistency, pure intentions, and dignified effort build masterpieces out of ordinary days. Keep your heart calm, your mind focused, and your principles strong. ✨`,
  },
];

/**
 * Direct matching helper for fallback engine
 */
function findSabaResponse(userQuery) {
  if (!userQuery || typeof userQuery !== 'string') return null;
  const q = userQuery.toLowerCase().trim();

  if (/^(who is saba|who's saba|who is saba\?|who is saba the purest|tell me about saba)/i.test(q)) {
    return WHO_IS_SABA_ANSWER;
  }

  if (q.includes('saba') && (q.includes('quote') || q.includes('quotes'))) {
    const randomQuote = SABA_QUOTES[Math.floor(Math.random() * SABA_QUOTES.length)];
    return `✨ *" ${randomQuote} "* ✨\n\nSaba's character is defined by quiet grace, respect, and enduring dignity.`;
  }

  if (q.includes('quote') || q.includes('quotes')) {
    const randomQuote = SABA_QUOTES[Math.floor(Math.random() * SABA_QUOTES.length)];
    return `✨ *" ${randomQuote} "* ✨`;
  }

  if (q.includes('elegance') || q.includes('grace')) {
    return SABA_KNOWLEDGE_TOPICS.find((t) => t.category === 'saba_elegance')?.content || null;
  }

  if (q.includes('hijab') || q.includes('hijabi')) {
    return SABA_KNOWLEDGE_TOPICS.find((t) => t.category === 'saba_hijab')?.content || null;
  }

  if (q.includes('appreciation') || q.includes('appreciate')) {
    return SABA_KNOWLEDGE_TOPICS.find((t) => t.category === 'saba_appreciation')?.content || null;
  }

  if (q.includes('modesty') || q.includes('modest')) {
    return SABA_KNOWLEDGE_TOPICS.find((t) => t.category === 'modesty')?.content || null;
  }

  if (q.includes('motivat') || q.includes('inspirational message') || q.includes('encouragement')) {
    return SABA_KNOWLEDGE_TOPICS.find((t) => t.category === 'motivation')?.content || null;
  }

  return null;
}

module.exports = {
  SABA_QUOTES,
  WHO_IS_SABA_ANSWER,
  SABA_KNOWLEDGE_TOPICS,
  findSabaResponse,
};
