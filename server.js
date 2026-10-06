// server.js
// Callidora Concierge - Calli AI
// Express + OpenAI backend

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";
import pg from "pg";
import { createServer } from "http";
import { WebSocketServer } from "ws";

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
To get a project quote message willahmina in-world and review her social links:
Linktree: https://linktr.ee/callidoradesigns
Primfeed: https://www.primfeed.com/willahmina.resident
Instagram: https://www.instagram.com/mina.callidora_sl
Secondlife Profile: https://world.secondlife.com/resident/b687b9a7-00b1-4090-bbba-d0d053cfc694

Callidora Cove’s Luxury Rentals:
Callidora Designs presents a curated selection of just 10 exclusive rentals located at Callidora Cove. Discover our unique portfolio, thoughtfully crafted to match your luxury lifestyle. Whether you’re seeking a cozy studio, a luxurious penthouse, or family estate, we offer options designed to suit your needs. Whether you're searching for a temporary residence or a long-term home, our properties feature modern amenities, prime locations, and exceptional management services. Browse our listings to find your perfect rental match and embark on your next chapter with ease.

Callidora Cove’s Luxury Rentals Website Link:
https://www.callidoradesigns.com/luxury-rentals 

Callidora Cove’s Luxury Rentals Availability Link:
https://www.casperpanel.com/rentals/SSuwXonBOCiQyr5s/available

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
Mina Callidora is the founder of Callidora Designs and Callidora Cove and is known for her vision in creating luxurious living spaces and vibrant community experiences in Second Life. She has a passion for design, hospitality, and ensuring that residents and guests feel valued and at home. If you’re curious about her work or contributions, just let me know! Also, make sure you take a moment to review her social links!

Linktree: https://linktr.ee/callidoradesigns 
Primfeed: https://www.primfeed.com/willahmina.resident
Instagram: https://www.instagram.com/mina.callidora_sl 
Secondlife Profile: https://world.secondlife.com/resident/b687b9a7-00b1-4090-bbba-d0d053cfc694
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

5) RENTAL AVAILABILITY & APPLYING
   - When the user asks about rentals, availability, openings, or how to apply (e.g. "are there any open rentals right now?", "can I apply?"):
     - Briefly describe that there are 10 curated luxury rentals at Callidora Cove.
     - Always include BOTH of these links:
       - Luxury Rentals page: https://www.callidoradesigns.com/luxury-rentals
       - Live availability (CasperPanel): https://www.casperpanel.com/rentals/SSuwXonBOCiQyr5s/available

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


// ===== V1 LEAGUE DATA API =====
const { Pool } = pg;
const v1Pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    })
  : null;

const v1LegacyName = (value) => String(value || "").trim().replace(/\s+/g, " ").slice(0, 80);
const v1LegacyKey = (value) => v1LegacyName(value).toLowerCase();
const v1RoomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

async function v1Init() {
  if (!v1Pool) {
    console.warn("V1 API disabled: DATABASE_URL is not configured.");
    return;
  }
  await v1Pool.query(`
    CREATE TABLE IF NOT EXISTS v1_players (
      id BIGSERIAL PRIMARY KEY,
      legacy_name TEXT NOT NULL,
      legacy_key TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS v1_results (
      id BIGSERIAL PRIMARY KEY,
      player_id BIGINT NOT NULL REFERENCES v1_players(id) ON DELETE CASCADE,
      mode TEXT NOT NULL DEFAULT 'quick',
      track_id TEXT NOT NULL DEFAULT 'unknown',
      score INTEGER NOT NULL DEFAULT 0,
      finish_position INTEGER,
      fastest_lap_ms INTEGER,
      total_time_ms INTEGER,
      room_code TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS v1_results_player_idx ON v1_results(player_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS v1_results_score_idx ON v1_results(score DESC, created_at DESC);
    CREATE INDEX IF NOT EXISTS v1_results_created_idx ON v1_results(created_at DESC);

    CREATE TABLE IF NOT EXISTS v1_rooms (
      code TEXT PRIMARY KEY,
      host_player_id BIGINT NOT NULL REFERENCES v1_players(id) ON DELETE CASCADE,
      kind TEXT NOT NULL DEFAULT 'private',
      title TEXT NOT NULL DEFAULT 'Private Race',
      track_id TEXT NOT NULL,
      laps INTEGER NOT NULL DEFAULT 5,
      max_players INTEGER NOT NULL DEFAULT 12,
      status TEXT NOT NULL DEFAULT 'lobby',
      settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      started_at TIMESTAMPTZ,
      finished_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS v1_room_members (
      room_code TEXT NOT NULL REFERENCES v1_rooms(code) ON DELETE CASCADE,
      player_id BIGINT NOT NULL REFERENCES v1_players(id) ON DELETE CASCADE,
      is_host BOOLEAN NOT NULL DEFAULT FALSE,
      status TEXT NOT NULL DEFAULT 'joined',
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (room_code, player_id)
    );

    CREATE TABLE IF NOT EXISTS v1_championships (
      id BIGSERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS v1_championship_rounds (
      id BIGSERIAL PRIMARY KEY,
      championship_id BIGINT NOT NULL REFERENCES v1_championships(id) ON DELETE CASCADE,
      round_number INTEGER NOT NULL,
      room_code TEXT REFERENCES v1_rooms(code) ON DELETE SET NULL,
      track_id TEXT NOT NULL,
      laps INTEGER NOT NULL DEFAULT 5,
      UNIQUE(championship_id, round_number)
    );
  `);
  console.log("V1 League data tables ready.");
}
v1Init().catch((err) => console.error("V1 database init failed:", err));

