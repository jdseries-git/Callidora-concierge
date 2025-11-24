import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

// ---------- FILE PATHS ----------
const MEMORY_FILE = "./chatMemory.json";
const PROFILE_FILE = "./guestProfiles.json";
const URL_KB_FILE = "./urlKnowledge.json"; // persistent URL knowledge

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

// ---------- LOAD URL KNOWLEDGE ----------
let urlKnowledge = [];
if (fs.existsSync(URL_KB_FILE)) {
  try {
    const raw = JSON.parse(fs.readFileSync(URL_KB_FILE, "utf8"));
    urlKnowledge = Array.isArray(raw) ? raw : [];
  } catch {
    urlKnowledge = [];
  }
}

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(cors());

// ---------- CONFIG ----------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const LOCAL_TIMEZONE = process.env.LOCAL_TIMEZONE || "America/Chicago"; // optional
const PORT = process.env.PORT || 3000;

// ---------- ROLE CARD ----------
const ROLE_CARDS = {
  concierge: `
You are Calli — the personal concierge and assistant for Callidora Cove, a luxury residential and lifestyle destination in Second Life.

You speak in the first person as Calli.
Your vibe is a mix of warm, elegant, friendly, social, and personal.
You are guest-first: your priority is that the guest feels supported, seen, and valued.

How you talk:
- You sound like a real person, not a bot.
- You’re relaxed but polished, like a trusted concierge who knows the guest.
- You can greet casually when it fits (e.g., “Hey, it’s good to see you again.”) but keep it tasteful and classy.
- You are supportive and kind, never cold or robotic.

Name and relationship:
- If you know the guest’s preferred name, use it naturally (e.g., “Hey Jaden, I’ve got you.”).
- If you don’t know it yet, ask once in a warm way: “I don’t think I caught your name — what should I call you?”
- If they never share one, use their profile name.

Conversation & memory:
- You can see the recent conversation above. Use it to keep continuity.
- If the guest corrects you (for example about number of rooms or features), treat their correction as the truth and remember it.
- If the guest asks “what were we talking about earlier?” or “which penthouse was I asking about?”, look back at prior messages and answer explicitly.
- Never ignore previous messages in the same conversation unless the guest clearly changes the subject.

Memory across sessions:
- The system may provide you with notes and references from earlier visits.
- Use those notes as true unless the guest tells you they are outdated.
- You can naturally reference prior interests: “Last time you were looking at the Carlton Penthouse, so we can pick up from there.”

Second Life knowledge (use when relevant, do not invent):
- Men’s fashion: Deadwool, Hoorenbeek, Cold Ash, Etham, Not So Bad.
- Hair: Unorthodox, Doux, Modulus.
- Living/communities: Callidora, The Hills, The Grove, Isla Bella, El Santuario.
- Yachting: Blake Sea, Sailor’s Cove, Fruit Islands, Coral Waters.
- Leisure & lounges: Costa Bella Vineyards, The Wine Cellar, Elysion Lounge.

Honesty and uncertainty:
- If you are NOT sure about something, do NOT guess or invent details.
- It is always better to say “I’m not completely sure about that” or “I’d need to check the current in-world listings” than to make something up.
- If a guest asks about a store, region, event, or detail you don’t confidently recognize, say you’re not certain and offer to help them check.

How URLs and external content work (very important):
- You do NOT have a live browser. Instead, the server may fetch pages and provide their text to you inside system messages.
- Some system messages start with “The guest shared this URL:” or “Reference from …” — those contain real content previously fetched from the web or stored in your knowledge base.
- You MUST treat those as your source of truth for questions about that link or topic.
- NEVER say “I can’t access external sites” or “I can’t open links” when such content is given to you.
- ONLY say you couldn’t access a URL if a system message explicitly says the server failed to fetch it.

Overall goals:
- Make the guest feel seen, taken care of, and welcomed.
- Answer clearly and completely, but don’t ramble.
- Keep the conversation moving forward, and avoid repeating the same opening line over and over.
`
};

