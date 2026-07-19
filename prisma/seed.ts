import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const games = [
  {
    bggId: 13,
    name: "Catan",
    yearPublished: 1995,
    minPlayers: 3,
    maxPlayers: 4,
    playingTime: 90,
    minPlayTime: 60,
    maxPlayTime: 120,
    weight: 2.3,
    bggRating: 7.1,
    description:
      "Trade, build, and settle a shared island, racing to 10 victory points.",
    categories: ["Negotiation", "Economic"],
    mechanisms: ["Dice Rolling", "Trading", "Network and Route Building"],
    autoVibeTags: ["competitive-cutthroat"],
    vibeTags: ["competitive-cutthroat"],
  },
  {
    bggId: 178900,
    name: "Codenames",
    yearPublished: 2015,
    minPlayers: 2,
    maxPlayers: 8,
    playingTime: 15,
    minPlayTime: 15,
    maxPlayTime: 15,
    weight: 1.3,
    bggRating: 7.6,
    description:
      "Two rival spymasters give one-word clues to lead their teammates to the right agents.",
    categories: ["Party Game", "Word Game"],
    mechanisms: ["Team-Based Game", "Communication Limits"],
    autoVibeTags: ["chaotic-party"],
    vibeTags: ["chaotic-party"],
  },
  {
    bggId: 266192,
    name: "Wingspan",
    yearPublished: 2019,
    minPlayers: 1,
    maxPlayers: 5,
    playingTime: 60,
    minPlayTime: 40,
    maxPlayTime: 70,
    weight: 2.4,
    bggRating: 8.1,
    description:
      "Attract a beautiful and diverse collection of birds to your wildlife preserves.",
    categories: ["Animals", "Card Game"],
    mechanisms: ["Engine Building", "Hand Management", "Set Collection"],
    autoVibeTags: ["relaxing-chill", "brain-burner"],
    vibeTags: ["relaxing-chill", "brain-burner"],
  },
];

async function main() {
  for (const game of games) {
    await prisma.game.upsert({
      where: { bggId: game.bggId },
      create: game,
      update: game,
    });
  }
  console.log(`Seeded ${games.length} games.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
