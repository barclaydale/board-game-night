export const VIBE_TAGS = [
  "chaotic-party",
  "relaxing-chill",
  "brain-burner",
  "competitive-cutthroat",
  "cooperative-story",
] as const;

export type VibeTag = (typeof VIBE_TAGS)[number];

export interface VibeHeuristicInput {
  categories: string[];
  mechanisms: string[];
  weight: number | null;
  playingTime: number | null;
  maxPlayers: number | null;
}

const PARTY_SIGNALS = ["Party Game", "Bluffing", "Acting", "Trivia"];
const BRAIN_BURNER_SIGNALS = [
  "Wargame",
  "Economic",
  "Worker Placement",
  "Engine Building",
];
const CUTTHROAT_SIGNALS = [
  "Negotiation",
  "Take That",
  "Player Elimination",
];
const STORY_SIGNALS = ["Legacy", "Storytelling", "Adventure"];
const COOP_MECHANISM = "Cooperative Game";

function hasAny(haystack: string[], needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

export function deriveVibeTags(input: VibeHeuristicInput): VibeTag[] {
  const { categories, mechanisms, weight, playingTime, maxPlayers } = input;
  const tags = new Set<VibeTag>();

  const isCooperative = mechanisms.includes(COOP_MECHANISM);

  if (
    hasAny(categories, PARTY_SIGNALS) ||
    hasAny(mechanisms, PARTY_SIGNALS) ||
    ((maxPlayers ?? 0) >= 6 && (weight ?? 0) > 0 && (weight ?? 0) < 2.0)
  ) {
    tags.add("chaotic-party");
  }

  if (
    weight !== null &&
    weight < 2.0 &&
    playingTime !== null &&
    playingTime <= 45
  ) {
    tags.add("relaxing-chill");
  }

  if (
    (weight !== null && weight >= 3.5) ||
    ((hasAny(categories, BRAIN_BURNER_SIGNALS) ||
      hasAny(mechanisms, BRAIN_BURNER_SIGNALS)) &&
      weight !== null &&
      weight >= 3.0)
  ) {
    tags.add("brain-burner");
  }

  if (
    !isCooperative &&
    (hasAny(categories, CUTTHROAT_SIGNALS) ||
      hasAny(mechanisms, CUTTHROAT_SIGNALS)) &&
    weight !== null &&
    weight >= 2.0
  ) {
    tags.add("competitive-cutthroat");
  }

  if (
    isCooperative &&
    (hasAny(categories, STORY_SIGNALS) || hasAny(mechanisms, STORY_SIGNALS))
  ) {
    tags.add("cooperative-story");
  } else if (isCooperative) {
    tags.add("cooperative-story");
  }

  return Array.from(tags);
}
