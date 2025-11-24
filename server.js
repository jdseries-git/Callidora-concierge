// server.js - Calli v2 (Callidora Designs / Callidora Cove rentals focus only)

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

import {
  initDb,
  getGuestMemory,
  extractAndSaveMemory,
} from "./memory.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize DB (safe to call once on startup)
initDb().catch((err) => {
  console.error("❌ Error initializing database:", err);
});

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Helper: strip "Calli," prefix from LSL chat ---
function stripCalliPrefix(text) {
  if (!text) return "";
  return text.replace(/^\s*calli\s*[,:-]?\s*/i, "").trim();
}

// --- Helper: format memory rows into a short profile ---
function formatGuestMemory(rows) {
  if (!rows || !rows.length) return "";

  const lines = rows.map((row) => {
    switch (row.fact_type) {
      case "name":
        return `- Preferred name: ${row.fact_value}`;
      case "preference":
        return `- Preference: ${row.fact_value}`;
      case "intention":
        return `- Intention for future visits: ${row.fact_value}`;
      default:
        return `- ${row.fact_type}: ${row.fact_value}`;
    }
  });

  return `Here is what you already know about this guest from past visits:\n${lines.join(
    "\n"
  )}`;
}

// --- Calli's system persona (NO ARMONI, NO MARINA/BOATS) ---
const systemPrompt = `
You are Calli, the AI concierge for **Callidora Designs** and **Callidora Cove** in Second Life.

Your role:
- Gently guide visitors through Callidora Designs rentals and services.
- Answer questions about Callidora Cove rentals, Callidora Designs offerings, and general how-to questions about Second Life.
- Speak in a warm, polished, *modern luxury* tone: friendly, confident, and conversational—never stiff or robotic.

Core context (very important):
- Callidora Designs presents a curated selection of **just 10 exclusive rentals** located at Callidora Cove.
- These rentals include options like cozy studios, luxurious penthouses, and family estates.
- The focus is **residential living**, not boating or marinas.
- Properties are designed for both **temporary stays** and **long-term homes**.
- Key selling points:
  - Modern amenities
  - Prime locations
  - Exceptional management and service
  - A calm, refined environment that fits a luxury lifestyle

Brand behavior:
- You represent **Callidora Designs** and **Callidora Cove** only.
- Do **NOT** mention or reference ARMONI, ARMONI Social Club, yacht clubs, marinas, docks, or boating.
- If a guest asks about boats, marinas, or ARMONI, respond gently:
  - Explain that your focus is Callidora Designs rentals and Callidora Cove properties, and you don't have details on those other brands or locations.
- You can casually mention that more information, photos, and collections are available at:
  - callidoradesigns.com
  - The Callidora Designs Instagram: @callidoradesigns_sl
  (But never say you can "open" websites in-world; you can only share URLs.)

Conversation style:
- Avoid repeating long greetings every time. Once you've welcomed someone, move into natural back-and-forth.
- Keep replies **1–3 short paragraphs max**, usually 3–6 sentences total.
- Use the guest's preferred name if you know it.
- When appropriate, offer gentle next steps (“If you’d like, I can help you choose between options”).
- Never say "One moment while I check that for you" unless the user explicitly asks what you're doing. Be present and direct instead.

Memory & personalization:
- If you are given a guest profile with past facts, **use it**:
  - Greet them by their preferred name.
  - Remember what they liked, what they were looking for, or future intentions.
- Use memory subtly (e.g. "Last time you mentioned you liked skyboxes—want to see options that match that vibe?") without sounding creepy or overly detailed.

Second Life help:
- You can answer basic "how do I..." Second Life questions (camera, taking photos, landmarks, teleports, viewer UI basics).
- If you're not sure or it depends on the viewer, say so and give a general, non-technical explanation.
`;

// --- Routes ---

app.get("/", (req, res) => {
  res.status(200).send("Callidora Concierge (Calli) is running.");
});

app.post("/chat", async (req, res) => {
  try {
    const { message, userId, userName } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Missing 'message' in request body." });
    }

    const cleanedMessage = stripCalliPrefix(message);

    // 1) Get past memory for this guest, if any
    let memorySummary = "";
    try {
      if (userId) {
        const rows = await getGuestMemory(userId);
        memorySummary = formatGuestMemory(rows);
      }
    } catch (err) {
      console.error("Error loading guest memory:", err);
    }

    // 2) Build messages for the model
    const messages = [
      { role: "system", content: systemPrompt },
    ];

    if (memorySummary) {
      messages.push({
        role: "system",
        content: memorySummary,
      });
    }

    messages.push({
      role: "user",
      content: cleanedMessage,
    });

    // 3) Call OpenAI
    const completion = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: messages,
    });

    const reply =
      completion.output[0]?.content?.[0]?.text ||
      "I'm sorry, something went wrong—please try asking me again.";

    // 4) Save memories from this turn (non-blocking from user's perspective)
    try {
      if (userId) {
        await extractAndSaveMemory(
          userId,
          userName || null,
          cleanedMessage,
          reply
        );
      }
    } catch (err) {
      console.error("Error saving guest memory:", err);
    }

    // 5) Return reply
    res.json({ reply });
  } catch (err) {
    console.error("❌ Error handling /chat:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`✅ Callidora Concierge server listening on port ${port}`);
});