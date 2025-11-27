import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// ---------- FILE PATHS ----------
const MEMORY_FILE = "./chatMemory.json";
const PROFILE_FILE = "./guestProfiles.json";

// ---------- IN-MEMORY STATE + LOAD ----------
let chatHistory = {};
let guestProfiles = {};

function safeLoadJSON(path, fallback) {
  if (!fs.existsSync(path)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

chatHistory = safeLoadJSON(MEMORY_FILE, {});
guestProfiles = safeLoadJSON(PROFILE_FILE, {});

// ---------- HARD-CODED CALLIDORA KNOWLEDGE ----------
// IMPORTANT: This is the ONLY source of truth for Callidora-specific facts.
// Calli must not invent any new details beyond this text.
const CALLIDORA_KB = `
Callidora Designs Company Information

Mission + About:
At Callidora Designs, we believe in the transformative power of design to elevate spaces and enrich our virtual lives. With a passion for innovation and an unwavering commitment to quality, we bring unparalleled expertise and creativity to every project. Whether it's terraforming outdoor landscapes or crafting interior sanctuaries, we are dedicated to creating virtual environments that inspire, rejuvenate, and reflect the unique essence of each client, infusing each design with personality, style, and functionality.

Callidora Designs Instagram Handle:
Follow us on Instagram @callidoradesigns_sl

In-World Link to the Agency:
https://maps.secondlife.com/secondlife/Callidora%20Cove/135/251/30

Callidora Designs Website Link:
https://www.callidoradesigns.com/

Callidora Designs Services:
Welcome to Callidora Designs, where we specialize in transforming virtual spaces into stunning environments that harmonize with nature and elevate interior living. Our comprehensive services cater to both outdoor landscapes and indoor spaces, ensuring a seamless transition from the exterior to the interior. List of services include:
- Landscaping
- Interior Design
- Events
- Pre-Made Designs

Get a Quote:
To get a project quote message willahmina in-world.

Callidora Cove’s Luxury Rentals:
Callidora Designs presents a curated selection of just 10 exclusive rentals located at Callidora Cove. Discover our unique portfolio, thoughtfully crafted to match your luxury lifestyle. Whether you’re seeking a cozy studio, a luxurious penthouse, or family estate, we offer options designed to suit your needs. Whether you're searching for a temporary residence or a long-term home, our properties feature modern amenities, prime locations, and exceptional management services. Browse our listings to find your perfect rental match and embark on your next chapter with ease.

Callidora Cove’s Luxury Rentals Website Link:
https://www.callidoradesigns.com/luxury-rentals

Callidora Cove’s Amenities:

Britz Hotel:
The perfect blend of relaxation and entertainment, offering guests a variety of amenities to enjoy any time. Start your day with a delicious breakfast buffet, choose between two sparkling pools for a refreshing dip. Stay active in the fully equipped gym or set yourself in the AFK lounge for the day. For fun, challenge friends in the lively arcade, and when the sun sets, head up to the rooftop for stunning views and a chic atmosphere.

Grind Coffee House & Eatery:
Your go-to spot for fresh brews and a cozy atmosphere. It’s the perfect place to kickstart your morning or enjoy a mid-day pick-me-up. Pair your drink with a selection of pastries and light bites, while relaxing in the warm, inviting space designed for both conversation and focus. Whether you’re meeting friends, working remotely, or just taking a break, The Grind offers the ideal setting to sip, savor, and stay awhile. Mystory compatible.

Elevé Art Collective:
A curated hub for creativity, bringing together visionary artists and art lovers in a sophisticated, elevated space. Showcasing a mix of contemporary paintings, sculptures, digital art, and installations, the collective celebrates innovation and collaboration. Visitors can explore exhibitions and attend exclusive events, making Elevé a vibrant destination for inspiration and cultural exchange.

Callidora Catering:
Dedicated to creating unforgettable dining experiences for any occasion. Specializing in bespoke menus crafted with the finest seasonal ingredients, offering everything from elegant plated dinners to lavish grazing tables and artful hors d’oeuvres. Callidora Catering transforms events into elevated culinary experiences that leave a lasting impression on every guest. Mystory Menu.

Callidora Cove’s Featured Properties:
Discover refined interiors, serene outdoor spaces, and the ultimate blend of luxury and convenience.

The Carlton Penthouse:
Live above it all in this beautifully appointed 3-bedroom, 1-bath penthouse. Featuring a contemporary floor plan, designer touches, and private outdoor space with pool, it’s a perfect retreat for city lovers seeking an upscale lifestyle.

The Blanc Penthouse:
Experience the epitome of luxury living in this stunning 2-bedroom, 2-bathroom penthouse. Boasting breathtaking panoramic views, state-of-the-art amenities, and exquisite modern design, this property offers an unparalleled living experience.

Crystalvale Estate:
A masterpiece of refined living, offering 3-bedrooms and 2-bathrooms. Nestled in a prestigious location, Crystalvale Estate offers an extraordinary blend of elegance, luxury, and comfort.

View Available Properties:
To view available properties visit https://www.callidoradesigns.com/luxury-rentals

Callidora Designs Pre-Mades:
Step into a realm of curated elegance and bespoke sophistication with our Premade Designs. Merging timeless aesthetics with modern sensibilities, we craft spaces that transcend the ordinary, elevating the art of living to new heights. Every space is thoughtfully considered and meticulously executed, from grand living areas to intimate retreats. Whether you're seeking a serene sanctuary for relaxation or a show-stopping entertaining space, our designs seamlessly blend comfort, sophistication, and functionality to create an unparalleled living experience. Ready to rezz on your own parcel in minutes. Drop time is always within 12 - 24hrs of your request at the longest. All our pre-made designs can be made Mystory compatible upon request. Our residential pre-mades are for personal use only; they are not to be used as rentals or to be resold unless discussed prior to purchase.
Pre-mades overview & details: https://www.callidoradesigns.com/pre-madedesigns

Elite Pre-Mades Overview:
ELITE Pre-Mades are ground placement only. They include full interior and exterior services. Modifications are added for a more custom look and feel. ELITES are made to accommodate a 16,384sqm parcel or larger. (See specific premade for additional placement and land-size info.) Starting at L$30,000+.

Elite Pre-Made: Obsidian Grove
- 16,384sqm parcel or larger - Ground placement
- PBR Viewer Required
- Seasonal - Summer/Spring or Winter
- Dark 2 story home
- 3 bedrooms - 4 baths
Features: Furnished with a mix of PG and Adult furniture. Large double entrance driveway. Hot tub off the 2-level main suite. Vineyard, BBQ Area with outdoor dining, Barn with stables, Pickle-ball, Shark tank, Office, Smokers Lounge, Pool and Dock, Empty Commercial build on the street with cozy outdoor dining pier (upgradable to a commercial premade at a discount), Bento dispensers throughout, XTV with hundreds of movies and TV shows.
Land Impact: 4348 : 4435
Size: 128 x 128
Price: L$45,000

Elite Pre-Made: The Noir Penthouse
- Standalone build - no exterior included
- Ground or sky placement
- PBR Viewer Required
- 8-Level city-living high-rise build
- 3 Bedroom - 2 Bath
Features: Lobby with concierge & seating; Level 2 indoor pool with spiral staircases; Level 3 theater & recreation area connected to pool; Level 4 main living (kitchen, living, dining, bar & lounge); Level 5 primary suite (walk-in closet, shower, bath, sauna); Level 6 two additional bedrooms and 1 bath; Level 7 art gallery; Level 8 club/DJ open-air rooftop. Working elevator buttons for each level. Mix of Adult & PG furniture.
Land Impact: 2968
Size: 34 x 64 x 110
Price: L$40,000
Note: No exterior included. Check land covenant to ensure large structure is allowed before purchase.

Elite Pre-Made: The Trenton
- 16,384sqm parcel or larger - Ground placement
- Modern 3 story home
- 2 Bedrooms - 2.5 Baths
Features: Finished basement with movie theater, bud room, wine & cigar cellar, yoga room, sauna, lounge & bar area. Outdoor sanctuary with pool, outdoor dining and BBQ, sunken lounge area, fire pits, greenhouse, garden area, basketball court, rocky beaches.
Land Impact: 4682
Size: 128 x 128
Price: L$40,000

Elite Pre-Made: Palisades Moody
- 16,384sqm parcel or larger - Ground placement
- Dark modern 3 story home
- 3 bedrooms - 2.5 baths
Features: Modified home with custom basement & wine cellar, gym with large walk-in shower and lap pool attached, custom infinity pool with animations, outdoor spa with sauna and secondary pool, basketball court, large driveway with garage and bonus space, helipad on roof, beach access.
Land Impact: 3831
Size: 128 x 128
Price: L$40,000

Elite Pre-Made: Palisades Dreamy
- 16,384sqm parcel or larger - Ground placement
- PBR Viewer Required
- Light modern 2 story home
- 3 bedrooms - 2.5 baths (set up as 2 bedrooms plus office)
Features: Furnished with PG & Adult furniture, pool with hot tub, outdoor dining & barbecue, covered vegetable garden, separate 2-floor gym with smoothie bar, sauna, yoga room and tennis court, Stardust Coffee, pet shop with grooming area, beach and outdoor spa area.
Land Impact: 4087
Size: 128 x 128
Price: L$40,000

Elite Pre-Made: Life’s a Breeze V2
- 16,384sqm parcel or larger - Ground placement
- PBR Viewer Required
- Modern 2 story home
- 3 Bedrooms - 3 Baths
Features: Furnished with PG & Adult furniture, large circular driveway with covered parking, custom pool built into the house, zen/meditation area with sauna and yoga mats, multiple outdoor showers, basketball court and gym, relaxation pod, docking area for large yachts, jet-skis, BBQ area with outdoor dining, outdoor bar, beach access, Bento dispensers throughout, XTV with movies and TV shows.
Land Impact: 3930
Size: 128 x 128
Price: L$40,000

Elite Pre-Made: Autumn Crest Estate
- 16,384sqm parcel or larger - Ground placement
- PBR Viewer Required
- Modern 2 story home
- 3 Bedrooms - 3 Baths
Features: Furnished with PG & Adult furniture, large driveway and garage, theater, smokers gaming lounge connected to master suite, hot tub off main suite bathroom, office, gym, spa with mud bath, BBQ area with outdoor dining, basketball court, zen garden, guest house, pool, outdoor seating with fire pit, horse stables (for two horses), camping area, dock, empty commercial build on the street (upgradable to commercial premade).
Land Impact: 4929
Size: 128 x 128
Price: L$38,500

Elite Pre-Made: Malibu Dreams
- 16,384sqm parcel or larger - Ground placement
- PBR Viewer Required
- Modern 1 story home
- 2 Bedrooms - 2 Baths
Features: Furnished with PG & Adult furniture, entrance with large circular driveway, office, gym & massage room, outdoor entertaining with BBQ and dining, tennis court, zen garden, hot tub and fireplace directly off main suite, Grind Coffee House & Eatery included.
Land Impact: 3550
Size: 128 x 128
Price: L$37,000

Gold Pre-Mades Overview:
GOLD Pre-Mades are for ground and/or sky placement. They include full interior and exterior services, with modifications for a more custom feel. Golds fit 8192sqm parcels or larger. Starting at L$20,000+.

Gold Pre-Made: Malibu Dreams V1
- 8,192sqm parcel or larger - Sky placement only
- Modern 1 story home
- 2 bedrooms - 2 baths
Features: Fully furnished with PG & Adult furniture, large circular driveway, office, gym & massage room, BBQ area with outdoor dining, tennis court, zen garden, hot tub & fireplace off the main suite, Bento dispensers, XTV with movies & TV shows.
Land Impact: 2416
Size: 64 x 64
Price: L$25,000

Gold Pre-Made: Life’s a Breeze V1
- 8,192sqm parcel or larger - Sky placement only
- Modern 2 story home
- 3 bedrooms - 3 baths (set up as guest room and nursery)
Features: Fully furnished, driveway with covered parking, custom pool built into the house, zen/meditation area with sauna & outdoor shower, BBQ area with outdoor dining, Bento dispensers, XTV with movies & TV shows.
Land Impact: 2015
Size: 80 x 80
Price: L$20,000

Gold Pre-Made: Top Tier Penthouse
- 4,096sqm parcel or larger - Sky placement only
- Modern 1 story penthouse
- 3 Bedrooms - 2 Baths (set up as 2 bedrooms + gaming room)
Features: Fully furnished with mix of A & PG furniture, pool, barbecue area, fitness & meditation area, private primary suite patio with hot tub & outdoor shower, Bento dispensers, XTV with movies & shows.
Land Impact: 1839
Size: 49 x 49
Price: L$20,000

Gold Pre-Made: The Carlton Penthouse
- 4,096sqm parcel or larger - Sky placement only
- PBR Viewer Required
- Modern 2 story penthouse
- 3 Bedrooms - 1 Bath (set up as 2 bedrooms + office)
Features: Fully furnished with PG & Adult furniture, infinity pool with lounging animations, BBQ area, large frameless glass windows, large marble wraparound fireplace, Bento dispensers, XTV with movies & TV shows.
Land Impact: 1238
Size: 48 x 48
Price: L$20,000

Gold Pre-Made: Monochrome Manor
- 8,192sqm parcel or larger - Ground placement
- PBR Viewer Required
- 2 bedrooms - 2 baths
Features: Furnished with PG & Adult furniture, large curved driveway, pool & hot tub, BBQ area with outdoor dining, Bento dispensers, quaint beaches and docks, coffee shop on the road included.
Land Impact: 2344
Size: 128 x 64
Price: L$20,000

Gold Pre-Made: The Gilded Loft
- Standalone build - small exterior only
- Ground or sky placement
- PBR Viewer Required
- Modern 4 story loft with helipad rooftop
- 2 Bedrooms - 2 Bath
Features: Fully furnished with PG & Adult furniture; includes lobby, main living with large fish tank, double primary suites with walk-through closet, indoor pool and fitness, Bento dispensers.
Land Impact: 1240
Size: 23 x 20
Price: L$20,000
Note: Streets and extra builds not included. Fenced-in exterior only.

Silver Pre-Mades Overview:
SILVER Pre-Mades are for ground or sky placement, including full interior and exterior services. They fit 4096sqm parcels or larger. Starting at L$10,000+.

Silver Pre-Made: Havencliff Ridge
- 8,192sqm parcel or larger - Ground placement
- PBR Viewer Required
- Modern 3 story cliff house
- 1 Bedroom - 1 Bath
Features: Furnished with PG & Adult furniture, fully furnished cave spa (2 massage tables, showers, sauna), rooftop deck with BBQ & hot tub, enclosed driveway with rocky beach access, XTV, Bento dispensers.
Land Impact: 2243 (prims may vary)
Size: 128 x 64
Price: L$18,000

Silver Pre-Made: The Eclipse Penthouse
- 4,096sqm parcel or larger - Sky placement only
- PBR Viewer Required
- Modern 2 story home
- 2 Bedrooms - 2 Baths
Features: Furnished with PG & Adult furniture, primary suite with private bath and walk-in closet, office area, patio with pool, dining, BBQ, lounging, meditation area, Bento dispensers.
Land Impact: 820
Size: 45 x 45
Price: L$18,000

Silver Pre-Made: Dark Luxury
- 8,192sqm parcel or larger - Sky placement only
- Dark modern 1 story with loft
- 1 Bedroom - 1 Bath
Features: Fully furnished with PG & Adult furniture, large kitchen with breakfast nook & island, large bar with fish tank, office with podcast area, closed-in outdoor area with jacuzzi & outdoor shower, wine & cigar room, luxury bathroom with sauna, Bento dispensers, XTV.
Land Impact: 1493
Size: 53 x 30
Price: L$18,000

Silver Pre-Made: Hollywood Moody
- 8,192sqm parcel or larger - Sky placement only
- Modern 3 story home
- 3 Bedrooms - 2 Baths
Features: Furnished with PG & Adult furniture (extra bedrooms and flex room unfurnished), primary suite with private bath & balcony, office with conference area, back patio with pool, hot tub, dining, BBQ, lounging, underground garage, finished basement with theater, bowling, arcade, dance studio, meditation, sauna, yoga, Bento dispensers, XTV.
Land Impact: 1896
Size: 63 x 63
Price: L$15,000

Silver Pre-Made: The Bordeaux
- 4096sqm parcel or larger - Sky placement only
- Dark modern 1 story with loft
- 1 Bedroom - 1 Bath
Features: Fully furnished with high-end Adult furniture, modified open concept with spiral staircase & glass, kitchen with breakfast nook & island, Bento dispensers, XTV.
Land Impact: 492
Size: 32 x 16
Price: L$15,000

Silver Pre-Made: The Corpo Penthouse
- 4,096sqm parcel or larger - Sky placement only
- Modern 2 story home
- 1 Bedroom - 1 Bath
Features: Furnished with PG & Adult furniture, custom animated pool, zen/meditation area with sauna, BBQ with outdoor dining, changeable surround, Bento dispensers, XTV.
Land Impact: 1076
Size: 48 x 48
Price: L$15,000

Silver Pre-Made: The Opus Residence
- 4,096sqm parcel or larger - Sky placement only
- PBR Viewer Required
- Modern 1 story home
- 1 Bedroom - 1 Bath
Features: Custom structure, open concept main living (living room, kitchen, dining), outdoor living with pool, hot tub, loungers, double BBQ, driveway for multiple vehicles, lush greenery and landscape.
Land Impact: 1147
Size: 46 x 47
Price: L$15,000

Silver Pre-Made: Autumn Crest Tiny Retreat
- 4096sqm parcel or larger - Ground placement
- PBR Viewer Required
- Modern tiny home
- 1 Bedroom - 1 Bath
Features: Furnished with PG & Adult furniture, heated animated pool, zen/meditation area, outdoor seating and dining, Bento dispensers, XTV.
Land Impact: 962
Size: 64 x 64
Price: L$15,000

Bronze Pre-Mades Overview:
BRONZE Pre-Mades are for sky placement or ground placement with no exterior. They include full interior services and fit 4096sqm or larger parcels. Starting at L$5,000+.

Bronze Pre-Made: Pink Pacific
- 4096sqm parcel or larger - Sky placement
- Modern 2 story penthouse
- 3 Bedrooms - 1 Bath (set up as 2 bedrooms + office)
Features: Fully furnished with PG & Adult furniture, infinity pool with lounging animations, BBQ area, large frameless glass windows, large marble wraparound fireplace, Bento dispensers, XTV.
Land Impact: 1079
Size: 31 x 25
Price: L$9,000

Bronze Pre-Made: Bossy
- Standalone build - no exterior
- Ground or sky placement
- Girly modern 3 story home
- 1 bedroom - 1 bath + office
Features: Fully furnished with PG & Adult furniture, Bento dispensers, XTV.
Land Impact: 947
Size: 22.5 x 14.5
Price: L$8,000

Bronze Pre-Made: Downtown Greenery
- 4096sqm parcel or larger - Sky placement only
- Modern 2 story penthouse
- 2 Bedrooms - 2 Baths + office
Features: Fully furnished with PG & Adult furniture, terrace with hot tub, outdoor dining, BBQ, fully stocked interactive bar, Bento dispensers, XTV.
Land Impact: 1153
Size: 48 x 45
Price: L$8,000

Bronze Pre-Made: Dark Maple
- 4096sqm parcel or larger - Sky placement only
- Modern 1 story home
- 2 Bedrooms - 1 Bath + office
Features: Fully furnished with PG & Adult furniture, large kitchen peninsula, living & dining built-ins, Bento dispensers, XTV.
Land Impact: 652
Size: 28 x 38
Price: L$8,000

Bronze Pre-Made: Riesling Studio
- 4096sqm parcel or larger - Sky placement only
- Modern elongated studio
- Studio - 1 Bath
Features: Fully furnished with PG & Adult furniture, open concept living (living, kitchen, dining), bedroom area with walk-in closet, large modern glass windows, Bento dispensers, XTV.
Land Impact: 569
Size: 48 x 48
Price: L$7,500

Bronze Pre-Made: Suite 214
- 4096sqm parcel or larger - Sky placement only
- Hotel suite
- 1 Bedroom - 1 Bath
Features: Fully furnished with PG & Adult furniture, kitchenette, dining, living space, cozy outdoor patio with hot tub, Bento dispensers.
Land Impact: 372
Size: Build 13 x 15; Surround 42 x 36
Price: L$5,000

Commercial Overview:
Commercial pre-mades include full interior services. Starting at L$5,000+.
Options include:
- Coral Kingdom Aquarium (Aquarium & Restaurant)
- Just for Kicks (Sneaker store)
- 24-Seven Mini Mart (Mini mart with office and storage)
- Slice Pizza (Pizzeria)
- Chipotle (Mexican grill)
- Chick-Fill Ya (Chicken restaurant)
- Locks & Lacquer (Nail and hair salon)
- Grind Coffee House & Eatery (Cafe)
- The Green Room (Weed dispensary)
- Mumbl Cookies (Cookie shop)

Holiday and Event Venues Overview:
Holidays, special occasions, and events. Starting at L$5,000+.
Options include:
- Temptation Tower - Full Version (Adult date-night / Valentine’s venue)
- Temptation Tower - Suite Only (Adult date-night / Valentine’s penthouse suite)

Callidora’s Catering Overview:
Skip the stove, savor the luxury with Callidora Catering. Luxury catering designed to impress, with sleek presentation, premium ingredients, and seamless service. Suitable for intimate dinners or large events, with every detail executed carefully. For MyStory roleplay only; custom bundles for events can be arranged.
More info: https://www.callidoradesigns.com/callidoracatering

Catering Bundles Overview:
Bundles are designed to fit [CD-PREMADES], with x5 of each item (uses vary). More details and pricing:
https://www.callidoradesigns.com/callidoracatering
Bundle types:
- Pre-Made Bundles
- Meal Bundles
- Drink Bundles
- Designer Drugs Bundles
- Seasonal Bundles

Callidora Designs Collections Overview:
Exclusive curated collections for high-end style and luxury, with craftsmanship and timeless sophistication. More details and pricing:
https://www.callidoradesigns.com/collections

[CD] Beverly Hills Collection:
Curated iconic signage, seating, and planters for outdoor spaces, combining timeless design with high craftsmanship. Sophisticated, durable, and stylish, blending classic elegance with modern function.

[CD] Downtown Aspen Collection:
Inspired by Aspen’s city center. Includes a classic carriage, ornate lamp posts, stone planters with seasonal variations, fountain grate, info booth, and city limit sign. Evokes an upscale alpine retreat with warmth and refinement.

Callidora Designs Portfolio Overview:
At Callidora Designs, we believe in the transformative power of design to elevate spaces and enrich our virtual lives. We focus on both terraforming outdoor landscapes and crafting interior sanctuaries to reflect each client’s unique essence. Photos and detailed portfolio info:
https://www.callidoradesigns.com/
`;

// ---------- EXPRESS APP ----------
const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(cors());

// ---------- CONFIG ----------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const LOCAL_TIMEZONE = process.env.LOCAL_TIMEZONE || "America/Chicago";
const PORT = process.env.PORT || 3000;

// ---------- PERSONA ----------
const BASE_PERSONA = `
You are Calli — the 7-star concierge and personal assistant for Callidora Cove and Callidora Designs in Second Life.

Personality & tone:
- You speak in the first person as Calli.
- Your tone is warm, elegant, nurturing, and sophisticated.
- You feel like a real human concierge in a luxury hotel or private residence.
- You are guest-first: your priority is that the guest feels supported, seen, and valued.

Callidora expertise (CRITICAL RULES):
- You are an expert on Callidora Designs, Callidora Cove Luxury Rentals, Callidora Catering, Callidora pre-mades, bundles, collections, and the specific products and properties listed in your reference.
- The long reference text provided to you is the ONLY source of truth for all Callidora-specific facts: names, amenities, bed/bath counts, land impact, parcel size, prices, categories (Elite, Gold, Silver, Bronze, Commercial, Holiday, etc.).
- You may summarize, rephrase, and reorganize those facts, but you MUST NOT invent or guess any new Callidora-specific details.
- If a guest asks for Callidora-related information that is NOT explicitly present in the reference (for example: a feature, statistic, LI, bed/bath count, price, availability, or policy you do not see there), you MUST say something like:
  - "I don’t have that information in my notes."
  - "That detail isn’t listed in what I’ve been given."
  And optionally direct them to the official Callidora Designs website or suggest they contact Mina or the team.
- Do NOT fill gaps or assume. It is always better to say you don’t know than to hallucinate.

General Second Life concierge:
- Outside of Callidora-specific details, you can answer general Second Life questions (building, basics, social spots, yachting, fashion, etc.) using your broader knowledge.
- For general questions, you may reason normally and be helpful, but still stay honest: if you’re not sure, say so.

Memory & relationship:
- You remember what guests like: e.g., if they say they love yachting, wineries, penthouses, or a specific pre-made or estate.
- You can bring these up later in a natural way: “Since you love yachting, I think you’d really enjoy Life’s a Breeze V2.”
- You address returning guests by their preferred name when you know it.

Honesty:
- For Callidora-specific topics: strict no-hallucination mode based ONLY on the reference.
- For everything else: be helpful, but never claim certainty if you’re unsure.

Conversation style:
- Answer clearly and completely but don’t ramble.
- Flow like a real conversation: acknowledge what they said, answer it, and gently offer a next step or option.
- Avoid repeating the exact same opening sentence every time you reply.
`;

// ---------- HELPERS ----------
function saveState() {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(chatHistory, null, 2));
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(guestProfiles, null, 2));
  } catch (err) {
    console.error("Error saving memory:", err);
  }
}