async function v1UpsertPlayer(legacyName) {
  const name = v1LegacyName(legacyName);
  if (!name) throw new Error("SL Legacy Name is required");
  const key = v1LegacyKey(name);
  const { rows } = await v1Pool.query(
    `INSERT INTO v1_players (legacy_name, legacy_key)
     VALUES ($1, $2)
     ON CONFLICT (legacy_key)
     DO UPDATE SET legacy_name = EXCLUDED.legacy_name, last_seen_at = NOW()
     RETURNING *`,
    [name, key]
  );
  return rows[0];
}

app.get("/v1/health", async (req, res) => {
  if (!v1Pool) return res.status(503).json({ ok: false, database: false });
  try {
    await v1Pool.query("SELECT 1");
    res.json({ ok: true, database: true });
  } catch (err) {
    res.status(503).json({ ok: false, database: false });
  }
});

app.post("/v1/players", async (req, res) => {
  if (!v1Pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const player = await v1UpsertPlayer(req.body?.legacyName);
    const { rows } = await v1Pool.query(
      `SELECT COUNT(*)::int AS races,
              COALESCE(MAX(score),0)::int AS best_score,
              COUNT(*) FILTER (WHERE finish_position = 1)::int AS wins,
              MIN(fastest_lap_ms) FILTER (WHERE fastest_lap_ms > 0)::int AS fastest_lap_ms
       FROM v1_results WHERE player_id=$1`,
      [player.id]
    );
    res.json({ player, stats: rows[0] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/v1/players/:legacyName", async (req, res) => {
  if (!v1Pool) return res.status(503).json({ error: "Database unavailable" });
  const key = v1LegacyKey(req.params.legacyName);
  const { rows } = await v1Pool.query(
    `SELECT p.*,
            COUNT(r.id)::int AS races,
            COALESCE(MAX(r.score),0)::int AS best_score,
            COUNT(r.id) FILTER (WHERE r.finish_position=1)::int AS wins,
            MIN(r.fastest_lap_ms) FILTER (WHERE r.fastest_lap_ms > 0)::int AS fastest_lap_ms
     FROM v1_players p
     LEFT JOIN v1_results r ON r.player_id=p.id
     WHERE p.legacy_key=$1
     GROUP BY p.id`,
    [key]
  );
  if (!rows.length) return res.status(404).json({ error: "Player not found" });
  res.json(rows[0]);
});

app.post("/v1/results", async (req, res) => {
  if (!v1Pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const player = await v1UpsertPlayer(req.body?.legacyName);
    const {
      mode = "quick", trackId = "unknown", score = 0, finishPosition = null,
      fastestLapMs = null, totalTimeMs = null, roomCode = null,
    } = req.body || {};
    const { rows } = await v1Pool.query(
      `INSERT INTO v1_results
        (player_id, mode, track_id, score, finish_position, fastest_lap_ms, total_time_ms, room_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        player.id, String(mode).slice(0,30), String(trackId).slice(0,50),
        Math.max(0, Number(score)||0), finishPosition ? Number(finishPosition) : null,
        fastestLapMs ? Number(fastestLapMs) : null, totalTimeMs ? Number(totalTimeMs) : null,
        roomCode ? String(roomCode).slice(0,12).toUpperCase() : null,
      ]
    );
    res.status(201).json({ result: rows[0] });
  } catch (err) {
    console.error("V1 result error:", err);
    res.status(400).json({ error: err.message });
  }
});

app.get("/v1/leaderboard", async (req, res) => {
  if (!v1Pool) return res.status(503).json({ error: "Database unavailable" });
  const period = ["daily","weekly","all"].includes(req.query.period) ? req.query.period : "daily";
  const limit = Math.min(100, Math.max(1, Number(req.query.limit)||50));
  const where = period === "daily"
    ? `r.created_at >= (date_trunc('day', NOW() AT TIME ZONE 'America/Los_Angeles') AT TIME ZONE 'America/Los_Angeles')`
    : period === "weekly" ? `r.created_at >= NOW() - INTERVAL '7 days'` : "TRUE";
  const { rows } = await v1Pool.query(
    `SELECT p.legacy_name,
            MAX(r.score)::int AS score,
            COUNT(r.id)::int AS races,
            MIN(r.fastest_lap_ms) FILTER (WHERE r.fastest_lap_ms > 0)::int AS fastest_lap_ms
     FROM v1_results r
     JOIN v1_players p ON p.id=r.player_id
     WHERE ${where}
     GROUP BY p.id, p.legacy_name
     ORDER BY score DESC, fastest_lap_ms ASC NULLS LAST
     LIMIT $1`,
    [limit]
  );
  res.json({ period, updatedAt: new Date().toISOString(), entries: rows });
});

app.post("/v1/rooms", async (req, res) => {
  if (!v1Pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const host = await v1UpsertPlayer(req.body?.legacyName);
    const kind = req.body?.kind === "official" ? "official" : "private";
    const trackId = String(req.body?.trackId || "spa").slice(0,50);
    const laps = Math.min(100, Math.max(1, Number(req.body?.laps)||5));
    const maxPlayers = Math.min(24, Math.max(2, Number(req.body?.maxPlayers)||12));
    let code = v1RoomCode();
    for (let i=0;i<5;i++) {
      const exists = await v1Pool.query("SELECT 1 FROM v1_rooms WHERE code=$1", [code]);
      if (!exists.rowCount) break;
      code = v1RoomCode();
    }
    const title = String(req.body?.title || (kind === "official" ? "V1 Official Race" : "Private Race")).slice(0,100);
    await v1Pool.query("BEGIN");
    try {
      await v1Pool.query(
        `INSERT INTO v1_rooms(code,host_player_id,kind,title,track_id,laps,max_players,settings)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
        [code,host.id,kind,title,trackId,laps,maxPlayers,JSON.stringify(req.body?.settings || {})]
      );
      await v1Pool.query(
        "INSERT INTO v1_room_members(room_code,player_id,is_host) VALUES($1,$2,TRUE)",
        [code,host.id]
      );
      await v1Pool.query("COMMIT");
    } catch (e) {
      await v1Pool.query("ROLLBACK");
      throw e;
    }
    res.status(201).json({ code, joinUrl: `${req.get("origin") || ""}/?v1room=${code}` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/v1/rooms/:code/join", async (req, res) => {
  if (!v1Pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const code = String(req.params.code).toUpperCase();
    const player = await v1UpsertPlayer(req.body?.legacyName);
    const room = await v1Pool.query("SELECT * FROM v1_rooms WHERE code=$1", [code]);
    if (!room.rowCount) return res.status(404).json({ error: "Race room not found" });
    if (room.rows[0].status !== "lobby") return res.status(409).json({ error: "Race has already started" });
    const count = await v1Pool.query("SELECT COUNT(*)::int AS n FROM v1_room_members WHERE room_code=$1", [code]);
    if (count.rows[0].n >= room.rows[0].max_players) return res.status(409).json({ error: "Race room is full" });
    await v1Pool.query(
      `INSERT INTO v1_room_members(room_code,player_id)
       VALUES($1,$2) ON CONFLICT(room_code,player_id) DO NOTHING`,
      [code,player.id]
    );
    res.json({ ok: true, code });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/v1/rooms/:code", async (req, res) => {
  if (!v1Pool) return res.status(503).json({ error: "Database unavailable" });
  const code = String(req.params.code).toUpperCase();
  const room = await v1Pool.query("SELECT * FROM v1_rooms WHERE code=$1", [code]);
  if (!room.rowCount) return res.status(404).json({ error: "Race room not found" });
  const members = await v1Pool.query(
    `SELECT p.legacy_name, m.is_host, m.status, m.joined_at
     FROM v1_room_members m JOIN v1_players p ON p.id=m.player_id
     WHERE m.room_code=$1 ORDER BY m.is_host DESC, m.joined_at ASC`,
    [code]
  );
  res.json({ room: room.rows[0], members: members.rows });
});

app.post("/v1/rooms/:code/start", async (req, res) => {
  if (!v1Pool) return res.status(503).json({ error: "Database unavailable" });
  const code = String(req.params.code).toUpperCase();
  const key = v1LegacyKey(req.body?.legacyName);
  const { rows } = await v1Pool.query(
    `SELECT r.* FROM v1_rooms r JOIN v1_players p ON p.id=r.host_player_id
     WHERE r.code=$1 AND p.legacy_key=$2`,
    [code,key]
  );
  if (!rows.length) return res.status(403).json({ error: "Only the host can start this race" });
  const updated = await v1Pool.query(
    `UPDATE v1_rooms SET status='started', started_at=NOW()
     WHERE code=$1 AND status='lobby' RETURNING *`,
    [code]
  );
  if (!updated.rowCount) return res.status(409).json({ error: "Race is not in lobby state" });
  res.json({ room: updated.rows[0] });
});



// ===== V1 REAL-TIME RACE SERVER =====
const v1RealtimeRooms = new Map();
const V1_POINTS = [25,18,15,12,10,8,6,4,2,1];

function v1RtSafeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 80);
}
function v1RtSafeCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}
function v1RtRoom(code) {
  let room = v1RealtimeRooms.get(code);
  if (!room) {
    room = {
      code, players: new Map(), expectedCount: 0, status: "waiting", armed: false,
      trackId: null, laps: 0, trackLength: 0, startAt: 0,
      finishOrder: [], lastBroadcast: 0, createdAt: Date.now(),
    };
    v1RealtimeRooms.set(code, room);
  }
  return room;
}
function v1RtPublicPlayer(p) {
  return {
    legacyName: p.legacyName, driverId: p.driverId || null, teamId: p.teamId || null,
    isHost: !!p.isHost, connected: !!p.connected, ready: !!p.ready, finished: !!p.finished,
    finishPosition: p.finishPosition || null, dnf: !!p.dnf,
    state: p.state || null,
  };
}
function v1RtBroadcast(room, payload) {
  const text = JSON.stringify(payload);
  for (const p of room.players.values()) {
    if (p.ws?.readyState === 1) {
      try { p.ws.send(text); } catch {}
    }
  }
}
function v1RtSnapshot(room) {
  const ordered = [...room.players.values()].sort((a, b) => {
    if (a.finished || b.finished) {
      if (a.finished && b.finished) return (a.finishPosition || 999) - (b.finishPosition || 999);
      return a.finished ? -1 : 1;
    }
    return (b.state?.totalDist || 0) - (a.state?.totalDist || 0);
  });
  return {
    type: "snapshot", room: room.code, status: room.status,
    startAt: room.startAt || 0, trackId: room.trackId, laps: room.laps,
    expectedCount: room.expectedCount,
    players: ordered.map((p, i) => ({ ...v1RtPublicPlayer(p), position: p.finishPosition || i + 1 })),
    finishOrder: room.finishOrder.map(v1RtPublicPlayer),
    serverNow: Date.now(),
  };
}
function v1RtMaybeStart(room) {
  if (room.status !== "waiting" || !room.armed) return;
  const ready = [...room.players.values()].filter(p => p.connected && p.ready).length;
  const needed = Math.max(1, room.expectedCount || ready);
  if (ready < needed) return;
  room.status = "countdown";
  room.startAt = Date.now() + 5000;
  for (const p of room.players.values()) {
    p.startDistance = null;
    p.finished = false;
    p.finishPosition = null;
    p.dnf = false;
  }
  v1RtBroadcast(room, { type: "countdown", startAt: room.startAt, serverNow: Date.now(), seconds: 5 });
  setTimeout(() => {
    if (room.status !== "countdown") return;
    room.status = "racing";
    v1RtBroadcast(room, { type: "green", startAt: room.startAt, serverNow: Date.now() });
  }, Math.max(0, room.startAt - Date.now()));
}
async function v1RtSubmitResult(room, player) {
  if (player.resultSubmitted) return;
  player.resultSubmitted = true;
  try {
    await fetch("https://v1-league-online.floot.app/_api/v1-result", {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({
        legacyName: player.legacyName,
        mode: "multiplayer",
        trackId: room.trackId || "unknown",
        score: V1_POINTS[(player.finishPosition || 99) - 1] || 0,
        finishPosition: player.finishPosition || null,
        fastestLapMs: player.bestLapMs || null,
        totalTimeMs: player.finishTimeMs || null,
        roomCode: room.code,
      }),
    });
  } catch (err) {
    console.error("V1 realtime result sync failed:", err);
    player.resultSubmitted = false;
  }
}
function v1RtFinish(room, player) {
  if (player.finished) return;
  player.finished = true;
  player.finishPosition = room.finishOrder.length + 1;
  player.finishTimeMs = Math.max(0, Date.now() - room.startAt);
  room.finishOrder.push(player);
  v1RtBroadcast(room, {
    type: "finish",
    legacyName: player.legacyName,
    finishPosition: player.finishPosition,
    finishTimeMs: player.finishTimeMs,
    classification: room.finishOrder.map(v1RtPublicPlayer),
  });
  v1RtSubmitResult(room, player);
  const active = [...room.players.values()].filter(p => !p.dnf);
  if (active.length && active.every(p => p.finished)) {
    room.status = "finished";
    v1RtBroadcast(room, { type: "raceFinished", classification: room.finishOrder.map(v1RtPublicPlayer) });
  }
}
function v1RtApplyState(room, player, raw) {
  const now = Date.now();
  if (!raw || typeof raw !== "object") return;
  if (player.lastStateAt && now - player.lastStateAt < 25) return; // max ~40 Hz inbound
  const x = Number(raw.x), y = Number(raw.y), z = Number(raw.z);
  const heading = Number(raw.heading), v = Number(raw.v);
  const totalDistRaw = Number(raw.totalDist);
  if (![x,y,z,heading,v,totalDistRaw].every(Number.isFinite)) return;
  const prev = player.state;
  let totalDist = Math.max(0, totalDistRaw);
  if (prev && Number.isFinite(prev.totalDist)) {
    const dt = Math.max(0.025, Math.min(0.5, (now - player.lastStateAt) / 1000));
    const maxAdvance = 125 * dt + 12;
    totalDist = Math.min(totalDist, prev.totalDist + maxAdvance);
    totalDist = Math.max(totalDist, prev.totalDist - 3);
  }
  player.lastStateAt = now;
  player.bestLapMs = Number.isFinite(Number(raw.bestLapMs)) && Number(raw.bestLapMs) > 0
    ? Math.min(player.bestLapMs || Infinity, Number(raw.bestLapMs)) : player.bestLapMs;
  player.state = {
    x, y, z, heading,
    v: Math.max(-20, Math.min(120, v)),
    steer: Number.isFinite(Number(raw.steer)) ? Math.max(-1, Math.min(1, Number(raw.steer))) : 0,
    wheelSpin: Number.isFinite(Number(raw.wheelSpin)) ? Number(raw.wheelSpin) : 0,
    sampleIdx: Number.isFinite(Number(raw.sampleIdx)) ? Math.max(0, Math.floor(Number(raw.sampleIdx))) : 0,
    totalDist,
    lap: Number.isFinite(Number(raw.lap)) ? Math.max(-1, Math.floor(Number(raw.lap))) : -1,
    timestamp: now,
  };
  if (room.status === "racing") {
    if (player.startDistance == null) player.startDistance = totalDist;
    const target = player.startDistance + Math.max(1, room.laps) * Math.max(100, room.trackLength);
    if (totalDist >= target) v1RtFinish(room, player);
  }
  if (now - room.lastBroadcast >= 30) {
    room.lastBroadcast = now;
    v1RtBroadcast(room, v1RtSnapshot(room));
  }
}

const v1HttpServer = createServer(app);
const v1Wss = new WebSocketServer({ server: v1HttpServer, path: "/v1/realtime" });

v1Wss.on("connection", (ws, request) => {
  let url;
  try { url = new URL(request.url, "https://v1.local"); } catch { ws.close(1008, "Bad URL"); return; }
  const code = v1RtSafeCode(url.searchParams.get("room"));
  const legacyName = v1RtSafeName(url.searchParams.get("name"));
  if (!code || !legacyName) { ws.close(1008, "Room and Legacy Name required"); return; }
  const key = legacyName.toLowerCase();
  const room = v1RtRoom(code);
  let player = room.players.get(key);
  if (!player) {
    player = {
      legacyName, key, ws, connected: true, ready: false, driverId: null, teamId: null,
      isHost: url.searchParams.get("host") === "1",
      state: null, lastStateAt: 0, startDistance: null,
      finished: false, finishPosition: null, dnf: false, resultSubmitted: false,
    };
    room.players.set(key, player);
  } else {
    try { player.ws?.close(4001, "Reconnected elsewhere"); } catch {}
    player.ws = ws; player.connected = true; player.dnf = false;
    player.isHost = player.isHost || url.searchParams.get("host") === "1";
  }
  ws._v1 = { room, player };
  ws.send(JSON.stringify({ type: "welcome", room: code, status: room.status, serverNow: Date.now(), startAt: room.startAt || 0 }));
  v1RtBroadcast(room, v1RtSnapshot(room));

  ws.on("message", (buffer) => {
    let msg;
    try { msg = JSON.parse(String(buffer)); } catch { return; }
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "ready") {
      player.ready = true;
      player.driverId = String(msg.driverId || "").slice(0, 50) || null;
      player.teamId = String(msg.teamId || "").slice(0, 50) || null;
      const expected = Math.max(1, Math.min(24, Number(msg.expectedCount) || 1));
      room.expectedCount = Math.max(room.expectedCount, expected);
      if (!room.trackId) room.trackId = String(msg.trackId || "unknown").slice(0, 50);
      if (!room.laps) room.laps = Math.max(1, Math.min(100, Number(msg.laps) || 5));
      if (!room.trackLength) room.trackLength = Math.max(100, Math.min(20000, Number(msg.trackLength) || 5000));
      v1RtBroadcast(room, v1RtSnapshot(room));
      v1RtMaybeStart(room);
      return;
    }
    if (msg.type === "arm") {
      room.armed = true;
      room.expectedCount = Math.max(1, Math.min(24, Number(msg.expectedCount) || room.expectedCount || 1));
      room.trackId = String(msg.trackId || room.trackId || "unknown").slice(0, 50);
      room.laps = Math.max(1, Math.min(100, Number(msg.laps) || room.laps || 5));
      room.trackLength = Math.max(100, Math.min(20000, Number(msg.trackLength) || room.trackLength || 5000));
      v1RtBroadcast(room, v1RtSnapshot(room));
      v1RtMaybeStart(room);
      return;
    }
    if (msg.type === "restart") {
      if (!player.isHost) return;
      room.status = "waiting";
      room.armed = false;
      room.startAt = 0;
      room.finishOrder = [];
      room.expectedCount = Math.max(1, Math.min(24, Number(msg.expectedCount) || room.expectedCount || room.players.size || 1));
      for (const p of room.players.values()) {
        p.ready = false;
        p.finished = false;
        p.finishPosition = null;
        p.dnf = false;
        p.state = null;
        p.startDistance = null;
        p.resultSubmitted = false;
      }
      v1RtBroadcast(room, {
        type: "restart",
        restartAt: Date.now() + 1200,
        expectedCount: room.expectedCount,
        trackId: room.trackId,
        laps: room.laps,
        serverNow: Date.now(),
      });
      return;
    }
    if (msg.type === "state") {
      v1RtApplyState(room, player, msg.state);
      return;
    }
    if (msg.type === "leave") {
      ws.close(1000, "Left race");
    }
  });

  ws.on("close", () => {
    if (player.ws !== ws) return;
    player.connected = false;
    v1RtBroadcast(room, { type: "disconnect", legacyName: player.legacyName, graceMs: 30000 });
    setTimeout(() => {
      if (player.connected || player.finished) return;
      player.dnf = true;
      v1RtBroadcast(room, v1RtSnapshot(room));
    }, 30000);
  });
});

setInterval(() => {
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  for (const [code, room] of v1RealtimeRooms) {
    const anyConnected = [...room.players.values()].some(p => p.connected);
    if (!anyConnected && room.createdAt < cutoff) v1RealtimeRooms.delete(code);
  }
}, 10 * 60 * 1000);

// Health check
app.get("/", (req, res) => {
  res.send("Callidora Concierge - Calli AI is running.");
});

const PORT = process.env.PORT || 3000;
v1HttpServer.listen(PORT, () => {
  console.log("Server listening on port", PORT);
  console.log("V1 realtime WebSocket ready at /v1/realtime");
});
