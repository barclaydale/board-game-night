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
  description: string | null;
  weight: number | null;
  playingTime: number | null;
  maxPlayers: number | null;
}

const PARTY_SIGNALS = ["Party Game", "Bluffing", "Acting", "Trivia"];
const FAST_PACED_SIGNALS = [
  "Real-time",
  "Speed Matching",
  "Pattern Recognition",
];
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

// Genuine textual signal from the game's own description -- only used to
// ADD a tag when nothing else implied it, never to remove one.
const DESCRIPTION_KEYWORDS: Record<VibeTag, string[]> = {
  "chaotic-party": ["hilarious", "chaotic", "raucous", "wild party", "shout"],
  "relaxing-chill": ["relaxing", "laid-back", "cozy", "unwind", "casual game"],
  "strategic-thinky": ["strategic depth", "optimize your", "tough choices"],
  "brain-burner": [
    "brain-burning",
    "brain burner",
    "deep strategy",
    "steep learning curve",
    "analysis paralysis",
  ],
  "competitive-cutthroat": [
    "cutthroat",
    "backstab",
    "confrontation",
    "aggressive play",
  ],
  "cooperative-story": [
    "narrative",
    "story-driven",
    "campaign",
    "immersive story",
  ],
  "family-friendly": ["family-friendly", "whole family", "kid-friendly"],
};

function hasAny(haystack: string[], needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function descriptionImplies(description: string | null, tag: VibeTag): boolean {
  if (!description) return false;
  const text = description.toLowerCase();
  return DESCRIPTION_KEYWORDS[tag].some((keyword) => text.includes(keyword));
}

export function deriveVibeTags(input: VibeHeuristicInput): VibeTag[] {
  const { categories, mechanisms, description, weight, playingTime, maxPlayers } =
    input;
  const tags = new Set<VibeTag>();

  const isCooperative = mechanisms.includes(COOP_MECHANISM);
  const isLoudOrFastPaced =
    hasAny(categories, PARTY_SIGNALS) ||
    hasAny(mechanisms, PARTY_SIGNALS) ||
    hasAny(categories, FAST_PACED_SIGNALS) ||
    hasAny(mechanisms, FAST_PACED_SIGNALS);

  if (
    isLoudOrFastPaced ||
    ((maxPlayers ?? 0) >= 6 && (weight ?? 0) > 0 && (weight ?? 0) < 2.0)
  ) {
    tags.add("chaotic-party");
  }

  if (
    !tags.has("chaotic-party") &&
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

  // Description is only ever additive: a tag with no structured signal can
  // still be genuinely implied by how the game describes itself. If nothing
  // implies a tag at all, none is added -- an empty list is a valid result.
  for (const tag of VIBE_TAGS) {
    if (!tags.has(tag) && descriptionImplies(description, tag)) {
      tags.add(tag);
    }
  }

  return Array.from(tags);
}
