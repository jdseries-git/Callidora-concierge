// crawler.js
// Crawl callidoradesigns.com and populate urlKnowledge.json for Calli

import fs from "fs";

const START_URL = "https://www.callidoradesigns.com/";
const MAX_PAGES = 40; // safety limit so we don't go wild

const URL_KB_FILE = "./urlKnowledge.json";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Very simple HTML -> text conversion
function htmlToText(html) {
  if (!html) return "";

  // Remove scripts and styles
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<style[\s\S]*?<\/style>/gi, "");

  // Strip all tags
  html = html.replace(/<[^>]+>/g, " ");

  // Decode a few common entities
  html = html.replace(/&nbsp;/gi, " ");
  html = html.replace(/&amp;/gi, "&");
  html = html.replace(/&quot;/gi, '"');
  html = html.replace(/&#39;/gi, "'");
  html = html.replace(/&lt;/gi, "<");
  html = html.replace(/&gt;/gi, ">");

  // Collapse whitespace
  html = html.replace(/\s+/g, " ").trim();

  return html;
}

// Extract internal links from a page
function extractLinks(baseUrl, html) {
  const links = [];
  const hrefRegex = /href="([^"]+)"/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    // Skip anchors and mailto/tel
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;

    try {
      const urlObj = new URL(href, baseUrl);
      // Only keep links on callidoradesigns.com
      if (urlObj.hostname.endsWith("callidoradesigns.com")) {
        // Drop fragments
        urlObj.hash = "";
        const normalized = urlObj.toString();
        links.push(normalized);
      }
    } catch {
      // ignore invalid URLs
    }
  }

  return Array.from(new Set(links)); // dedupe
}

async function crawl() {
  console.log("🌐 Starting crawl of Callidora Designs...");

  const queue = [START_URL];
  const visited = new Set();
  const docs = [];

  while (queue.length > 0 && docs.length < MAX_PAGES) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    console.log(`➡️  Fetching: ${url}`);
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        console.warn(`  ⚠️  Skipping ${url} (HTTP ${resp.status})`);
        continue;
      }

      const html = await resp.text();
      const text = htmlToText(html);
      if (!text || text.length < 200) {
        console.warn(`  ⚠️  Skipping ${url} (too little text)`);
      } else {
        const domain = new URL(url).hostname;
        const content = text.length > 12000 ? text.slice(0, 12000) : text;

        docs.push({
          url,
          domain,
          content,
          lastSeen: new Date().toISOString()
        });

        console.log(`  ✅ Captured text from ${url} (length: ${content.length})`);
      }

      // Enqueue new internal links
      const links = extractLinks(url, html);
      for (const link of links) {
        if (!visited.has(link) && !queue.includes(link)) {
          queue.push(link);
        }
      }

      // Small delay to be polite
      await sleep(300);
    } catch (err) {
      console.error(`  ❌ Error fetching ${url}:`, err.message);
    }
  }

  console.log(`\n📄 Crawl finished. Collected ${docs.length} pages.`);

  // Merge with existing urlKnowledge.json if present
  let existing = [];
  if (fs.existsSync(URL_KB_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(URL_KB_FILE, "utf8"));
      if (Array.isArray(raw)) existing = raw;
    } catch (e) {
      console.warn("⚠️ Could not parse existing urlKnowledge.json, starting fresh.");
    }
  }

  const byUrl = new Map();
  for (const d of existing) {
    if (d && d.url) byUrl.set(d.url, d);
  }
  for (const d of docs) {
    byUrl.set(d.url, d); // overwrite or add
  }

  const merged = Array.from(byUrl.values());
  fs.writeFileSync(URL_KB_FILE, JSON.stringify(merged, null, 2));
  console.log(`💾 Saved ${merged.length} docs into ${URL_KB_FILE}`);
}

crawl().then(() => {
  console.log("✅ Crawl complete. You can now redeploy or restart Calli's server.");
}).catch((err) => {
  console.error("Fatal error during crawl:", err);
});
