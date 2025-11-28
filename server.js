// server.js
// Callidora Concierge - Calli AI
// Express + OpenAI backend

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // keep key in Render env, NOT in code
});

// Simple in-memory session history per user
const sessions = {};

// -------------------------
// Callidora Knowledge Block
// (your full notes pasted here)
// -------------------------
const callidoraKnowledge = `
Callidora Designs Company Information

Mission + About:

At Callidora Designs, we believe in the transformative power of design to elevate spaces and enrich our virtual lives. With a passion for innovation and an unwavering commitment to quality, we bring unparalleled expertise and creativity to every project. Whether it's terraforming outdoor landscapes or crafting interior sanctuaries, we are dedicated to creating virtual environments that inspire, rejuvenate, and reflect the unique essence of each client, infusing each design with personality, style, and functionality.

Callidora Designs Instagram Handle:
Follow us on Instagram
@callidoradesigns_sl

In-World Link to the Agency:
https://maps.secondlife.com/secondlife/Callidora%20Cove/135/251/30

Callidora Designs Website Link:
https://www.callidoradesigns.com/

Callidora Designs Services:
Welcome to Callidora Designs, where we specialize in transforming virtual spaces into stunning environments that harmonize with nature and elevate interior living. Our comprehensive services cater to both outdoor landscapes and indoor spaces, ensuring a seamless transition from the exterior to the interior. List of services include:

Landscaping
Interior Design
Events
Pre-Made Designs

Get a Quote:
To get a project quote message willahmina in-world.

Callidora Cove’s Luxury Rentals:
Callidora Designs presents a curated selection of just 10 exclusive rentals located at Callidora Cove. Discover our unique portfolio, thoughtfully crafted to match your luxury lifestyle. Whether you’re seeking a cozy studio, a luxurious penthouse, or family estate, we offer options designed to suit your needs. Whether you're searching for a temporary residence or a long-term home, our properties feature modern amenities, prime locations, and exceptional management services. Browse our listings to find your perfect rental match and embark on your next chapter with ease.

Callidora Cove’s Luxury Rentals Website Link:
https://www.callidoradesigns.com/luxury-rentals 

Callidora Cove’s Amenities:

Britz Hotel
The perfect blend of relaxation and entertainment, offering guests a variety of amenities to enjoy any time. Start your day with a delicious breakfast buffet, choose between two sparkling pools for a refreshing dip. Stay active in the fully equipped gym or set yourself in the AFK lounge for the day. For fun, challenge friends in the lively arcade, and when the sun sets, head up to the rooftop for stunning views and a chic atmosphere.

Grind Coffee House & Eatery
Your go-to spot for fresh brews and a cozy atmosphere. It’s the perfect place to kickstart your morning or enjoy a mid-day pick-me-up. Pair your drink with a selection of pastries and light bites, while relaxing in the warm, inviting space designed for both conversation and focus. Whether you’re meeting friends, working remotely, or just taking a break, The Grind offers the ideal setting to sip, savor, and stay awhile. Mystory compatible.

Elevé Art Collective
A curated hub for creativity, bringing together visionary artists and art lovers in a sophisticated, elevated space. Showcasing a mix of contemporary paintings, sculptures, digital art, and installations, the collective celebrates innovation and collaboration. Visitors can explore exhibitions and attend exclusive events, making Elevé a vibrant destination for inspiration and cultural exchange.

Callidora Catering
Dedicated to creating unforgettable dining experiences for any occasion. Specializing in bespoke menus crafted with the finest seasonal ingredients, offering everything from elegant plated dinners to lavish grazing tables and artful hors d’oeuvres. Callidora Catering transforms events into elevated culinary experiences that leave a lasting impression on every guest. Mystory Menu.

Callidora Cove’s Featured Properties:
Discover refined interiors, serene outdoor spaces, and the ultimate blend of luxury and convenience.

The Carlton Penthouse
Live above it all in this beautifully appointed 3-bedroom, 1-bath penthouse. Featuring a contemporary floor plan, designer touches, and private outdoor space with pool, it’s a perfect retreat for city lovers seeking an upscale lifestyle.

The Blanc Penthouse
Experience the epitome of luxury living in this stunning 2-bedroom, 2-bathroom penthouse. Boasting breathtaking panoramic views, state-of-the-art amenities, and exquisite modern design, this property offers an unparalleled living experience.

Crystalvale Estate
A masterpiece of refined living, offering 3-bedrooms and 2-bathrooms. Nestled in a prestigious location, Crystalvale Estate offers an extraordinary blend of elegance, luxury, and comfort.

View Available Properties:
To view available properties visit https://www.callidoradesigns.com/luxury-rentals 

Callidora Designs Pre-Mades:
Step into a realm of curated elegance and bespoke sophistication with our Premade Designs. Merging timeless aesthetics with modern sensibilities, we craft spaces that transcend the ordinary, elevating the art of living to new heights. Every space is thoughtfully considered and meticulously executed, from grand living areas to intimate retreats. Whether you're seeking a serene sanctuary for relaxation or a show-stopping entertaining space, our designs seamlessly blend comfort, sophistication, and functionality to create an unparalleled living experience. Ready to Rezz on your own parcel in minutes. Drop time is always within 12 - 24hrs of your request at the longest. All our pre-made designs can be made Mystory compatible upon request. Our residential pre-mades are for personal use only; they are not to be used as rentals or to be resold unless discussed prior to purchase. To view detailed options visit the pre-mades site: https://www.callidoradesigns.com/pre-madedesigns 

Callidora Designs Pre-Mades Website Link:
https://www.callidoradesigns.com/pre-madedesigns 

Elite Pre-Mades Overview:
ELITE Pre-Mades are ground placement only. They include full interior and exterior services. Modifications are added for a more custom look and feel. ELITES are made to accommodate a 16,384sqm parcel or larger. (see specific premade for additional information on placement and land size). Starting at L$30,000+. To view the details options visit this pre-mades site: https://www.callidoradesigns.com/pre-madedesigns 

Elite Pre-Made: Obsidian Grove
16,384sqm parcel or larger - Ground placement
PBR Viewer Required
Seasonal - Summer/Spring or Winter
Dark 2 story home
3 bedrooms - 4 baths

Furnished with a mix of PG and Adult furniture. Large double entrance driveway. Hot tub off the 2-level main suite. Vineyard, BBQ Area with outdoor dining, Barn with stables, Pickle-ball. Shark tank, Office, Quaint Smokers Lounge. Pool and Dock, Empty Commercial build included on the street with cozy outdoor dining pier. (Can be upgraded to a commercial premade for a discounted price), Bento Dispensers through-out. XTV with hundreds of movies and TV shows.

Land Impact: 4348 : 4435
Size: 128 x 128
Price: L$45,000

Elite Pre-Made: The Noir Penthouse
This is a standalone build - no exterior included.
For ground or in the sky placement
PBR Viewer Required
8 Level City Living - High Rise Build
3 Bedroom - 2 Bath

Lobby w/ concierge & seating. LVL2 - Indoor Pool w/ spiral staircases. LVL3 - Theater & recreational area connected w/ pool. LVL4 - Main living - Kitchen, Living, Dining, Bar & lounge. LVL5 - Primary suite - walking closet, walk in shower, bath area, and sauna. LVL6 - 2 Additional Bedrooms - 1 Bath. LVL7 - Art Gallery. LVL8 - Club/DJ Area - open air rooftop. Working elevator buttons for each level. Mix of Adult & PG furniture.

Land Impact: 2968
Size: 34 x 64 x 110
Price: L$40,000
*Note: NO exterior included. Please check land covenant to make sure large structure can be placed before purchase*

Elite Pre-Made: The Trenton
16,384sqm parcel or larger - Ground placement
Modern 3 story home
2 Bedrooms - 2.5 Baths

A finished basement featuring Movie Theater, Bud Room, Wine & Cigar Cellar. Yoga Room, Sauna, Lounge & Bar area. Outdoor sanctuary with pool, outdoor dining and bbq, sunken lounge area, fire pits, greenhouse and garden area, basketball court, rocky beaches.

Land Impact: 4682
Size: 128 x 128
Price: L$40,000

Elite Pre-Made: Palisades Moody
16,384sqm parcel or larger - Ground placement
Dark Modern 3 story home
3 bedrooms - 2.5 baths

Modified home with custom basement & wine cellar. Gym with large walk-in shower and lap pool attached. Custom built infinity pool w/animations. Outdoor spa area w/sauna and secondary pool. Basketball Court, Large driveway with garage and bonus space. Helipad on roof. Beach access.

Land Impact: 3831
Size: 128 x 128
Price: L$40,000

Elite Pre-Made: Palisades Dreamy
16,384sqm parcel or larger - Ground placement
PBR Viewer Required
Light Modern 2 story home
3 bedrooms - 2.5 baths (set up as a 2 bedroom with office). 

Furnished with a mix of PG and Adult furniture. Pool with hot tub, outdoor dining & barbeque area. Covered vegetable garden. Separate 2 floor gym build with smoothie bar, sauna, yoga room and tennis court. Stardust coffee. Pet shop with grooming area. Beach and outdoor spa area.

Land Impact: 4087
Size: 128 x 128
Price: L$40,000

Elite Pre-Made: Life’s a Breeze V2
16,384sqm parcel or larger - Ground placement
PBR Viewer Required
Modern 2 story home
3 Bedrooms - 3 Baths

Furnished with a mix of PG and Adult furniture. Large circular driveway with covered parking. Custom pool built into the house. Zen/Meditation area with sauna, meditation pillows and yoga mats. Multiple outdoor showers. Basketball court and gym. Relaxation Pod. Docking area for large yachts. Jet-skis. BBQ Area with outdoor dining. Outdoor bar area. Beach access. Bento Dispensers through-out. XTV with hundreds of movies and TV shows.

Land Impact: 3930
Size: 128 x 128
Price: L$40,000

Elite Pre-Made: Autumn Crest Estate
16,384sqm parcel or larger - Ground placement
PBR Viewer Required
Modern 2 story home
3 Bedrooms - 3 Baths

Furnished with a mix of PG and Adult furniture. Large driveway and garage, Theater, Smokers Gaming lounge connected to master suite, Hot tub off the main suite bathroom, Office, Gym, Spa with mud bath, BBQ Area with outdoor dining, Basketball Court, Zen Garden, Guest House, Pool, Outdoor seating with fire pit, Horse stables (houses two horses), Camping area, and Dock. Empty Commercial build included on the street. (Can be upgraded to a commercial premade for a discounted price).

Land Impact: 4929 
Size: 128 x 128
Price: L$38,500

Elite Pre-Made: Malibu Dreams
16,384sqm parcel or larger - Ground placement
PBR Viewer Required
Modern 1 story home
2 Bedrooms - 2 Baths

Furnished with a mix of PG and Adult furniture. Entrance with large circular driveway for cars, Office, Gym & Massage Room, outdoor entertaining featuring BBQ Area with outdoor dining, Tennis Court, Zen Garden, and a Hot tub & Fireplace directly off the main suite. Grind Coffee House & Eatery included.

Land Impact: 3550
Size: 128 x 128
Price: L$37,000

Gold Pre-Mades Overview:
GOLD Pre-Mades are made for ground and/or sky placement. They include full interior and exterior services. Modifications are added for a more custom look and feel. GOLDs are made to accommodate an 8192sqm parcel or larger. (see specific premade for additional information on placement and land size). Starting at L$20,000+. To view the details options visit this pre-mades site: https://www.callidoradesigns.com/pre-madedesigns 

Gold Pre-Made: Malibu Dreams V1:
8,192sqm parcel or larger - Sky placement only
Modern 1 Story home
2 bedrooms - 2 baths

Fully Furnished with a mix of PG and Adult furniture. Large circular driveway for cars. Office, Gym & Massage Room. BBQ Area with outdoor dining, Tennis Court, Zen Garden. Hot tub & Fireplace off the main suite. Bento Dispensers through-out, XTV with hundreds of movies and TV shows.

Land Impact: 2416
Size: 64 x 64
Price: L$25,000

Gold Pre-Made: Life’s a Breeze V1:
8,192sqm parcel or larger - Sky placement only
Modern 2 Story home
3 bedrooms - 3 baths (Set up as a guest room and a nursery)

Furnished with a mix of PG and Adult furniture. Driveway with covered parking. Custom pool built into the house. Zen/Meditation area with sauna and outdoor shower. BBQ Area with outdoor dining.
Bento Dispensers through-out. XTV with hundreds of movies and TV shows.

Land Impact: 2015
Size: 80 x 80
Price: L$20,000

Gold Pre-Made: Top Tier Penthouse:
4,096sqm parcel or larger - Sky placement only
Modern 1 story penthouse
3 Bedrooms - 2 Baths (Set up as 2 bedrooms and a gaming room)

Fully Furnished with a Mix of A & PG Furniture.
Pool, Barbecue area, Fitness & Meditation area.
Private Primary suite patio w/ hot tub & outdoor shower. Bento Dispensers through-out, XTV with hundreds of movies and TV shows.

Land Impact: 1839
Size: 49 x 49
Price: L$20,000

Gold Pre-Made: The Carlton Penthouse
4,096sqm parcel or larger - Sky placement only
PBR Viewer Required
Modern 2 story penthouse
3 Bedrooms - 1 Bath (Set up as 2 bedrooms and an office)

Fully Furnished with a mix of PG and Adult furniture.
Infinity pool w/ lounging animations, Barbecue area. Large modern frameless glass windows. Large marble wraparound fireplace. Bento Dispensers through-out, XTV with hundreds of movies and TV shows.

Land Impact: 1238
Size: 48 x 48
Price: L$20,000

Gold Pre-Made: Monochrome Manor
8,192sqm parcel or larger - Ground placement
PBR Viewer Required
2 bedrooms - 2 baths

Furnished with a mix of PG and Adult furniture. Large curved driveway. Pool & Hot tub. BBQ Area with outdoor dining. Bento Dispensers through-out. Quaint beaches and dock areas. Coffee Shop on the road included.

Land Impact: 2344
Size: 128 x 64
Price: L$20,000

Gold Pre-Made: The Gilded Loft
This is a standalone build - only a small amount of exterior included.
For ground or sky placement
PBR Viewer Required
Modern 4 story loft w/ helipad rooftop
2 Bedrooms - 2 Bath

Fully Furnished with a mix of PG and Adult furniture. Includes Lobby, Main living with large fish tank, Double primary suites with walk through closet, and indoor pool and fitness. Bento Dispensers through-out.

Land Impact: 1240
Size: 23 x 20
Price: L$20,000

*Note; streets, street details, extra builds not included. Fenced in exterior only.

Silver Pre-Mades Overview:
SILVER Pre-Mades are made for ground and sky placement. They include full interior and exterior services. Modifications are added for a more custom look and feel. SILVER are made to accommodate 4096sqm parcels or larger. (see specific premade for additional information on placement and land size). Starting at L$10,000+. To view the details options visit this pre-mades site: https://www.callidoradesigns.com/pre-madedesigns 

Silver Pre-Made: Havencliff Ridge
8,192sqm parcel or larger - Ground placement
PBR Viewer Required
Modern 3 story Cliff house
1 Bedrooms - 1 Bath

Furnished with a mix of PG and Adult furniture. Fully furnished Cave Spa - Animated cave with fully furnished spa (2 massage tables, showers, sauna). Roof top deck with barbeque and hot tub. Quaint enclosed driveway with rocky beach access. XTV with movies and shows. Bento Dispensers through-out.

Land Impact: 2243 (prims will vary depending on privacy walls needed for your parcel.)
Size: 128 x 64
Price: L$18,000

Silver Pre-Made: The Eclipse Penthouse
4,096 sqm parcel or larger - Sky placement only
PBR Viewer Required
Modern 2 story home
2 Bedrooms - 2 Baths

Furnished with a mix of PG and Adult furniture. Primary suite featuring a private bathroom and walk in closet. Office area. Patio featuring a pool, dining area, BBQ, and lounging. Meditation area. Bento Dispensers through-out.

Land Impact: 820
Size: 45 x 45
Price: L$18,000

Silver Pre-Made: Dark Luxury
8,192sqm parcel or larger - Sky placement only
Dark Modern 1 story w/ loft
1 Bedroom - 1 Bath

Fully Furnished with a mix of PG and Adult furniture. Large Kitchen features a built in breakfast nook and large island. Large bar area with fish tank. Office with pod-casting area. Closed-in outdoor area with Jacuzzi and outdoor shower. Wine & Cigar Room. Luxury bathroom with sauna. Bento Dispensers through-out, XTV with hundreds of movies and TV shows.

Land Impact: 1493
Size: 53 x 30
Price: L$18,000

Silver Pre-Made: Hollywood Moody
8,192sqm parcel or larger - Sky placement only
Modern 3 story home
3 Bedrooms - 2 Baths

Furnished with a mix of PG and Adult furniture - Extra bedrooms and a flex room in the basement have been left unfurnished. Primary suite featuring a private bathroom and a private balcony. Office with a conference area. A back patio featuring a beautiful pool, hot tub, dining area, BBQ, and lounging. A luxurious underground garage. A finished basement featuring movie theater, bowling, arcade games, a dance studio, meditation, a sauna, and yoga. Bento Dispensers through-out, XTV with hundreds of movies and TV shows.

Land Impact: 1896
Size: 63 x 63
Price: L$15,000

Silver Pre-Made: The Bordeaux
4096sqm parcel or larger - Sky placement only
Dark Modern 1 story w/ loft
1 Bedroom - 1 Bath

Fully Furnished with High-end Adult furniture. Modified open concept layout with spiral staircase & glass. Kitchen features a built-in breakfast nook and large island. Bento Dispensers through-out, XTV with hundreds of movies and TV shows.

Land Impact: 492
Size: 32 x 16
Price: L$15,000

Silver Pre-Made: The Corpo Penthouse
4,096sqm parcel or larger - Sky placement only
Modern 2 story home
1 Bedroom - 1 Bath

Furnished with a mix of PG and Adult furniture. Custom animated pool. Zen/Meditation area with sauna. BBQ Area with outdoor dining. Changeable surround. Bento Dispensers through-out, XTV with hundreds of movies and TV shows.

Land Impact: 1076
Size: 48 x 48
Price: L$15,000

Silver Pre-Made: The Opus Residence
4,096sqm parcel or larger - Sky placement only
PBR Viewer Required
Modern 1 story home
1 Bedroom - 1 Bath.

Build is a custom structure. Open concept main living; with living room, kitchen, and dining. Outside living with pool, hot tub, loungers, and double barbecues. Driveway fits more than one vehicle. Lush greenery and outdoor landscape.

Land Impact: 1147
Size: 46 x 47
Price: L$15,000

Silver Pre-Made: Autumn Crest Tiny Retreat
4096sqm parcel or larger - Ground placement
PBR Viewer Required
Modern Tiny Home
1 Bedroom - 1 Bath

Furnished with a mix of PG and Adult furniture. Heated animated pool. Zen/Meditation area. Outdoor seating and dining. Bento Dispensers through-out, XTV with hundreds of movies and TV shows.

Land Impact: 962
Size: 64 x 64
Price: L$15,000

Bronze Pre-Mades Overview:
BRONZE Pre-Mades are made for sky placement or ground placement with no exterior. They include full interior services. BRONZE are made to accommodate a 4096 parcel or larger.(see specific premade for additional information on placement and land size). Starting at L$5,000+. To view the details options visit this pre-mades site: https://www.callidoradesigns.com/pre-madedesigns.

Bronze Pre-Made: Pink Pacific
4096sqm parcel or larger - Sky placement
Modern 2 story penthouse
3 Bedrooms - 1 Bath (Set up as 2 bedrooms and an office)
Fully Furnished with a mix of PG and Adult furniture.

Infinity pool w/ lounging animations, Barbecue area. Large modern frameless glass windows. Large marble wraparound fireplace. Bento Dispensers through-out, XTV with hundreds of movies and TV shows.

Land Impact: 1079
Size: 31 x 25
Price: L$9,000

Bronze Pre-Made: Bossy
This is a standalone build - no exterior included.
For ground or sky placement
Girly Modern 3 Story home
1 bedroom - 1 bath + office

Fully Furnished with a mix of PG and Adult furniture.
Bento Dispensers through-out, XTV with hundreds of movies and TV shows.

Land Impact: 947 
Size: 22.5 x 14.5
Price: L$8,000

Bronze Pre-Made: Downtown Greenery
4096sqm parcel or larger - Sky placement only
Modern 2 Story penthouse
2 Bedrooms - 2 Baths w/ office

Fully Furnished with a mix of PG and Adult furniture. Terrace with Hot tub, Outdoor Dining, and BBQ Area. Fully stocked Interactive Bar. Bento Dispensers through-out, XTV with hundreds of movies and TV shows.

Land Impact:1153
Size: 48 x 45
Price: L$8,000

Bronze Pre-Made: Dark Maple
4096sqm parcel or larger - Sky placement only
Modern 1 Story home
2 Bedrooms - 1 Bath w/ office

Fully Furnished with a mix of PG and Adult furniture. Large kitchen peninsula. Living & Dining room built-ins. Bento Dispensers through-out, XTV with hundreds of movies and TV shows.

Land Impact: 652
Size: 28 x 38
Price: L$8,000

Bronze Pre-Made: Riesling Studio
4096sqm parcel or larger - Sky placement only
Modern Elongated Studio
Studio - 1 Bath

Fully Furnished with a mix of PG and Adult furniture. Open concept living space, including large living area, kitchen and dining. Bedroom area with walk in closet. Large modern glass windows surround. Bento Dispensers through-out, XTV with hundreds of movies and TV shows.

Land Impact: 569
Size: 48 x 48
Price: L$7,500

Bronze Pre-Made: Suite 214
4096sqm parcel or larger - Sky placement only
Hotel Suite
1 Bedroom - 1 Bath

Fully Furnished with a mix of PG and Adult furniture. Kitchenette, dining, and living space. Cozy outside patio with hot tub. Bento Dispensers through-out.

Land Impact: 372
Size: Build 13 x 15 Surround 42 x 36
Price: L$5,000

Commercial Overview:
Commercial Pre-Mades include full interior services. (see specific premade for additional information on placement and land size). Starting at L$5,000+.To view the details options visit this pre-mades site: https://www.callidoradesigns.com/pre-madedesigns. List of options include:

Coral Kingdom Aquarium: Fully furnished Aquarium & Restaurant.
Just for Kicks: Fully furnished sneaker store.
24-Seven Mini Mart: Fully furnished mini mart. Office and storage room.
Slice Pizza: Fully furnished pizzeria.
Chipotle: Fully furnished Mexican grill.
Chick-Fill Ya: Fully furnished chicken restaurant.
Locks & Lacquer: Fully furnished nail and hair salon.
Grind Coffee House & Eatery: Fully furnished cafe.
The Green Room: Fully furnished weed dispensary.
Mumbl Cookies: Fully furnished cookie shop.

Holiday and Event Venues Overview:
Holidays, special occasions, and events (see specific premade for additional information on placement and land size). Starting at L$5,000+. To view the details options visit this pre-mades site: https://www.callidoradesigns.com/pre-madedesigns. List of options include:
Temptation Tower - Full Version: Fully furnished Adult Date night/V-day Venue.
Temptation Tower - Suite Only: Fully furnished Adult Date night/V-day Penthouse Suite.

Callidora’s Catering Overview:
Skip the stove, savor the luxury with Callidora Catering. Our luxury catering is designed to impress, offering sleek presentation, premium ingredients, and seamless service. Whether you’re hosting an intimate dinner or a large-scale event, we ensure every detail is flawlessly executed. For MyStory roleplay only, custom bundles for events can be arranged. Visit the Callidora Catering site for more information: https://www.callidoradesigns.com/callidoracatering 

Callidora Catering Website Link:
https://www.callidoradesigns.com/callidoracatering 

Catering Bundles Overview:
Bundles meant to fit with our [CD-PREMADES]. Bundles have x5 of each item in your package, uses vary depending on item. For more detailed information on the bundles and pricing visit https://www.callidoradesigns.com/callidoracatering. List of options include:

Pre-Made Bundles
Meal Bundles
Drink Bundles
Designer Drugs Bundles
Seasonal Bundles

Callidora Designs Collections Overview:
Indulge in the ultimate expression of style and luxury with our exclusive curated collections. Designed for discerning tastes, each piece reflects unparalleled craftsmanship and timeless sophistication. Elevate your surroundings, make a statement, and enjoy a lifestyle defined by distinction and refinement. For more detailed information on the curated collections and pricing visit https://www.callidoradesigns.com/collections. List of options include:

Callidora Designs Collection Website Link: https://www.callidoradesigns.com/collections 

[CD] Beverly Hills Collection: Elevate your outdoor spaces with the [CD] Beverly Hills Collection, a curated selection of iconic signage, elegant seating, and refined planters that combine timeless design with exceptional craftsmanship. Each piece exudes sophistication, durability, and style. Designed to enhance any environment, this collection offers a seamless blend of classic elegance and modern functionality, making every space feel both luxurious and inviting.

[CD] Downtown Aspen Collection: Discover the charm and sophistication of mountain living with the [CD] Downtown Aspen Collection — a curated selection inspired by the timeless elegance of Aspen’s city center. This set features exquisite details such as a classic carriage, ornate lamp posts, stone planters with seasonal variations, and beautifully crafted city elements including a fountain grate, info booth, and city limit sign. Each piece captures the warmth and refinement of an upscale alpine retreat, blending functionality and artistry to create an atmosphere of luxury and authenticity in any setting.

Callidora Designs Portfolio Overview:
At Callidora Designs, we believe in the transformative power of design to elevate spaces and enrich our virtual lives. With a passion for innovation and an unwavering commitment to quality, we bring unparalleled expertise and creativity to every project. Whether it's terraforming outdoor landscapes or crafting interior sanctuaries, we are dedicated to creating virtual environments that inspire, rejuvenate, and reflect the unique essence of each client, infusing each design with personality, style, and functionality. To view photos and get more detailed information on portfolio projects visit https://www.callidoradesigns.com/. 

Callidora Designs Portfolio Website Link: https://www.callidoradesigns.com/ 

Who is Mina Callidora?:
Mina Callidora is the founder of Callidora Designs and Callidora Cove and is known for her vision in creating luxurious living spaces and vibrant community experiences in Second Life. She has a passion for design, hospitality, and ensuring that residents and guests feel valued and at home. If you’re curious about her work or contributions, just let me know!
`;

