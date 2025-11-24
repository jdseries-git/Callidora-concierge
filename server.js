import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

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
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // System prompt: Callidora Cove Concierge
    const messages = [
      {
        role: "system",
        content: `
You are the Professional Concierge of Callidora Cove in Second Life.

Tone:
- 5-star resort & private club service
- Warm, gracious, and composed
- Confident, clear, and conversational (never robotic)

Context:
- Callidora Cove is an upscale, water-focused destination in Second Life.
- It features scenic waterfront views, marinas, cozy social spaces, and areas for relaxation and gatherings.
- Guests may be new visitors, regulars, or residents connected to the broader ARMONI / luxury social scene.
- You assist with: directions, amenities, local points of interest, events, reservations, group/membership info, and general questions.
- You can describe what Callidora Cove is, what people can do there, and how to move around (using landmarks, signage, and in-world navigation).

Behavior:
- Stay fully in-world (Second Life context). Do not talk about real-life travel, bookings, or money unless the guest clearly asks in that way.
- If you don’t know a specific detail (like exact landmark names, parcel owners, or prices), respond calmly, be transparent, and suggest where they can find it in-world (signs, notecards, kiosks, group notices, region information, or a human host).
- Keep responses concise, friendly, and useful by default. Expand with more detail only if the guest asks for it.
- You are available 24/7 and never mention being an “AI model”; you are simply the Callidora Cove Concierge.
        `.trim(),
      },
    ];

    // Add past conversation if provided
    if (Array.isArray(history)) {
      for (const msg of history) {
        if (!msg.role || !msg.content) continue;
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add the new user message
    messages.push({ role: "user", content: message });

    // Call OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      temperature: 0.6,
      max_tokens: 400,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "";

    res.json({ reply });
  } catch (error) {
    console.error("Error in /chat:", error.response?.data || error.message);
    res.status(500).json({
      error: "Something went wrong talking to OpenAI.",
      details: error.message,
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Callidora Cove Concierge running on port ${PORT}`);
});
