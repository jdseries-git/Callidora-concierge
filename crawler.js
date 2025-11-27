import fs from "fs";

const OUTPUT_FILE = "./urlKnowledge.json";

// You can change these if you want to crawl other domains later.
const START_URLS = [
  "https://www.callidoradesigns.com/",
  "https://www.callidoradesigns.com/services",
  "https://www.callidoradesigns.com/luxury-rentals",
  "https://www.callidoradesigns.com/pre-madedesigns",
  "https://www.callidoradesigns.com/callidoracatering",
  "https://www.callidoradesigns.com/collections",
  "https://www.callidoradesigns.com/portfolio"
];

async function fetchText(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`  ❌ Failed: ${url} (status ${res.status})`);
      return null;
    }
    let text = await res.text();
    text = text.replace(/\s+/g, " ");
    if (text.length > 12000) text = text.slice(0, 12000);
    console.log(`  ✅ Captured text from ${url} (length: ${text.length})`);
    return text;
  } catch (err) {
    console.log(`  ❌ Error fetching ${url}:`, err.message);
    return null;
  }
}

async function run() {
  console.log("🕸️  Starting crawl...");
  const docs = [];

  for (const url of START_URLS) {
    console.log(`➡️  Fetching: ${url}`);
    const content = await fetchText(url);
    if (!content) continue;

    docs.push({
      url,
      domain: new URL(url).hostname,
      content,
      lastSeen: new Date().toISOString()
    });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(docs, null, 2));
  console.log(`\n📦 Crawl finished. Collected ${docs.length} pages.`);
  console.log(`💾 Saved into ${OUTPUT_FILE}`);
}

run().catch((err) => {
  console.error("Crawler crashed:", err);
  process.exit(1);
});