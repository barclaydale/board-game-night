export const VIBE_TAGS = [
  "chaotic-party",
  "relaxing-chill",
  "strategic-thinky",
  "brain-burner",
  "competitive-cutthroat",
  "cooperative-story",
  "family-friendly",
] as const;

export type VibeTag = (typeof VIBE_TAGS)[number];

export const VIBE_EMOJI: Record<VibeTag, string> = {
  "chaotic-party": "🎉",
  "relaxing-chill": "🌿",
  "strategic-thinky": "🧩",
  "brain-burner": "🧠",
  "competitive-cutthroat": "⚔️",
  "cooperative-story": "🤝",
  "family-friendly": "👨‍👩‍👧",
};

export const VIBE_LABELS: Record<VibeTag, string> = {
  "chaotic-party": "Chaotic party",
  "relaxing-chill": "Relaxing & chill",
  "strategic-thinky": "Strategic & thinky",
  "brain-burner": "Brain burner",
  "competitive-cutthroat": "Competitive",
  "cooperative-story": "Cooperative",
  "family-friendly": "Family friendly",
};

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
const STRATEGIC_SIGNALS = [
  "Engine Building",
  "Set Collection",
  "Tableau Building",
  "Hand Management",
  "Worker Placement",
  "Route/Network Building",
];
const CUTTHROAT_SIGNALS = ["Negotiation", "Take That", "Player Elimination"];
const STORY_SIGNALS = ["Legacy", "Storytelling", "Adventure"];
const FAMILY_SIGNALS = ["Children's Game", "Family Game"];
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
    !tags.has("brain-burner") &&
    weight !== null &&
    weight >= 2.0 &&
    weight < 3.5 &&
    hasAny(mechanisms, STRATEGIC_SIGNALS)
  ) {
    tags.add("strategic-thinky");
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

  if (isCooperative) {
    tags.add("cooperative-story");
  }

  if (hasAny(categories, FAMILY_SIGNALS)) {
    tags.add("family-friendly");
  }

  if (tags.size === 0) {
    if (weight === null) {
      tags.add("family-friendly");
    } else if (weight < 2.0) {
      tags.add("relaxing-chill");
    } else if (weight < 3.2) {
      tags.add("strategic-thinky");
    } else {
      tags.add("brain-burner");
    }
  }

  return Array.from(tags);
}