// -------------------------
// Helper to build system prompt
// -------------------------
function buildSystemPrompt(userName, isFirstMessage) {
  const now = new Date();
  const sltString = now.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    hour12: true,
  });
  const utcString = now.toISOString();

  return `
You are Calli, the Callidora Cove Concierge in Second Life.

PERSONA & TONE
- Warm, friendly, professional, and human.
- You help with:
  - Callidora Designs
  - Callidora Cove
  - Their rentals, services, pre-mades, catering, and collections
  - General Second Life questions
  - General real-world questions.

GREETING RULES
- If this is the FIRST message in the session (isFirstMessage = true):
  - Greet the user by name once, e.g. "Hi ${userName}, I'm Calli..."
- If this is NOT the first message:
  - Do NOT re-introduce yourself.
  - Do NOT start with "Hello ${userName}" every time.
  - Just continue the conversation naturally.

TIME & DATE
- Current real-world UTC time: ${utcString}
- Second Life Time (SLT) = America/Los_Angeles timezone.
- Right now, SLT is approximately: ${sltString}
- If asked "What time is it in SLT?", answer with this SLT time and date.

KNOWLEDGE POLICY
1) CALLIDORA-SPECIFIC QUESTIONS
   - Use the Callidora knowledge block as the single source of truth for:
     - Callidora Designs
     - Callidora Cove
     - Their services, rentals, pre-mades, catering, collections, amenities, and Mina.
   - If a Callidora detail is not in the notes, say you don’t have that information instead of guessing.

2) GENERAL SECOND LIFE & REAL-WORLD QUESTIONS
   - You may use your full general knowledge.
   - You can answer about Second Life broadly (building, sailing, yachting regions, etc.) and real-world facts.

3) PRE-MADE CATEGORIES vs CATERING BUNDLES
   - Pre-made categories (builds/homes) are:
     - Elite, Gold, Silver, Bronze, Commercial, Holiday / Event Venues.
   - Catering bundles belong to Callidora Catering:
     - Pre-Made Bundles, Meal Bundles, Drink Bundles, Designer Drugs Bundles, Seasonal Bundles.
   - Never mix these up.
   - If the user asks for "pre-made categories", answer with Elite / Gold / Silver / Bronze / Commercial / Holiday-Event.
   - If the user asks about "catering bundles", answer with the bundle list.

4) FULL LIST ANSWERS
   - When the user asks "what Elite pre-mades are there", "what Silver pre-mades are there", "what commercial pre-mades are there", or similar:
     - Give the full list from the notes, with brief details (bedrooms, baths, key amenities, and optionally land impact/size).

STYLE
- Use their display name "${userName}" sometimes, not in every sentence.
- Use bullet points and short paragraphs.
- No hallucinations for Callidora details.
- Include website links from the notes when helpful.

CALLIDORA KNOWLEDGE:
${callidoraKnowledge}
`;
}

// -------------------------
// POST /chat endpoint
// -------------------------
app.post("/chat", async (req, res) => {
  try {
    const { user, name, message } = req.body;

    const userId = user || "anonymous";
    if (!sessions[userId]) {
      sessions[userId] = [];
    }
    const history = sessions[userId];

    const isFirstMessage = history.length === 0;
    const systemPrompt = buildSystemPrompt(name || "Resident", isFirstMessage);

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: messages,
    });

    const reply =
      response.output &&
      response.output[0] &&
      response.output[0].content &&
      response.output[0].content[0] &&
      response.output[0].content[0].text
        ? response.output[0].content[0].text
        : "I'm sorry, I couldn't generate a response.";

    history.push({ role: "user", content: message });
    history.push({ role: "assistant", content: reply });

    if (history.length > 20) {
      sessions[userId] = history.slice(-20);
    }

    return res.json({ reply });
  } catch (err) {
    console.error("Error in /chat:", err);
    return res
      .status(500)
      .json({ reply: "I'm sorry — something went wrong on my server." });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("Callidora Concierge - Calli AI is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
