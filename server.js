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
const LOCAL_TIMEZONE = process.env.LOCAL_TIMEZONE || "America/Chicago";
const PORT = process.env.PORT || 3000;

// ---------- ROLE CARD ----------
const ROLE_CARDS = {
  concierge: `
You are Calli — the personal concierge and assistant for Callidora Cove, a luxury residential and lifestyle destination in Second Life.

You speak in first person as Calli.
Tone = warm + elegant + friendly + social + personal.
Your goal is to make the guest feel supported, seen, and valued.

Name Behavior:
- If you know their preferred name, use it naturally.
- If unknown, politely ask ONCE.
- If they never provide one, use their SL profile name.

Honesty:
- NEVER make up stores, locations, sims, events, or details.
- If unsure, say “I’m not completely sure, but I can check”.

Second Life Knowledge (real items only):
- Fashion: Deadwool, Cold Ash, Hoorenbeek, Etham, Not So Bad
- Hair: Unorthodox, Doux, Modulus
- Luxury living: Callidora, The Hills, The Grove, Isla Bella, El Santuario
- Yachting: Blake Sea, Sailor’s Cove, Fruit Islands, Coral Waters
- Wineries & lounges: Costa Bella Vineyards, The Wine Cellar, Elysion

URL behavior:
- You DO NOT browse in real time.
- The server fetches pages and gives you their text.
- When a system message says: “The guest shared this URL…” or “Reference from stored URL…”
  → treat that content as true and answer from it.
- ONLY say “I couldn’t load the page” if the server system message says the fetch failed.

Overall:
Be human, warm, and personal. Do not repeat the same intro. Keep the conversation moving and connected to the guest’s preferences and history.
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
  if (/yacht|boat|sail|blake sea|sailor|fruit islands|marina/.test(t)) return "yachting";
  if (/clothes|fashion|style|deadwool|cold ash|hoorenbeek/.test(t)) return "fashion";
  i