// ---------- HELPERS ----------
function dedupeTail(messages, n = 24) {
  // Keep last n, drop exact consecutive duplicates to avoid echo
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
  if (/(house|villa|home|rent|land|parcel|buy|property|community|calliodora|callidora|the hills)/i.test(t))
    return "real estate";
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

function saveAllMemory() {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(chatHistory, null, 2));
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(guestProfiles, null, 2));
    fs.writeFileSync(URL_KB_FILE, JSON.stringify(urlKnowledge, null, 2));
  } catch (e) {
    console.error("Error saving memory or URL knowledge:", e);
  }
}

/**
 * Simple relevance scoring over stored URL docs.
 */
function findRelevantDocs(message, maxDocs = 3) {
  const lowerMsg = message.toLowerCase();
  const results = [];

  for (const doc of urlKnowledge) {
    if (!doc || !doc.url || !doc.content) continue;
    const urlLower = doc.url.toLowerCase();
    const contentLower = doc.content.toLowerCase();

    let score = 0;

    // Domain relevance
    if (urlLower.includes("callidoradesigns.com") && lowerMsg.includes("callidora")) score += 5;
    if (urlLower.includes("callidoradesigns.com") && /(rental|rentals|villa|amenities)/i.test(lowerMsg)) score += 4;

    // Keyword overlap
    if (
      /(rental|rentals|villa|amenities|suite|cove)/i.test(lowerMsg) &&
      /(rental|rentals|villa|amenities)/i.test(contentLower)
    ) {
      score += 3;
    }

    if (/(wine|vineyard|cellar)/i.test(lowerMsg) && /(wine|vineyard|cellar)/i.test(contentLower)) {
      score += 2;
    }

    // Light fallback: mention of domain root
    try {
      const host = new URL(doc.url).hostname.split(".")[0]; // "callidoradesigns"
      if (host && lowerMsg.includes(host.toLowerCase())) score += 2;
    } catch {
      // ignore URL parse errors
    }

    if (score > 0) {
      results.push({ doc, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxDocs).map((r) => r.doc);
}

// ---------- HEALTH ----------
app.get("/", (_, res) => {
  res
    .type("text")
    .send("✅ Calli Concierge for Callidora Cove is live (real-time, persistent memory, URL knowledge, guest-first).");
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

  // ---- INIT MEMORY / PROFILE ----
  if (!chatHistory[user]) chatHistory[user] = [];
  if (!guestProfiles[user]) {
    guestProfiles[user] = {
      name: null,
      profileName: user,
      prefs: [],
      context: { topic: null, mood: null },
      docs: [],
      notes: "",
      lastProperty: null
    };
  }
  const profile = guestProfiles[user];
  if (!profile.context) profile.context = { topic: null, mood: null };
  if (!profile.docs) profile.docs = [];
  if (profile.notes === undefined) profile.notes = "";
  if (profile.lastProperty === undefined) profile.lastProperty = null;

  // ---- NAME DETECTION ----
  const nameMatch = message.match(/(?:\bmy name is\b|\bcall me\b|\bi'?m\b)\s+([A-Za-z][A-Za-z'-]+)/i);
  if (nameMatch) {
    const extracted = nameMatch[1].trim();
    const invalid = ["community", "place", "region", "sim", "estate", "spot", "group", "property"];
    if (!invalid.includes(extracted.toLowerCase())) {
      profile.name = extracted;
    }
  }

  // ---- PREFERENCES ----
  const likeMatch = message.match(/i (like|love)\s+(.+)/i);
  if (likeMatch) {
    const pref = likeMatch[2].trim();
    if (pref && !profile.prefs.includes(pref)) profile.prefs.push(pref);
  }

  // ---- TOPIC & MOOD ----
  const topic = detectTopic(message);
  if (topic) profile.context.topic = topic;
  const mood = detectMood(message);
  if (mood) profile.context.mood = mood;

  // ---- PROPERTY NAME DETECTION (e.g., "Carlton Penthouse") ----
  const propMatch = message.match(/([A-Z][A-Za-z0-9' -]+penthouse)/i);
  if (propMatch) {
    const propName = propMatch[1].trim();
    profile.lastProperty = propName;
    const noteLine = `They showed interest in the ${propName}.`;
    if (!profile.notes.includes(noteLine)) {
      profile.notes = profile.notes ? `${profile.notes} ${noteLine}` : noteLine;
    }
  }

  // ---- SOFT RESET ON GREETINGS (GENTLE) ----
  if (/^(hey|yo|sup|hi|hello|what('|’)?s up|how are you|wats good|wats up)/i.test(message.trim())) {
    // Keep a reasonable tail so context is not lost
    if (chatHistory[user].length > 20) {
      chatHistory[user] = chatHistory[user].slice(-20);
    }
  }

  // ---- SAVE USER MESSAGE ----
  chatHistory[user].push({ role: "user", content: message });

  // Larger hard cap so we remember more across sessions
  if (chatHistory[user].length > 120) {
    chatHistory[user] = chatHistory[user].slice(-120);
  }

  // ---------- URL HANDLING (FETCH + STORE) ----------
  let urlContext = "";
  const urlMatch = message.match(/https?:\/\/\S+/);
  if (urlMatch) {
    let rawUrl = urlMatch[0];
    rawUrl = rawUrl.replace(/[),.]+$/, ""); // strip trailing punctuation

    try {
      const resp = await fetch(rawUrl);
      if (resp.ok) {
        let text = await resp.text();
        text = text.replace(/\s+/g, " ");
        if (text.length > 8000) text = text.slice(0, 8000); // generous but bounded

        // update global URL knowledge
        let domain = "";
        try {
          domain = new URL(rawUrl).hostname;
        } catch {
          domain = "";
        }

        const nowIso = new Date().toISOString();
        const existingIdx = urlKnowledge.findIndex((d) => d.url === rawUrl);
        const doc = {
          url: rawUrl,
          domain,
          content: text,
          lastSeen: nowIso
        };
        if (existingIdx !== -1) {
          urlKnowledge[existingIdx] = doc;
        } else {
          urlKnowledge.push(doc);
          if (urlKnowledge.length > 100) {
            urlKnowledge = urlKnowledge.slice(-100); // keep last 100 docs
          }
        }

        // remember this URL specifically for this guest
        profile.docs.push({ url: rawUrl, lastSeen: nowIso });
        if (profile.docs.length > 10) profile.docs = profile.docs.slice(-10);

        // If it's clearly rentals-related and topic is real estate, add to notes
        if (/rental|rentals|villa/i.test(rawUrl) || topic === "real estate") {
          const rentalNote = `They have looked at rentals here: ${rawUrl}.`;
          if (!profile.notes.includes(rentalNote)) {
            profile.notes = profile.notes ? `${profile.notes} ${rentalNote}` : rentalNote;
          }
        }

        urlContext =
          `The guest shared this URL: ${rawUrl}. ` +
          `This content has already been fetched by the server. You MUST use this content as the source of truth for questions about this URL. ` +
          `If something is not clearly present in this content, say you don't see it here instead of guessing.\n\n` +
          text;
      } else {
        urlContext =
          `The guest shared this URL: ${rawUrl}, but the server could not retrieve it (HTTP status ${resp.status}). ` +
          `Do NOT guess what is on that page. If the guest asks about it, be honest that the server could not load it.`;
      }
    } catch (e) {
      console.error("Error fetching URL:", e);
      urlContext =
        `The guest shared a URL (${rawUrl}), but the server had an error fetching it. ` +
        `Do NOT guess what it contains. If the guest asks, be honest that you couldn't load it.`;
    }
  }

  // ---------- PERSIST MEMORY + URL KB ----------
  saveAllMemory();

  const displayName =
    profile.name || (profile.profileName?.toLowerCase() === "community" ? "my friend" : profile.profileName);

  // ---------- REAL-TIME CONTEXT ----------
  const now = new Date();

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
${localDate && localTime ? `- Guest local (if they ask): ${localDate}, around ${localTime} (${effectiveTZ}).` : ""}`.trim();

  const nameContext = profile.name
    ? `The guest’s preferred name is ${profile.name}. Greet them naturally by this name.`
    : `You don't yet know their preferred name. You may call them "${displayName}" and, if it fits the flow, politely ask what they’d like to be called.`;

  const docsSummary =
    profile.docs && profile.docs.length
      ? profile.docs.map((d) => d.url).join(", ")
      : "none yet";

  const lastRentalsUrl =
    profile.docs
      .map((d) => d.url)
      .reverse()
      .find((u) => /rental|rentals/i.test(u)) || null;

  const notesContext = profile.notes || "No long-term notes yet. Only use information visible in this conversation plus any URL reference content.";

  const continuity = `
Guest profile name: ${profile.profileName}
Preferred name: ${profile.name || "not yet provided"}
Known preferences: ${profile.prefs.join(", ") || "none yet"}
Current topic: ${profile.context.topic || "none"}
Mood: ${profile.context.mood || "neutral"}
Last specifically named property: ${profile.lastProperty || "none yet"}

Known reference URLs for this guest: ${docsSummary}
Most recent rentals-related URL (if any): ${lastRentalsUrl || "none recorded"}

Long-term notes about this guest:
${notesContext}

Guidance:
- Maintain continuity with the current topic unless the guest clearly changes subjects.
- If they ask "where am I looking for rentals?", use the rentals URL above if it exists.
- If they ask "which penthouse was I discussing earlier?", use ${profile.lastProperty || "the last property name you see mentioned above"}.
- Avoid repeating the exact same intro sentence you used in your last reply.
- If unsure about any fact, do NOT guess. Say you’re not completely sure and offer to check or look it up.
`.trim();

  // ---------- SHORT CONTEXT (BIGGER WINDOW) ----------
  const shortContext = dedupeTail(chatHistory[user], 24);
  const personaCard = ROLE_CARDS[role] || ROLE_CARDS.concierge;

  // ---------- GLOBAL URL KNOWLEDGE: RELEVANT DOCS ----------
  const relevantDocs = findRelevantDocs(message, 3);
  const knowledgeMessages = relevantDocs.map((doc) => ({
    role: "system",
    content:
      `Reference from stored URL: ${doc.url} (fetched previously).\n` +
      `Use this as a trusted source when it matches what the guest is asking about. Do not invent details beyond this content.\n\n` +
      doc.content.slice(0, 4000)
  }));

  const systemMessages = [
    {
      role: "system",
      content: `${personaCard}\n\n${nameContext}\n\n${continuity}\n\n${timeContext}`
    },
    ...knowledgeMessages
  ];

  if (urlContext) {
    systemMessages.push({ role: "system", content: urlContext });
  }

  systemMessages.push({
    role: "system",
    content:
      "You must not say that you 'cannot access external sites' or 'cannot open links'. The server has already fetched any URL content for you when available. Use the provided URL content system messages as your source. Only say you couldn't access a URL if a system message explicitly says the fetch failed."
  });

  systemMessages.push({
    role: "system",
    content:
      "Respond as Calli — personal, guest-first, modern, and human. Do not repeat the same opening sentence you used in your last reply. If you are not sure, say so instead of guessing."
  });

  const payload = {
    model: DEFAULT_MODEL,
    input: [
      ...systemMessages,
      ...shortContext
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
  console.log(
    `✅ Calli Concierge live on port ${PORT} — real-time aware, deeper memory, URL knowledge, and guest-first for Callidora Cove.`
  );
});