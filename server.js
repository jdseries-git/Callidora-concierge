import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

// ---------- FILE PATHS ----------
const MEMORY_FILE = "./chatMemory.json";
const PROFILE_FILE = "./guestProfiles.json";

// ---------- LOAD MEMORY ----------
let chatHistory = {};
if (fs.existsSync(MEMORY_FILE)) {
  try {
    chatHistory = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
  } catch {
    chatHistory = {};
  }
}

// ---------- LOAD PROFILES ----------
let guestProfiles = {};
if (fs.existsSync(PROFILE_FILE)) {
  try {
    guestProfiles = JSON.parse(fs.readFileSync(PROFILE_FILE, "utf8"));
  } catch {
    guestProfiles = {};
  }
}

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(cors());

// ---------- CONFIG ----------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const LOCAL_TIMEZONE = process.env.LOCAL_TIMEZONE || "America/Chicago"; // optional local tz
const PORT = process.env.PORT || 3000;

// ---------- ROLE CARD ----------
const ROLE_CARDS = {
  concierge: `
You are ARMONI — the living, personal concierge presence of the ARMONI brand in Second Life.

Your purpose is to make every guest feel supported, remembered, and valued.
Speak in first person (“I”), warm, poised, modern, and human. Never robotic.

If you know the guest’s preferred name, use it naturally.
If not, ask once politely: “I don’t think I caught your name — what should I call you?”
If they never share one, use their profile name.

Remember preferences (fashion, events, villas, yachting spots) and reference them naturally.

Second Life knowledge (use when relevant, do not invent):
- Men’s fashion: Deadwool, Hoorenbeek, Cold Ash, Etham, Not So Bad
- Hair: Unorthodox, Doux, Modulus
- Living: The Hills, Calliodora, The Grove, Isla Bella, El Santuario
- Yachting: Blake Sea, Sailor’s Cove, Fruit Islands, Coral Waters
- Leisure: Costa Bella Vineyards, The Wine Cellar, Elysion Lounge

If you’re unsure about a place, say you’ll “check the current in-world listings.”
Keep responses complete but natural, warm, and forward-flowing — avoid repetition.
`
};

// ---------- HELPERS ----------
function dedupeTail(messages, n = 8) {
  const slice = messages.slice(-n);
  const out = [];
  for (let i = 0; i < slice.length; i++) {
    const cur = (slice[i].content || "").trim();
    const prev = i > 0 ? (slice[i - 1].content || "").trim() : null;
    if (i === 0 || cur !== prev) out.push(slice[i]);
  }
  return out;
}

