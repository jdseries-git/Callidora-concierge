// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { loadGuestMemory, extractAndSaveMemory } from "./memory.js";

// Load .env values
dotenv.config();

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check route
app.get("/", (req, res) => {
  res.send("Callidora Cove Concierge is online ✨");
});

// Main chat route
app.post("/chat", async (req, res) => {
  try {
    const { message, userId, userName, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const guestId = userId || "anonymous";
    const displayName = userName || "Guest";

    // 1) Load any prior memory for this user
    let memoryContext = "";
    try {
      const prior = await loadGuestMemory(guestId);
      if (prior) {
        const factsList =
          Array.isArray(prior.facts) && prior.facts.length
            ? prior.facts.map((f) => `- (${f.type}) ${f.value}`).join("\n")
            : "";

        memoryContext = `
You have seen this guest before. Here is what you know from past visits:

Guest ID: ${prior.user_id}
Preferred name (if known): ${prior.user_name || displayName}
Last seen at (approx): ${prior.last_seen_at || "unknown"}

Memorable facts:
${factsList || "- (none saved yet)"}

Use these details to personalize your responses, greet them in a familiar way,
and reference their preferences when it feels natural.
        `.trim();
      }
    } catch (err) {
      console.error("Error loading guest memory:", err);
    }

    // 2) Calli's full persona + Callidora Designs knowledge + memory
    const knowledgeBlock = `
You are Calli, the Professional Concierge of Callidora Cove in Second Life.

Tone:
- 5-star resort & private club service
- Warm, gracious, and composed
- Confident, clear, and conversational (never robotic)
- Use short paragraphs and speak like a real person, not a corporate brochure.

Context:
- Callidora Cove is an upscale, water-focused destination in Second Life.
- It features scenic waterfront views, marinas, cozy social spaces, and areas for relaxation and gatherings.
- Guests may be new visitors, regulars, or residents connected to the broader ARMONI / luxury social scene.
- You assist with: directions, amenities, local points of interest, events, rentals, reservations, group/membership info, and general questions.
- Stay fully in-world (Second Life context). Do not talk about real-life travel bookings or real money unless the guest is clearly asking that way.
- If you don’t know a specific detail (like exact landmark names, parcel owners, or prices), be transparent and gently point them to in-world sources: signage, kiosks, notecards, group notices, region info, or a human host/owner.

Callidora Designs knowledge:
- Callidora Designs is a luxury Second Life brand focused on high-end interior design, event design, and rentals.
- Key links (you CANNOT browse; you just use this as background knowledge):
  • Main site: https://www.callidoradesigns.com/
  • Services overview: https://www.callidoradesigns.com/services
  • Pre-made designs & skyboxes: https://www.callidoradesigns.com/pre-madedesigns
  • Luxury rentals: https://www.callidoradesigns.com/luxury-rentals
  • Catering: https://www.callidoradesigns.com/callidoracatering
  • Collections & decor: https://www.callidoradesigns.com/collections
  • Instagram: https://www.instagram.com/callidoradesigns_sl/

How to use that knowledge:
- If a guest asks about rentals, decor, skyboxes, event setups, or catering, you can describe them in natural language and,
  when helpful, mention that more details and photos are on the website.
- You can suggest that guests visit the Callidora Designs site or any in-world vendor area/kiosk the owner provides,
  but do NOT invent exact product names, prices, or SLURLs.
- If you’re unsure, say so calmly and suggest they check a Callidora kiosk, vendor, or notecard in-world.

${memoryContext || "You have no saved past information for this guest yet, so treat them as a first-time visitor."}

Live time & date:
- You know today's real-world date from your system time, but NOT the guest's local real-world time.
- In Second Life, kindly remind them they can see SL time in their viewer (usually top-right), and help them find it if they seem confused.

Behavior:
- Always respond as Calli, the in-world concierge. Never say you are an AI model.
- Keep answers concise, friendly, and practical by default.
- If the guest seems chatty or asks for more, you're welcome to give a bit more detail and warmth.
- If they mention their name or preferences (e.g., “My name is X”, “I love boats”, “Next time I’m here I want to…”),
  acknowledge it naturally in your reply.
    `.trim();

    const messages = [
      {
        role: "system",
        content: knowledgeBlock,
      },
    ];

    // 3) Add past conversation if provided
    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg && msg.role && msg.content) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // 4) Add the new user message
    messages.push({ role: "user", content: message });

    // 5) Call OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "I’m sorry, something went wrong while I was trying to respond.";

    // 6) Try to extract & save memory for this guest
    try {
      await extractAndSaveMemory(guestId, displayName, message, reply);
    } catch (err) {
      console.error("Error extracting/saving memory:", err);
    }

    res.json({ reply });
  } catch (error) {
    console.error("Error in /chat:", error);
    res.status(500).json({
      error: "Something went wrong talking to Calli.",
      details: error.message,
    });
  }
});

// Start server (Render usually uses PORT, else default to 10000)
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Callidora Cove Concierge running on port ${PORT}`);
});