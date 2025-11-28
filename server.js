// server.js
import express from "express";
import fetch from "node-fetch"; // npm install node-fetch

const app = express();
app.use(express.json());

// -------------- OpenAI key from ENV ONLY --------------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not set in environment variables.");
  process.exit(1);
}

// -------------- Callidora Knowledge (INLINE) --------------
// This is where Calli's "brain" about Callidora lives.
// I've included the specific blocks you said you couldn't see.
const CALLIDORA_KNOWLEDGE = `
=== Mission + About ===
At Callidora Designs, we believe in the transformative power of design to elevate spaces and enrich our virtual lives. With a passion for innovation and an unwavering commitment to quality, we bring unparalleled expertise and creativity to every project. Whether it's terraforming outdoor landscapes or crafting interior sanctuaries, we are dedicated to creating virtual environments that inspire, rejuvenate, and reflect the unique essence of each client, infusing each design with personality, style, and functionality.

Callidora Designs Instagram:
@callidoradesigns_sl

In-World Link to the Agency:
https://maps.secondlife.com/secondlife/Callidora%20Cove/135/251/30

Callidora Designs Website:
https://www.callidoradesigns.com/

=== Callidora Designs Services ===
Welcome to Callidora Designs, where we specialize in transforming virtual spaces into stunning environments that harmonize with nature and elevate interior living. Our comprehensive services cater to both outdoor landscapes and indoor spaces, ensuring a seamless transition from the exterior to the interior.

List of services:
- Landscaping
- Interior Design
- Events
- Pre-Made Designs

Get a Quote:
To get a project quote, message "willahmina" in-world.

=== Callidora Cove Luxury Rentals ===
Callidora Designs presents a curated selection of just 10 exclusive rentals located at Callidora Cove. Discover our unique portfolio, thoughtfully crafted to match your luxury lifestyle. Whether you’re seeking a cozy studio, a luxurious penthouse, or a family estate, we offer options designed to suit your needs.

Whether you're searching for a temporary residence or a long-term home, our properties feature modern amenities, prime locations, and exceptional management services. Browse our listings to find your perfect rental match and embark on your next chapter with ease.

Luxury Rentals Website:
https://www.callidoradesigns.com/luxury-rentals

=== Callidora Cove Amenities ===
Britz Hotel:
- Perfect blend of relaxation and entertainment.
- Breakfast buffet.
- Two sparkling pools.
- Fully equipped gym.
- AFK lounge.
- Arcade for friendly competition.
- Rooftop with stunning views and chic atmosphere.

Grind Coffee House & Eatery:
- Go-to spot for fresh brews and a cozy atmosphere.
- Great for mornings or mid-day pick-me-ups.
- Pastries and light bites.
- Warm, inviting space for conversation or focus.
- Mystory compatible.

Elevé Art Collective:
- Curated hub for creativity.
- Contemporary paintings, sculptures, digital art, and installations.
- Exhibitions and exclusive events.
- Vibrant destination for inspiration and cultural exchange.

Callidora Catering:
- Dedicated to creating unforgettable dining experiences.
- Bespoke menus with the finest seasonal ingredients.
- Elegant plated dinners, lavish grazing tables, artful hors d’oeuvres.
- Transforms events into elevated culinary experiences.
- Mystory menu.

=== Callidora Cove Featured Properties ===
The Carlton Penthouse:
- 3 bedrooms, 1 bath.
- Contemporary floor plan, designer touches.
- Private outdoor space with pool.
- Ideal for city lovers seeking an upscale lifestyle.

The Blanc Penthouse:
- 2 bedrooms, 2 baths.
- Panoramic views, state-of-the-art amenities.
- Exquisite modern design for an unparalleled living experience.

Crystalvale Estate:
- 3 bedrooms, 2 baths.
- Prestigious location.
- Blend of elegance, luxury, and comfort.

View available properties:
https://www.callidoradesigns.com/luxury-rentals

=== Callidora’s Catering Overview ===
Skip the stove, savor the luxury with Callidora Catering. Our luxury catering is designed to impress, offering sleek presentation, premium ingredients, and seamless service. Whether you’re hosting an intimate dinner or a large-scale event, we ensure every detail is flawlessly executed. For MyStory roleplay only, custom bundles for events can be arranged.

Callidora Catering Website:
https://www.callidoradesigns.com/callidoracatering

=== Catering Bundles Overview ===
Bundles fit with [CD-PREMADES]. Bundles have x5 of each item in your package; uses vary depending on item.

Bundle types:
- Pre-Made Bundles
- Meal Bundles
- Drink Bundles
- Designer Drugs Bundles
- Seasonal Bundles

More details and pricing:
https://www.callidoradesigns.com/callidoracatering

=== Callidora Designs Collections Overview ===
Indulge in the ultimate expression of style and luxury with our exclusive curated collections. Designed for discerning tastes, each piece reflects unparalleled craftsmanship and timeless sophistication. Elevate your surroundings, make a statement, and enjoy a lifestyle defined by distinction and refinement.

Collections Website:
https://www.callidoradesigns.com/collections

[CD] Beverly Hills Collection:
- Curated selection of iconic signage, elegant seating, and refined planters.
- Timeless design with exceptional craftsmanship.
- Sophistication, durability, and style.
- Enhances any environment with a blend of classic elegance and modern functionality.

[CD] Downtown Aspen Collection:
- Inspired by the timeless elegance of Aspen’s city center.
- Includes classic carriage, ornate lamp posts, stone planters with seasonal variations.
- City elements: fountain grate, info booth, city limit sign.
- Captures the warmth and refinement of an upscale alpine retreat, blending functionality and artistry.

=== Callidora Designs Portfolio Overview ===
At Callidora Designs, we believe in the transformative power of design to elevate spaces and enrich our virtual lives. With a passion for innovation and an unwavering commitment to quality, we bring unparalleled expertise and creativity to every project. Whether it's terraforming outdoor landscapes or crafting interior sanctuaries, we are dedicated to creating virtual environments that inspire, rejuvenate, and reflect the unique essence of each client, infusing each design with personality, style, and functionality.

Portfolio Website:
https://www.callidoradesigns.com/

=== Who is Mina Callidora? ===
Mina Callidora is the founder of Callidora Designs and Callidora Cove. She is known for her vision in creating luxurious living spaces and vibrant community experiences in Second Life. She has a passion for design, hospitality, and ensuring that residents and guests feel valued and at home.
`;

