// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const memory = require('./memory');

const app = express();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

// --- Load Callidora knowledge (from crawler / manual pack) ---
let callidoraDocs = [];
try {
  const raw = fs.readFileSync(path.join(__dirname, 'urlKnowledge.json'), 'utf8');
  callidoraDocs = JSON.parse(raw);
  if (!Array.isArray(callidoraDocs)) callidoraDocs = [];
  console.log(`✅ Loaded ${callidoraDocs.length} Callidora docs from urlKnowledge.json`);
} catch (err) {
  console.warn('⚠️ Could not load urlKnowledge.json, Callidora docs disabled:', err.message);
  callidoraDocs = [];
}

// --- Simple keyword-based relevance scoring ---
function scoreDoc(query, doc) {
  if (!doc) return 0;
  const text = ((doc.title || '') + ' ' + (doc.text || '')).toLowerCase();
  const qWords = query.toLowerCase().split(/\W+/).filter(Boolean);
  let score = 0;
  for (const w of qWords) {
    if (text.includes(w)) score += 1;
  }
  return score;
}

function retrieveCallidoraSnippets(query, maxChars = 6000) {
  if (!callidoraDocs.length) return '';

  const scored = callidoraDocs
    .map(doc => ({ doc, score: scoreDoc(query, doc) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (!scored.length) return '';

  let out = '';
  for (const { doc } of scored) {
    const title = doc.title || doc.url || 'Untitled';
    const text = (doc.text || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    const remaining = maxChars - out.length;
    if (remaining <= 0) break;

    const chunk = text.slice(0, remaining);
    out += `\n\n### ${title}\n${chunk}`;
  }
  return out.trim();
}

// --- Detect whether this is a “Callidora domain” question ---
function isCallidoraQuestion(message) {
  const m = message.toLowerCase();
  const keywords = [
    'callidora', 'cove', 'britz', 'grind coffee', 'elevé', 'eleve art',
    'luxury rentals', 'pre-made', 'premade', 'pre mades', 'elite pre-mades',
    'obsidian grove', 'noir penthouse', 'the trenton', 'palisades',
    'life’s a breeze', "life's a breeze", 'autumn crest', 'malibu dreams',
    'crystalvale', 'carlton penthouse', 'blanc penthouse'
  ];
  return keywords.some(k => m.includes(k));
}

// --- Build the system prompt depending on context ---
function buildSystemPrompt({ displayName, preferredName }, callidoraMode, callidoraRef) {
  const guestNameInfo = `
Guest avatar name: "${displayName}"
Preferred name (if set): "${preferredName || 'not set'}"

Address rules:
- If preferred name is set, always use that.
- Otherwise, use the avatar name exactly as given.
- Never address someone as just "Resident".
`.trim();

  if (callidoraMode) {
    return `
You are **Calli**, a 7-star hotel–level concierge for **Callidora Designs** and **Callidora Cove Luxury Rentals** in Second Life.

CRITICAL BEHAVIOR RULES – CALLIDORA MODE
1. **Use ONLY the official Callidora reference below** for any facts about:
   - Callidora Designs
   - Callidora Cove
   - Britz Hotel, Grind Coffee House & Eatery, Elevé Art Collective
   - Callidora Catering and its bundles
   - Luxury rentals and featured properties
   - Pre-mades (Elite, Gold, Silver, Bronze, Commercial, Holiday)
   - Curated collections like [CD] Beverly Hills Collection, [CD] Downtown Aspen Collection
   - Any other Callidora-branded item

2. **If the reference does NOT clearly contain the answer**, reply with:
   > "I’m sorry, I don’t have that information yet."

   Do **not** guess, embellish, or invent numbers, features, or places.

3. **Pre-mades vs Collections (very important)**:
   - “Elite, Gold, Silver, Bronze, Commercial, Holiday” = categories of **pre-made designs**, NOT “collections”.
   - “Collections” refers to curated item sets such as:
     - [CD] Beverly Hills Collection
     - [CD] Downtown Aspen Collection

4. **URLs – always include when relevant**:
   At the end of your answer, append the appropriate links if the topic touches them:

   - General Callidora Designs info / portfolio: https://www.callidoradesigns.com/
   - Luxury rentals: https://www.callidoradesigns.com/luxury-rentals
   - Pre-made designs: https://www.callidoradesigns.com/pre-madedesigns
   - Callidora Catering: https://www.callidoradesigns.com/callidoracatering
   - Collections: https://www.callidoradesigns.com/collections

5. **Style**:
   - Warm, professional, guest-first tone.
   - Minimal filler. Prefer short paragraphs and bullet points.
   - When asked for “all” pre-mades in a category, **list every option** mentioned in the reference, not just a sample.

${guestNameInfo}

OFFICIAL CALLIDORA REFERENCE (ONLY factual source you may use for Callidora topics):
${callidoraRef || '(no reference snippets available)'}
`.trim();
  }

  // General SL / everything-else mode
  return `
You are **Calli**, a friendly but precise Second Life concierge. You help with:
- Questions about Second Life (systems, general concepts, lifestyle).
- Basic real-world questions (time, capitals, etc.).
- Callidora questions **only when clearly supported by the supplied reference text**.

GENERAL BEHAVIOR RULES
1. **Honesty first**:
   - If you are **not sure** about a fact (especially about specific Second Life sims, stores, clubs, or brands), say:
     > "I’m not sure. I’d recommend checking in-world search or the Second Life Destinations guide."
   - Do **not** invent the names of sims, stores, malls, or cafés just to be helpful.

2. **Callidora in general mode**:
   - If the question is clearly about Callidora, still follow the Callidora reference exactly if it is provided.
   - If the reference does not contain the answer, say you don’t have that information.

3. **Style**:
   - Warm, nurturing, professional—like a luxury hotel concierge.
   - Keep answers focused. No more than ~4 short paragraphs unless the guest asks for deep detail.
   - Use bullet points for lists (amenities, bundles, options).

${guestNameInfo}

CALLIDORA REFERENCE (use only when the question is clearly about Callidora, and do not invent beyond it):
${callidoraRef || '(no reference snippets available)'}
`.trim();
}

// --- Chat endpoint used by LSL tablets ---
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, avatarName, message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const effectiveUserId = userId || avatarName || 'anonymous';
    const displayName = avatarName || 'Resident';

    // Update memory with any simple patterns (e.g., "call me Jaden")
    memory.updateFromMessage(effectiveUserId, displayName, message);

    const userProfile = memory.getUserProfile(effectiveUserId, displayName);
    const history = memory.getRecentHistory(effectiveUserId);

    const callidoraMode = isCallidoraQuestion(message);
    const callidoraRef = callidoraMode ? retrieveCallidoraSnippets(message) : retrieveCallidoraSnippets(message);

    const systemContent = buildSystemPrompt(
      { displayName, preferredName: userProfile.preferredName },
      callidoraMode,
      callidoraRef
    );

    // Turn history into model messages (shortened)
    const historyMessages = history.map(turn => [
      { role: 'user', content: turn.user },
      { role: 'assistant', content: turn.assistant }
    ]).flat();

    const preferredNameNote = userProfile.preferredName
      ? `Guest prefers to be called "${userProfile.preferredName}".`
      : `Guest has not given a preferred name yet; address them as "${displayName}".`;

    const userContent = `
${preferredNameNote}

Guest message:
"${message}"
`.trim();

    const messages = [
      { role: 'system', content: systemContent },
      ...historyMessages,
      { role: 'user', content: userContent }
    ];

    const completion = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages,
      temperature: 0.3,          // lower = safer, fewer hallucinations
      max_tokens: 800            // keep answers compact for SL
    });

    const reply = (completion.choices[0].message.content || '').trim();

    // Save conversation turn
    memory.appendTurn(effectiveUserId, message, reply);

    // Return raw text; the LSL script will handle chunking into multiple lines
    res.json({ reply });
  } catch (err) {
    console.error('❌ Error in /api/chat:', err);
    res.status(500).json({
      error: 'Server error from Calli',
      detail: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Calli Concierge live on port ${PORT} — stricter Callidora facts, better SL answers, longer replies chunked by LSL.`);
});
