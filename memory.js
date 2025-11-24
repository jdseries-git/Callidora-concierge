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

let tablesReady = false;

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
