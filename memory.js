// memory.js - Postgres-backed memory
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Fetch or create a memory record by userId
export async function getGuestMemory(userId, defaultName) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT * FROM guest_memory WHERE user_id = $1 LIMIT 1",
      [userId]
    );

    if (res.rows.length === 0) {
      // New guest
      const now = new Date().toISOString();
      const insert = await client.query(
        `INSERT INTO guest_memory
          (user_id, name, first_seen, last_seen, visits, likes, dislikes, notes)
         VALUES ($1, $2, $3, $3, 1, $4, $5, $6)
         RETURNING *`,
        [userId, defaultName, now, [], [], []]
      );
      return insert.rows[0];
    } else {
      // Update last_seen + visits
      const row = res.rows[0];
      const now = new Date().toISOString();

      const updated = await client.query(
        `UPDATE guest_memory
         SET last_seen = $2, visits = COALESCE(visits, 0) + 1
         WHERE id = $1
         RETURNING *`,
        [row.id, now]
      );
      return updated.rows[0];
    }
  } finally {
    client.release();
  }
}

// Summarize memory for system prompt
export function summarizeGuestMemory(guest, displayName) {
  if (!guest) {
    return `No prior memory found for ${displayName}. Treat them as a new guest.`;
  }

  const parts = [];
  parts.push(`Guest name: ${guest.name || displayName}`);
  parts.push(`Visits: ${guest.visits || 1}`);
  if (guest.first_seen) parts.push(`First seen: ${guest.first_seen}`);
  if (guest.last_seen) parts.push(`Last seen: ${guest.last_seen}`);
  if (guest.likes?.length) parts.push(`Likes: ${guest.likes.join("; ")}`);
  if (guest.dislikes?.length) parts.push(`Dislikes: ${guest.dislikes.join("; ")}`);
  if (guest.notes?.length) parts.push(`Notes: ${guest.notes.join("; ")}`);
  return parts.join("\n");
}

// Helper to merge arrays uniquely
function mergeUnique(existing = [], toAdd = []) {
  const set = new Set(existing || []);
  for (const item of toAdd || []) {
    const clean = String(item).trim();
    if (clean) set.add(clean);
  }
  return Array.from(set);
}

// Extract memory-worthy info using GPT
export async function extractAndSaveMemory({
  client,
  userId,
  userName,
  lastUserMessage,
  assistantReply,
  existingGuest,
}) {
  const existingSummary = summarizeGuestMemory(existingGuest, userName);

  const extractionPrompt = `
You extract long-term preferences from conversations.

Look for:
- likes (vibes, interests, favorite places, styles)
- dislikes
- personal notes (boundaries, preferences, roles, personality info)

IGNORE small talk.

Return STRICT JSON:
{
  "likes": [],
  "dislikes": [],
  "notes": []
}

User name: ${userName}
Existing summary:
${existingSummary}

User said:
${lastUserMessage}

Assistant replied:
${assistantReply}
`;

  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: "Extract JSON only." },
      { role: "user", content: extractionPrompt },
    ],
    temperature: 0,
    max_tokens: 300,
  });

  let data = { likes: [], dislikes: [], notes: [] };
  try {
    data = JSON.parse(completion.choices[0].message.content.trim());
  } catch (err) {
    console.error("Memory parse error:", err);
  }

  const mergedLikes = mergeUnique(existingGuest.likes, data.likes);
  const mergedDislikes = mergeUnique(existingGuest.dislikes, data.dislikes);
  const mergedNotes = mergeUnique(existingGuest.notes, data.notes);

  const db = await pool.connect();
  try {
    await db.query(
      `UPDATE guest_memory
       SET likes = $2, dislikes = $3, notes = $4
       WHERE id = $1`,
      [existingGuest.id, mergedLikes, mergedDislikes, mergedNotes]
    );
  } finally {
    db.release();
  }
}
