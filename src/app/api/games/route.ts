import { NextRequest, NextResponse } from "next/server";
import { generateChatResponse } from "@/lib/gemini";

const TRIVIA_QUESTIONS = [
  { q: "When was MAW Group established?", a: "1964", options: ["1950", "1964", "1971", "1980"] },
  { q: "Which brand does MAW NOT represent?", a: "Toyota", options: ["Jeep", "Yamaha", "Toyota", "Skoda"] },
  { q: "What was MAW's original name?", a: "Morang Auto Works", options: ["Morang Auto Works", "MAW Corporation", "Nepal Auto", "MAW Holdings"] },
  { q: "How many touch points does MAW have across Nepal?", a: "600+", options: ["200+", "400+", "600+", "1000+"] },
  { q: "Which year did MAW start representing Yamaha?", a: "1996", options: ["1985", "1992", "1996", "2001"] },
  { q: "Which football club does MAW own?", a: "Kathmandu RayZRs", options: ["Nepal Police Club", "Kathmandu RayZRs", "Three Star Club", "Manang Marshyangdi"] },
  { q: "What is MAW Foundation focused on?", a: "CSR & Community Development", options: ["Profit Sharing", "CSR & Community Development", "Vehicle Manufacturing", "Real Estate"] },
  { q: "Which EV brand does MAW represent?", a: "Deepal", options: ["Tesla", "Deepal", "BYD", "NIO"] },
  { q: "Where was MAW's first workshop located?", a: "Biratnagar", options: ["Kathmandu", "Pokhara", "Biratnagar", "Chitwan"] },
  { q: "How many global brands does MAW represent?", a: "20+", options: ["10+", "15+", "20+", "30+"] },
];

const DAILY_WORDS = [
  { word: "MAWBOT", hint: "Your friendly AI assistant" },
  { word: "NEPAL", hint: "Beautiful country in South Asia" },
  { word: "YAMAHA", hint: "Japanese motorcycle brand" },
  { word: "SMILE", hint: "Something you do when happy" },
  { word: "ENERGY", hint: "Power to do work" },
];

function getDailySeed(): number {
  const date = new Date();
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "trivia";

  try {
    switch (type) {
      case "trivia": {
        const seed = getDailySeed();
        const count = 5;
        const shuffled = [...TRIVIA_QUESTIONS].sort((a, b) => {
          return ((seed + TRIVIA_QUESTIONS.indexOf(a)) % TRIVIA_QUESTIONS.length) -
                 ((seed + TRIVIA_QUESTIONS.indexOf(b)) % TRIVIA_QUESTIONS.length);
        });
        return NextResponse.json({ questions: shuffled.slice(0, count) });
      }

      case "daily-challenge": {
        const seed = getDailySeed();
        const word = DAILY_WORDS[seed % DAILY_WORDS.length];
        const scrambled = word.word.split("").sort(() => Math.random() - 0.5).join("");
        return NextResponse.json({
          scrambled,
          hint: word.hint,
          answer: word.word,
          date: new Date().toISOString().split("T")[0],
        });
      }

      case "riddle": {
        const riddles = [
          { riddle: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?", answer: "echo" },
          { riddle: "The more you take, the more you leave behind. What am I?", answer: "footsteps" },
          { riddle: "What has keys but can't open locks?", answer: "piano" },
          { riddle: "What can travel around the world while staying in a corner?", answer: "stamp" },
          { riddle: "What gets wetter the more it dries?", answer: "towel" },
        ];
        const riddle = riddles[Math.floor(Math.random() * riddles.length)];
        return NextResponse.json(riddle);
      }

      case "personality-quiz": {
        const quiz = {
          title: "Which MAW Brand Suits You Best?",
          questions: [
            { id: 1, text: "How do you like to travel?", options: [
              { value: "jeep", label: "Off-road adventures", emoji: "🏔️" },
              { value: "skoda", label: "Comfort and style", emoji: "✨" },
              { value: "yamaha", label: "Fast and free", emoji: "🏍️" },
              { value: "deepal", label: "Eco-friendly", emoji: "🌱" },
            ]},
            { id: 2, text: "What's your ideal weekend?", options: [
              { value: "jeep", label: "Mountain exploration", emoji: "⛰️" },
              { value: "skoda", label: "City sightseeing", emoji: "🏙️" },
              { value: "yamaha", label: "Road trip with friends", emoji: "🛣️" },
              { value: "deepal", label: "Quiet nature walk", emoji: "🌳" },
            ]},
            { id: 3, text: "Choose a color:", options: [
              { value: "jeep", label: "Green", emoji: "🟢" },
              { value: "skoda", label: "Silver", emoji: "⚪" },
              { value: "yamaha", label: "Blue", emoji: "🔵" },
              { value: "deepal", label: "White", emoji: "⚪" },
            ]},
          ],
          results: {
            "jeep": "Jeep! You're adventurous, bold, and love exploring the unknown. 🏔️",
            "skoda": "Skoda! You appreciate elegance, comfort, and the finer things in life. ✨",
            "yamaha": "Yamaha! You're energetic, free-spirited, and love the thrill of speed. 🏍️",
            "deepal": "Deepal! You're forward-thinking, eco-conscious, and care about the future. 🌱",
          },
        };
        return NextResponse.json(quiz);
      }

      default:
        return NextResponse.json({ error: "Unknown game type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Games API error:", error);
    return NextResponse.json({ error: "Failed to load game" }, { status: 500 });
  }
}