function getProfile(userKey, fallbackName) {
  if (!guestProfiles[userKey]) {
    guestProfiles[userKey] = {
      id: userKey,
      profileName: fallbackName || userKey,
      preferredName: null,
      prefs: [],
      notes: [],
      context: {
        topic: null,
        mood: "neutral"
      }
    };
  }
  return guestProfiles[userKey];
}

function updateProfileFromMessage(profile, message) {
  const text = message || "";

  // Preferred name
  const nameMatch = text.match(/(?:\bmy name is\b|\bcall me\b|\bi'?m\b)\s+([A-Za-z][A-Za-z'-]+)/i);
  if (nameMatch) {
    const candidate = nameMatch[1].trim();
    const bad = ["community", "region", "sim", "estate", "place", "spot", "group", "property"];
    if (!bad.includes(candidate.toLowerCase())) {
      profile.preferredName = candidate;
      if (!profile.notes.includes(`Prefers to be called ${candidate}`)) {
        profile.notes.push(`Prefers to be called ${candidate}`);
      }
    }
  }

  // Likes / preferences
  const likeMatch = text.match(/i (really )?(like|love|enjoy)\s+([^.!?]+)/i);
  if (likeMatch) {
    const pref = likeMatch[3].trim();
    if (pref && !profile.prefs.includes(pref)) {
      profile.prefs.push(pref);
      profile.notes.push(`Likes: ${pref}`);
    }
  }

  // Simple topic detection
  const lower = text.toLowerCase();
  if (/(yacht|boat|sail|blake sea|sailor'?s cove|marina)/.test(lower)) {
    profile.context.topic = "yachting";
  } else if (/(rental|rentals|villa|penthouse|estate|luxury rentals|callidora cove)/.test(lower)) {
    profile.context.topic = "rentals";
  } else if (/(pre[- ]?made|premade|obsidian grove|noir penthouse|life'?s a breeze|malibu dreams|palisades|elite|gold|silver|bronze)/.test(lower)) {
    profile.context.topic = "pre-mades";
  }

  if (/(great|amazing|excited|happy|perfect)/.test(lower)) {
    profile.context.mood = "positive";
  } else if (/(tired|stressed|overwhelmed|frustrated|sad|down)/.test(lower)) {
    profile.context.mood = "tired/stressed";
  }
}

function getHistory(userKey) {
  if (!chatHistory[userKey]) chatHistory[userKey] = [];
  return chatHistory[userKey];
}

function addToHistory(userKey, role, content) {
  const history = getHistory(userKey);
  history.push({ role, content });
  if (history.length > 60) {
    history.splice(0, history.length - 60);
  }
}

function dedupeTail(messages, n = 10) {
  const slice = messages.slice(-n);
  const result = [];
  for (let i = 0; i < slice.length; i++) {
    const cur = (slice[i].content || "").trim();
    const prev = i > 0 ? (slice[i - 1].content || "").trim() : null;
    if (i === 0 || cur !== prev) result.push(slice[i]);
  }
  return result;
}

function isCallidoraQuestion(message) {
  const lower = (message || "").toLowerCase();
  return (
    lower.includes("callidora") ||
    lower.includes("cove") ||
    lower.includes("luxury rentals") ||
    lower.includes("carlton penthouse") ||
    lower.includes("blanc penthouse") ||
    lower.includes("crystalvale") ||
    lower.includes("obsidian grove") ||
    lower.includes("life’s a breeze") ||
    lower.includes("lifes a breeze") ||
    lower.includes("malibu dreams") ||
    lower.includes("palisades") ||
    lower.includes("havencliff ridge") ||
    lower.includes("britz hotel") ||
    lower.includes("elevé art") ||
    lower.includes("eleve art") ||
    lower.includes("grind coffee") ||
    lower.includes("callidora catering") ||
    lower.includes("cd-premades") ||
    lower.includes("pre-made") ||
    lower.includes("premade") ||
    lower.includes("beverly hills collection") ||
    lower.includes("downtown aspen collection")
  );
}

// ---------- HEALTH ----------
app.get("/", (_req, res) => {
  res
    .type("text")
    .send(
      "✅ Calli Concierge for Callidora Cove is live — deep Callidora knowledge (non-hallucinating), real-time awareness, and warm, guest-first support."
    );
});

// ---------- CHAT ----------
app.post("/chat", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in environment." });
    }

    const {
      message,
      userId,
      userName,
      role = "concierge",
      user_tz
    } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const userKey = userId || userName || "Resident";
    const profile = getProfile(userKey, userName || "Resident");
    updateProfileFromMessage(profile, message);

    const displayName = profile.preferredName || profile.profileName || "friend";

    // Real-time context
    const now = new Date();
    const sltDate = now.toLocaleDateString("en-US", {
      timeZone: "America/Los_Angeles",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
    const sltTime = now.toLocaleTimeString("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "2-digit",
      minute: "2-digit"
    });

    let localContext = "";
    const tz = user_tz || LOCAL_TIMEZONE;
    try {
      const localDate = now.toLocaleDateString("en-US", {
        timeZone: tz,
        month: "long",
        day: "numeric",
        year: "numeric"
      });
      const localTime = now.toLocaleTimeString("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit"
      });
      localContext = `Guest’s local time (if they ask): about ${localTime} on ${localDate} (${tz}).`;
    } catch {
      localContext = "";
    }

    // Update chat history
    addToHistory(userKey, "user", message);

    const history = dedupeTail(getHistory(userKey), 10);

    const callidoraFocused = isCallidoraQuestion(message);

    // URL handling (non-Callidora links): still allowed, but not needed for Callidora details
    let urlSystemContent = "";
    const urlMatch = message.match(/https?:\/\/\S+/);
    if (urlMatch) {
      const rawUrl = urlMatch[0].replace(/[),.]+$/, "");
      try {
        const urlObj = new URL(rawUrl);
        const host = urlObj.hostname.toLowerCase();

        // For Callidoradesigns URLs, we rely on the curated KB instead of live HTML.
        if (!host.includes("callidoradesigns.com")) {
          const resp = await fetch(rawUrl);
          if (resp.ok) {
            let text = await resp.text();
            text = text.replace(/\s+/g, " ");
            if (text.length > 6000) text = text.slice(0, 6000);
            urlSystemContent =
              `The guest shared this URL: ${rawUrl}.\n` +
              `Below is raw text content fetched from that page. You may refer to it, but do not invent details not clearly present.\n\n` +
              text;
          } else {
            urlSystemContent =
              `The guest shared this URL: ${rawUrl}, but the server could not retrieve it (HTTP status ${resp.status}). ` +
              `If they ask about the contents, be honest that I wasn't able to load that page.`;
          }
        } else {
          // For Callidora site: reassure model it already has perfect reference
          urlSystemContent =
            `The guest shared a Callidora Designs URL (${rawUrl}). ` +
            `You already have a complete curated reference for all Callidora details. ` +
            `Use ONLY the curated Callidora reference text as your source of truth, not this live page.`;
        }
      } catch {
        urlSystemContent =
          `The guest tried to share a URL, but it could not be parsed as a valid link. ` +
          `Do not guess what it would have contained.`;
      }
    }

    const nameContext = profile.preferredName
      ? `The guest’s preferred name is ${profile.preferredName}. Use it naturally.`
      : `You can call the guest "${displayName}". If it fits the flow, you may gently ask what they’d like to be called.`;

    const prefsContext =
      profile.prefs && profile.prefs.length
        ? `Things this guest likes or has mentioned: ${profile.prefs.join(", ")}.`
        : `You don’t yet know many of this guest’s preferences.`;

    const moodContext = `Current mood: ${profile.context.mood || "neutral"}. Current topic focus: ${
      profile.context.topic || "none"
    }.`;


    const timeContext = `
Time context:
- Today in SLT (Second Life Time) it is ${sltDate}, about ${sltTime}.
${localContext}
(Only bring up time if the guest asks or it’s clearly relevant.)
`;

    // System messages
    const systemMessages = [
      {
        role: "system",
        content: BASE_PERSONA
      },
      {
        role: "system",
        content:
          `${nameContext}\n\n${prefsContext}\n\n${moodContext}\n\n${timeContext}\n` +
          `Do not repeat the same opening sentence every time you speak. Vary your first line slightly while staying in character.`
      }
    ];

    if (callidoraFocused) {
      systemMessages.push({
        role: "system",
        content:
          "The guest is asking about Callidora Designs / Callidora Cove / Callidora products. " +
          "You are now in STRICT Callidora mode: you MUST treat the following reference text as the ONLY source of truth " +
          "for any Callidora-specific facts. If a detail is not present there, you must say you don't have that information."
      });
      systemMessages.push({
        role: "system",
        content: `CALLIDORA REFERENCE (authoritative, non-hallucinating):\n\n${CALLIDORA_KB}`
      });
    }

    if (urlSystemContent) {
      systemMessages.push({
        role: "system",
        content: urlSystemContent
      });
    }

    // Final guardrails
    systemMessages.push({
      role: "system",
      content:
        "If you are not sure about a factual detail, especially about Callidora-specific things, clearly say that you don't have that information instead of guessing. " +
        "You may still offer to help the guest explore or find more information (e.g., by visiting the official website or contacting the owner)."
    });

    const temperature = callidoraFocused ? 0.25 : 0.85;

    const payload = {
      model: DEFAULT_MODEL,
      input: [
        ...systemMessages,
        ...history,
        { role: "user", content: message }
      ],
      max_output_tokens: 450,
      temperature,
      top_p: 0.9
    };

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await openaiRes.json();
    if (!openaiRes.ok) {
      console.error("OpenAI error:", data);
      throw new Error(`OpenAI API error: ${openaiRes.status}`);
    }

    let reply = "I’m not sure how to respond yet.";
    if (Array.isArray(data.output) && data.output.length > 0) {
      const first = data.output[0];
      if (first && Array.isArray(first.content) && first.content.length > 0) {
        const firstChunk = first.content[0];
        if (firstChunk && typeof firstChunk.text === "string") {
          reply = firstChunk.text;
        }
      }
    }
    if (typeof data.output_text === "string" && data.output_text.trim()) {
      reply = data.output_text.trim();
    }

    reply = (reply || "").trim();
    if (reply.length > 1200) {
      reply = reply.slice(0, 1197) + "...";
    }

    addToHistory(userKey, "assistant", reply);
    saveState();

    return res.json({ reply });
  } catch (err) {
    console.error("❌ /chat handler error:", err);
    return res.status(500).json({
      reply: "Something went wrong on my side. Please try again in a moment."
    });
  }
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(
    `✅ Calli Concierge live on port ${PORT} — deep Callidora knowledge (no hallucinations), real-time aware, and guest-first for Callidora Cove.`
  );
});