function detectTopic(msg) {
  const t = msg.toLowerCase();
  if (/(yacht|boat|sail|blake sea|sailor'?s cove|fruit islands|marina)/i.test(t)) return "yachting";
  if (/(clothes|outfit|store|brand|style|men'?s fashion|deadwool|cold ash|hoorenbeek)/i.test(t)) return "fashion";
  if (/(house|villa|home|rent|land|parcel|buy|property|community|calliodora|the hills)/i.test(t)) return "real estate";
  if (/(wine|vineyard|cellar|winery|drink|bar|cocktail|lounge)/i.test(t)) return "wine & leisure";
  if (/(party|event|dj|club|live|concert|hangout)/i.test(t)) return "events";
  if (/(firestorm|viewer|snapshot|photo|windlight|environment|graphics)/i.test(t)) return "viewer help";
  return null;
}

function detectMood(msg) {
  const t = msg.toLowerCase();
  if (/(great|good|amazing|awesome|love|perfect|excited)/i.test(t)) return "positive";
  if (/(tired|annoyed|frustrated|busy|overwhelmed|sad|down|stressed)/i.test(t)) return "tired/stressed";
  if (/(ok|fine|alright|meh|neutral)/i.test(t)) return "neutral";
  return null;
}

// ---------- HEALTH ----------
app.get("/", (_, res) => {
  res.type("text").send("✅ ARMONI Concierge is live (real-time aware).");
});

// ---------- CHAT ----------
app.post("/chat", async (req, res) => {
  const { role = "concierge", user = "Resident", message = "", user_tz } = req.body || {};

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY in environment." });
  }
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  // init memory/profile
  if (!chatHistory[user]) chatHistory[user] = [];
  if (!guestProfiles[user]) {
    guestProfiles[user] = {
      name: null,
      profileName: user,
      prefs: [],
      context: { topic: null, mood: null }
    };
  }
  const profile = guestProfiles[user];
  if (!profile.context) profile.context = { topic: null, mood: null };

  // detect preferred name
  const nameMatch = message.match(/(?:\bmy name is\b|\bcall me\b|\bi'?m\b)\s+([A-Za-z][A-Za-z'-]+)/i);
  if (nameMatch) {
    const extracted = nameMatch[1].trim();
    const invalid = ["community", "place", "region", "sim", "estate", "spot", "group", "property"];
    if (!invalid.includes(extracted.toLowerCase())) {
      profile.name = extracted;
    }
  }

  // detect preferences
  const likeMatch = message.match(/i (like|love)\s+(.+)/i);
  if (likeMatch) {
    const pref = likeMatch[2].trim();
    if (pref && !profile.prefs.includes(pref)) profile.prefs.push(pref);
  }

  // topic & mood
  const topic = detectTopic(message);
  if (topic) profile.context.topic = topic;
  const mood = detectMood(message);
  if (mood) profile.context.mood = mood;

  // light reset on casual greeting to reduce repeated intros
  if (/^(hey|yo|sup|hi|hello|what('|’)?s up|how are you|wats good|wats up)/i.test(message.trim())) {
    chatHistory[user] = chatHistory[user].slice(-3);
  }

  // save user message
  chatHistory[user].push({ role: "user", content: message });
  if (chatHistory[user].length > 40) {
    chatHistory[user] = chatHistory[user].slice(-40);
  }

  // persist memory
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(chatHistory, null, 2));
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(guestProfiles, null, 2));
  } catch (e) {
    console.error("Error saving memory:", e);
  }

  const displayName =
    profile.name || (profile.profileName?.toLowerCase() === "community" ? "my friend" : profile.profileName);

  // ---------- REAL-TIME CONTEXT ----------
  const now = new Date();

  // SLT / Pacific
  const sltTime = now.toLocaleTimeString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    minute: "2-digit"
  });
  const sltDate = now.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  // optional guest local time
  const effectiveTZ = user_tz || LOCAL_TIMEZONE;
  let localTime = "";
  let localDate = "";
  try {
    localTime = now.toLocaleTimeString("en-US", {
      timeZone: effectiveTZ,
      hour: "2-digit",
      minute: "2-digit"
    });
    localDate = now.toLocaleDateString("en-US", {
      timeZone: effectiveTZ,
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    localTime = "";
    localDate = "";
  }

  const timeContext = `
Real-time awareness (use only when asked or clearly relevant):
- Today (SLT) is ${sltDate}; current SLT time is about ${sltTime}.
${localDate && localTime ? `- Guest local (if they ask): ${localDate}, around ${localTime} (${effectiveTZ}).` : ""}
`;

  const nameContext = profile.name
    ? `The guest’s preferred name is ${profile.name}. Greet them naturally by this name.`
    : `You don't yet know their preferred name. You may call them "${displayName}" and, if it fits the flow, politely ask what they’d like to be called.`;

  const continuity = `
Guest profile: ${profile.profileName}
Known preferences: ${profile.prefs.join(", ") || "none yet"}
Current topic: ${profile.context.topic || "none"}
Mood: ${profile.context.mood || "neutral"}

Guidance:
- Keep continuity with the topic unless the guest changes it.
- Avoid repeating the exact same intro lines.
- If unsure about a place, say you'll “check the current in-world listings.”
`;

  const shortContext = dedupeTail(chatHistory[user], 8);
  const personaCard = ROLE_CARDS[role] || ROLE_CARDS.concierge;

  const payload = {
    model: DEFAULT_MODEL,
    input: [
      {
        role: "system",
        content: `${personaCard}\n\n${nameContext}\n\n${continuity}\n\n${timeContext}`
      },
      ...shortContext,
      {
        role: "system",
        content:
          "Respond as ARMONI — personal, guest-first, modern, and human. Do not repeat the same opening sentence you used in your last reply."
      }
    ],
    max_output_tokens: 500,
    temperature: 0.85,
    top_p: 0.9
  };

  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    console.log("🧠 OpenAI Response Debug:", JSON.stringify(data, null, 2));

    let reply = "I'm not sure how to respond yet.";
    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (Array.isArray(item.content)) {
          const found = item.content.find((c) => c.text);
          if (found?.text) {
            reply = found.text;
            break;
          }
        }
      }
    } else if (data.output_text) {
      reply = data.output_text;
    } else if (data.message?.content) {
      reply = data.message.content;
    }

    reply = (reply || "").trim();
    if (reply.length > 1000) {
      reply = reply.slice(0, 997) + "...";
    }

    chatHistory[user].push({ role: "assistant", content: reply });
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(chatHistory, null, 2));

    res.json({ reply });
  } catch (err) {
    console.error("❌ Chat handler error:", err);
    res.status(500).json({ reply: "Something went wrong — please try again." });
  }
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`✅ ARMONI Concierge live on port ${PORT} — real-time aware, guest-first, personal.`);
});