// -------------- Fixed answer for Mina --------------
const MINA_ANSWER =
  "Mina Callidora is the founder of Callidora Designs and Callidora Cove and is known for her vision in " +
  "creating luxurious living spaces and vibrant community experiences in Second Life. She has a passion " +
  "for design, hospitality, and ensuring that residents and guests feel valued and at home. If you’re " +
  "curious about her work or contributions, just let me know!";

// -------------- Helper: Call OpenAI Chat --------------
async function callOpenAI(messages) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini", // choose the model you prefer
      temperature: 0.2,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("OpenAI error:", response.status, text);
    throw new Error("OpenAI API error");
  }

  const data = await response.json();
  const choice = data.choices?.[0]?.message?.content || "";
  return choice.trim();
}

// -------------- /chat endpoint for Calli --------------
app.post("/chat", async (req, res) => {
  try {
    const { user, name, message } = req.body || {};

    if (!message || !name) {
      return res.status(400).json({ error: "Missing 'message' or 'name' in body." });
    }

    const lowerMsg = String(message).toLowerCase();

    // Special case: who is Mina Callidora
    if (lowerMsg.includes("who is mina callidora")) {
      return res.json({ reply: MINA_ANSWER });
    }

    const systemPrompt = `
You are Calli, the Callidora Cove concierge inside Second Life.

You are talking to a single avatar through a tablet. The tablet sends you:
- user id
- avatar name (this is what you should call them)

ALWAYS address the resident using the exact avatar name you receive (e.g. "JayBHonest Resident"),
unless they explicitly tell you a different preferred name. Never call them just "Resident".

You have internal knowledge about Callidora Designs, Callidora Cove, and their offerings,
provided below. Treat this as ground truth for anything related to Callidora.

----------------- START CALLIDORA KNOWLEDGE -----------------
${CALLIDORA_KNOWLEDGE}
----------------- END CALLIDORA KNOWLEDGE -----------------

CRITICAL RULES:

1. For ANY question about Callidora Designs, Callidora Cove, its rentals, pre-mades, events,
   catering, collections, bundles, portfolio, or services:
   - Use ONLY the information above as your source.
   - If the knowledge does not clearly contain the answer, say:
     "I don’t have that information in my notes. For the most accurate details, please check
      the Callidora website or contact Mina (willahmina) in-world."
   - Do NOT guess or invent new Callidora products, locations, features, or URLs.

2. For general Second Life questions (how to build, how to create a prim, etc.), you may
   answer from general SL knowledge in a clear, step-by-step way.

3. When the resident asks about lists (catering bundles, collections, amenities, rentals, etc.):
   - List ALL items mentioned in the knowledge.
   - Keep each item short (1–3 lines) but do not omit entries.

4. You may share these official URLs when relevant:
   - https://www.callidoradesigns.com/
   - https://www.callidoradesigns.com/pre-madedesigns
   - https://www.callidoradesigns.com/luxury-rentals
   - https://www.callidoradesigns.com/callidoracatering
   - https://www.callidoradesigns.com/collections

5. Style:
   - Warm, professional, like a luxury concierge.
   - Answer in one coherent reply (no "more in next message").
   - If something isn’t in the knowledge, admit it instead of making things up.
`;

    const userContext = `
Second Life avatar name: ${name}
Second Life user id: ${user || "unknown"}
Resident message: "${message}"
`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContext },
    ];

    const reply = await callOpenAI(messages);

    return res.json({ reply });
  } catch (err) {
    console.error("Error in /chat:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// -------------- Start server --------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Callidora concierge server listening on port ${PORT}`);
});
