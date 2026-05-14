#!/usr/bin/env node

/**
 * Fix incorrect knowledge entries in Firestore memory collection.
 * Run: npx tsx scripts/fix-knowledge.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!privateKey || !clientEmail || !projectId) {
  console.error("Missing Firebase Admin credentials in .env.local");
  process.exit(1);
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });

const db = getFirestore(app);

interface MemoryEntry {
  content: { en: string; np?: string };
  category: string;
  active: boolean;
  keywords: string[];
  sourceUrl: string;
  createdAt: string;
}

const CORRECT_ENTRIES: MemoryEntry[] = [
  {
    content: {
      en: "MAW Group of Companies\nHeadquarters: Tripureshwor, Teku Road, Kathmandu, Nepal (Postal Code: 44600)\nPhone: 01-5361160\nEmail: info@mawenterprises.com\nBusiness Hours: Sunday to Friday, 10:00 AM – 06:00 PM, Saturday: Closed",
      np: "माव ग्रुप अफ कम्पनीज\nप्रधान कार्यालय: त्रिपुरेश्वर, टेकु रोड, काठमाडौं, नेपाल (पोस्टल कोड: ४४६००)\nफोन: ०१-५३६११६०\nइमेल: info@mawenterprises.com",
    },
    category: "company",
    keywords: ["maw group", "headquarters", "address", "contact", "tripureshwor", "teku road", "kathmandu", "head office"],
    sourceUrl: "https://mawnepal.com/contact/",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    content: {
      en: "ŠKODA Nepal — MAW Expanze Private Limited\nShowroom Address: 263, Ramshahpath, Thapthali, Kathmandu, Nepal\nPhone: +977-01-5316835\nSales Hotline: +977-9801075632\n\nService Center: Sitapaila, Kathmandu\nService Hotline: +977-9801133485\nEmail: skodacare@mawnepal.com",
      np: "स्कोडा नेपाल — एम.ए.डब्लु एक्सपान्जे प्राइभेट लिमिटेड\nशोरुम ठेगाना: २६३, रामशाहपथ, थापाथली, काठमाडौं, नेपाल\nफोन: +९७७-०१-५३१६८३५\nसेवा केन्द्र: सितापाइला, काठमाडौं\nइमेल: skodacare@mawnepal.com",
    },
    category: "company",
    keywords: ["skoda", "showroom", "address", "location", "service center", "contact", "thapthali", "thapathali", "sitapaila", "skodacare"],
    sourceUrl: "https://www.skoda.com.np/company/contact",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    content: {
      en: "Jeep Nepal — Life Automobile PVT LTD (MAW Group)\nShowroom: Narayanchaur, Naxal, Kathmandu, Nepal\nPhone: 01-4523581\n\nService Center: Basundhara, Kathmandu\nService Phone: +977-1-4986923\n\nHours: Sunday to Friday 10:00 AM – 6:00 PM, Saturday 10:30 AM – 2:00 PM\nOther Dealers: Pokhara (Premium Auto Group), Nepalgunj (Gajanan Auto Trading)",
      np: "जीप नेपाल — लाइफ अटोमोबाइल प्राइभेट लिमिटेड (माव समूह)\nशोरुम: नारायणचौर, नक्साल, काठमाडौं, नेपाल\nफोन: ०१-४५२३५८१\nसेवा केन्द्र: वसुन्धरा, काठमाडौं",
    },
    category: "company",
    keywords: ["jeep", "showroom", "address", "location", "naxal", "narayanchaur", "service center", "basundhara", "contact", "dealer"],
    sourceUrl: "https://jeep.com.np/find-a-dealer/",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    content: {
      en: "Deepal (Changan) Nepal — MAW Vriddhi Autocorp.\nShowroom: Tripureshwor, Kathmandu, Nepal\nShowroom Hotline: +977-014547365, 9820022222\nService Hotline: 9704024365\n\nOther Showrooms: Naxal, Birtamode, Birjung, Butwal, Biratnagar, Narayanghat, Pokhara\nService Center: Sitapaila, Kathmandu",
      np: "डिपल (चाङ्गान) नेपाल — माव वृद्धि अटोकर्प\nशोरुम: त्रिपुरेश्वर, काठमाडौं, नेपाल\nफोन: +९७७-०१४५४७३६५\nसेवा केन्द्र: सितापाइला, काठमाडौं",
    },
    category: "company",
    keywords: ["deepal", "changan", "showroom", "address", "location", "tripureshwor", "naxal", "service", "contact"],
    sourceUrl: "https://changannepal.com/contact-us",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    content: {
      en: "SERES Nepal (MAW Group)\nShowroom: Naxal, Kathmandu\nPhone: 9705399131 / 01-5970753\n\nOther Locations: Birtamode, Butwal, Biratnagar, Narayanghat, Pokhara, Ithari\nService Center: Sitapaila, Kathmandu\nService Hotline: 980-2351138",
      np: "सेरेस नेपाल (माव समूह)\nशोरुम: नक्साल, काठमाडौं\nफोन: ९७०५३९९१३१\nसेवा केन्द्र: सितापाइला, काठमाडौं",
    },
    category: "company",
    keywords: ["seres", "showroom", "address", "location", "naxal", "service center", "sitapaila", "contact"],
    sourceUrl: "https://seresnepal.com/contact-us/",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    content: {
      en: "Dongfeng NAMMI Nepal (MAW Group)\nShowroom: Naxal, Kathmandu\nPhone: 9709197176 / 01-5970753\n\nOther Locations: Birtamode, Butwal, Biratnagar, Narayanghat, Pokhara, Ithari\nService Center: Sitapaila, Kathmandu\nService Hotline: 980-2351138",
      np: "डोङफेङ नम्मी नेपाल (माव समूह)\nशोरुम: नक्साल, काठमाडौं\nफोन: ९७०९१९७१७६\nसेवा केन्द्र: सितापाइला, काठमाडौं",
    },
    category: "company",
    keywords: ["dongfeng", "nammi", "showroom", "address", "location", "naxal", "service center", "contact"],
    sourceUrl: "https://dongfengnepal.com/contact-us/",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    content: {
      en: "Foton Nepal (MAW Group)\nShowroom: Balkumari, Kathmandu\nPhone: 9851417122, 9802367501\n\nOther Locations: Bardibas, Pokhara, Birtamode, Janakpur, Hetauda, Ghorahi, Dhangadi, Nepalgunj, Surkhet, Birgunj, Butwal, Itahari\nService Center: Sitapaila, Kathmandu",
      np: "फोटन नेपाल (माव समूह)\nशोरुम: बालकुमारी, काठमाडौं\nफोन: ९८५१४१७१२२\nसेवा केन्द्र: सितापाइला, काठमाडौं",
    },
    category: "company",
    keywords: ["foton", "showroom", "address", "location", "balkumari", "service center", "sitapaila", "contact"],
    sourceUrl: "https://mawnepal.com/contact/",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    content: {
      en: "Sokon Nepal (MAW Group)\nShowroom: Balkumari, Kathmandu\nPhone: 9851417122, 9802367501\n\nOther Locations: Bardibas, Pokhara, Birtamode, Janakpur, Hetauda, Ghorahi, Dhangadi, Nepalgunj, Surkhet, Birgunj, Butwal, Itahari\nService Center: Sitapaila, Kathmandu",
      np: "सोकोन नेपाल (माव समूह)\nशोरुम: बालकुमारी, काठमाडौं\nफोन: ९८५१४१७१२२\nसेवा केन्द्र: सितापाइला, काठमाडौं",
    },
    category: "company",
    keywords: ["sokon", "showroom", "address", "location", "balkumari", "service center", "contact"],
    sourceUrl: "https://mawnepal.com/contact/",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    content: {
      en: "Yamaha Nepal (MAW Group)\nShowroom: Tripureshwor and Naxal, Kathmandu (100+ locations nationwide)\nPhone: 9851255770, 9705047365\n\nService Centers: Bardibas, Kohalpur, Dhangadhi, Tripureshwor, Balkhu\nService Hotline: 16600111044, 9801570044",
      np: "यामाहा नेपाल (माव समूह)\nशोरुम: त्रिपुरेश्वर र नक्साल, काठमाडौं\nफोन: ९८५१२५५७७०\nसेवा हटलाइन: १६६००१११०४४",
    },
    category: "company",
    keywords: ["yamaha", "showroom", "address", "location", "tripureshwor", "naxal", "service center", "contact", "motorcycle"],
    sourceUrl: "https://mawnepal.com/contact/",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    content: {
      en: "Eicher Trucks & Buses Nepal (MAW Group)\nLocations: Jagati, Satungal, Lele, Hetauda, Janakpur, Itahari, Birtamod, Kohalpur, Dhangadhi, Ghorahi, Dang, Nepalgunj, Birgunj, Narayanghat, Pokhara, Butwal, Surkhet, Nuwakot\nHotline: 1660-011-1555 / 9801575111 / 15970370",
      np: "आइचर ट्रक र बस नेपाल (माव समूह)\nहटलाइन: १६६०-०११-१५५५",
    },
    category: "company",
    keywords: ["eicher", "truck", "bus", "address", "location", "contact", "hotline", "commercial vehicle"],
    sourceUrl: "https://mawnepal.com/contact/",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    content: {
      en: "JCB Nepal (MAW Group)\nLocations: Surkhet, Chitwan, Nepalgunj, Janakpur, Birtamode, Birgunj, Dhangadhi, Itahari, Butwal, Pokhara, Dang, Dhobighat, Bhairahawa, Harisiddhi\nPhone: 9801091222 / 9801902312\nService Hotline: 1660-01-33-555 / 9801573555",
      np: "जेसीबी नेपाल (माव समूह)\nफोन: ९८०१०९१२२२\nसेवा हटलाइन: १६६०-०१-३३-५५५",
    },
    category: "company",
    keywords: ["jcb", "construction", "equipment", "address", "location", "contact", "service", "heavy equipment"],
    sourceUrl: "https://mawnepal.com/contact/",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

async function main() {
  console.log("🔍 Scanning existing memory collection...\n");

  const snapshot = await db.collection("memory").get();
  const existing = snapshot.docs.map((d) => ({
    id: d.id,
    data: d.data(),
  }));

  console.log(`Found ${existing.length} existing memory entries.\n`);

  // Identify entries with wrong SKODA/address data
  let deleted = 0;

  for (const doc of existing) {
    const content = doc.data.content?.en || "";
    const lower = content.toLowerCase();

    // Delete entries with the WRONG Skoda address (Dhobighat, Tripureshwor)
    if (
      lower.includes("skoda") &&
      (lower.includes("dhobighat") || (lower.includes("tripureshwor") && lower.includes("skoda")))
    ) {
      await db.collection("memory").doc(doc.id).delete();
      console.log(`🗑️  Deleted WRONG entry: "${content.slice(0, 80)}..."`);
      deleted++;
    }
  }

  if (deleted === 0) {
    console.log("✅ No incorrect entries found to delete.");
  } else {
    console.log(`\nDeleted ${deleted} incorrect entries.\n`);
  }

  // Add all correct entries
  console.log("📝 Adding correct knowledge entries...\n");

  let added = 0;
  for (const entry of CORRECT_ENTRIES) {
    await db.collection("memory").add(entry);
    console.log(`  ✓ Added: ${entry.content.en.split("\n")[0]}`);
    added++;
  }

  console.log(`\n✅ Done! Added ${added} correct entries.`);
  console.log("Run: npm run crawl  to populate crawled_pages with fresh data.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
