// memory.js
import pkg from "pg";
const { Pool } = pkg;

// Connect to Postgres using DATABASE_URL from environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

let tablesReady = false;

// Create the memory table if it doesn't exist
async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guest_memory (
      user_id TEXT PRIMARY KEY,
      user_name TEXT,
      facts JSONB DEFAULT '[]'::jsonb,
      last_seen_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function initMemory() {
  if (tablesReady) return;
  try {
    await ensureTables();
    tablesReady = true;
    console.log("✅ Postgres memory table ready (guest_memory).");
  } catch (err) {
    console.error("❌ Error ensuring memory tables:", err);
  }
}

// Load memory for a given userId
export async function loadGuestMemory(userId) {
  if (!userId) return null;
  await initMemory();

  try {
    const { rows } = await pool.query(
      `
      SELECT user_id, user_name, facts, last_seen_at
      FROM guest_memory
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (!rows.length) {
      return null;
    }

    return rows[0];
  } catch (err) {
    console.error("❌ Error loading guest memory:", err);
    return null; // fail soft, Calli still responds
  }
}

// Save/merge memory for a user
export async function saveGuestMemory(userId, userName, newFacts = []) {
  if (!userId) return;
  await initMemory();

  try {
    await pool.query(
      `
      INSERT INTO guest_memory (user_id, user_name, facts, last_seen_at)
      VALUES ($1, $2, $3::jsonb, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        user_name = COALESCE(EXCLUDED.user_name, guest_memory.user_name),
        facts = COALESCE(guest_memory.facts, '[]'::jsonb) || EXCLUDED.facts,
        last_seen_at = NOW()
      `,
      [userId, userName || null, JSON.stringify(newFacts)]
    );
  } catch (err) {
    console.error("❌ Error saving guest memory:", err);
  }
}

// Simple heuristic: pull "memorable" facts out of a conversation turn
export async function extractAndSaveMemory(
  userId,
  userName,
  userMessage,
  assistantReply
) {
  if (!userId) return;

  const facts = [];

  // 1) Name: "my name is Jaden"
  const nameMatch = userMessage.match(/my name is\s+([A-Za-z0-9_\- ]{2,40})/i);
  if (nameMatch) {
    facts.push({
      type: "name",
      value: nameMatch[1].trim(),
      source: "user_message",
    });
  }

  // 2) Preferences: "I like / I love X"
  const likeMatch = userMessage.match(
    /I (really )?(like|love)\s+([^\.!\n]{2,80})/i
  );
  if (likeMatch) {
    facts.push({
      type: "preference",
      value: likeMatch[3].trim(),
      source: "user_message",
    });
  }

  // 3) Future intention: "next time I'm here I want to..."
  const nextTimeMatch = userMessage.match(
    /next time (i am|i'm|im|i’m) here\s*,?\s*(.*)$/i
  );
  if (nextTimeMatch && nextTimeMatch[2]) {
    facts.push({
      type: "intention",
      value: nextTimeMatch[2].trim(),
      source: "user_message",
    });
  }

  if (!facts.length) {
    return; // nothing worth saving this turn
  }

  await saveGuestMemory(userId, userName, facts);
}