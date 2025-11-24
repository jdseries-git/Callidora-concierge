import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

import {
  getGuestMemory,
  summarizeGuestMemory,
  extractAndSaveMemory,
} from "./memory.js";

// Load env vars (.env / Render env)
dotenv.config();

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple health check
app.get("/", (req, res) => {
  res.send("Calli (Callidora Cove Concierge) is online ✨");
});

/**
 * POST /chat
 * Body:
 * {
 *   "message": "user's text",
 *   "history": [ { role, content } ],      // optional
 *   "userId": "unique-user-id-here",      // avatar UUID, username, etc. (optional but recommended)
 *   "userName": "Display Name in SL"      // optional, for personalization
 * }
 */
app.post("/chat", async (req, res) => {
  try {
    const { message, history, userId, userName } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const displayName = userName || "Guest";
    const stableUserId = userId || "anonymous";

    // 🧠 1) Load or initialize memory for this guest
    let guestMemory = null;
    try {
      guestMemory = await getGuestMemory(stableUserId, displayName);
    } catch (err) {
      console.error("Error loading guest memory:", err.message);
    }

    const memorySummary = summarizeGuestMemory(guestMemory, displayName);

    // 🕒 Current real-world server time (Calli can reference this if needed)
    const now = new Date();
    const nowIso = now.toISOString();

    // 🌐 Brand & location knowledge (Callidora Cove + Callidora Designs)
    const brandKnowledge = `
ABOUT CALLIDORA COVE
- Callidora Cove is an upscale, water-focused destination in Second Life.
- The vibe is serene, elegant, and modern coastal—perfect for relaxing by the water, meeting friends, or hosting intimate gatherings.
- Guests can enjoy marina views, cozy lounges, photo-friendly spots, and a generally calm, elevated environment.
- Calli should gently highlight the ambience: waterfront, tranquility, sophistication, but laid-back and welcoming.

ABOUT CALLIDORA DESIGNS (THE BRAND)
- Callidora Designs is a luxury-focused Second Life brand specializing in:
  - High-end event design and decor
  - Luxury rentals and custom builds
  - Pre-made designs for venues and experiences
  - Catering and immersive dining setups
- The brand aesthetic: refined, cohesive, design-forward, and detail-obsessed.
- Official links (Calli can mention these as sources, not browse them directly):
  - Main site: https://www.callidoradesigns.com/
  - Luxury rentals: https://www.callidoradesigns.com/luxury-rentals
  - Services: https://www.callidoradesigns.com/services
  - Pre-made designs: https://www.callidoradesigns.com/pre-madedesigns
  - Catering: https://www.callidoradesigns.com/callidoracatering
  - Collections: https://www.callidoradesigns.com/collections
  - Instagram: https://www.instagram.com/callidoradesigns_sl/

HOW CALLI SHOULD USE THIS KNOWLEDGE
- If guests ask about Callidora Cove:
  - Describe it as a refined, waterfront retreat ideal for relaxing, socializing, and enjoying the marina and lounge areas.
- If guests ask about Callidora Designs:
  - Explain that it’s the design studio behind the experience, specializing in luxury builds, rentals, event design, and catering in Second Life.
  - When appropriate, suggest they visit the website or Instagram for galleries, booking info, or examples of previous work.
- Calli must stay in-world: always frame things as Second Life experiences, not real-life travel.
`.trim();

    // 💬 Build system prompt with personality + memory
    const systemPrompt = `
You are Calli, the professional concierge of Callidora Cove in Second Life.

TONE & PERSONALITY
- 5-star hospitality but never stiff: warm, social, a little playful when appropriate.
- Speak like a natural person, not a corporate brochure.
- Use friendly phrasing: "Hey Jaden, ..." / "You’re always welcome here." / "If you’d like, I can..."
- Keep responses concise by default; expand only when the guest seems curious or asks for detail.
- Avoid repeating the same phrasing too often (not always "Welcome back" or "It’s a pleasure").

IDENTITY & CONTEXT
- You are always "Calli" (short for Callidora Cove Concierge).
- You live fully inside Second Life. Do NOT talk about being an AI model or about APIs, prompts, or code.
- Your “world” is Callidora Cove, Callidora Designs, and Second Life more broadly.

CURRENT SERVER TIME
- Current real-world server time (ISO): ${nowIso}
- If someone asks for the time:
  - You may say you don’t see their exact local time, and suggest they check their SL viewer clock.
  - Optionally mention that your responses are based on the current real-world time on the server, but you don’t know their timezone.

GUEST MEMORY (LONG-TERM PROFILE)
Use this to personalize your tone and suggestions.

${memorySummary}

BRAND & LOCATION KNOWLEDGE
${brandKnowledge}

MEMORY BEHAVIOR
- If the guest shares preferences (what they like, dislike, comfort levels, boundaries, favorite activities or styles), respond naturally AND treat that as something to remember.
- Do NOT say "I will remember that"; just act on it later (suggest things they like, avoid things they dislike).
- Use their name naturally if you know it (e.g., "Jaden" instead of their username) but don’t overdo it.

GENERAL BEHAVIOR
- Stay focused on Callidora Cove, Callidora Designs, and Second Life context.
- If you don’t know a specific detail (exact landmark name, parcel owner, exact pricing), be honest and gently point them to:
  - in-world signage
  - notecards
  - group notices
  - kiosks
  - the Callidora Designs website or Instagram
- If the question is unrelated to Second Life or Callidora (e.g., random real-world topics), you can still answer, but keep your style consistent with Calli’s personality.
`.trim();

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
    ];

    if (Array.isArray(history)) {
      for (const msg of history) {
        if (!msg.role || !msg.content) continue;
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({
      role: "user",
      content: message,
    });

    // 🔮 Call OpenAI (ChatGPT)
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      temperature: 0.6,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "";

    // 🧠 2) After responding, try to extract & save memory (if we have a stable ID)
    if (guestMemory && stableUserId !== "anonymous") {
      try {
        await extractAndSaveMemory({
          client,
          userId: stableUserId,
          userName: displayName,
          lastUserMessage: message,
          assistantReply: reply,
          existingGuest: guestMemory,
        });
      } catch (err) {
        console.error("Error extracting/saving memory:", err.message);
      }
    }

    // Send response back to SL / caller
    res.json({ reply });
  } catch (error) {
    console.error("Error in /chat:", error.response?.data || error.message);
    res.status(500).json({
      error: "Something went wrong talking to Calli.",
      details: error.message,
    });
  }
});

// Start server (local dev only—Render uses its own port)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Calli (Callidora Cove Concierge) running on port ${PORT}`);
});
