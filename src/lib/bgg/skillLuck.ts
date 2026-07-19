export type Level = "low" | "medium" | "high";

export interface SkillLuckInput {
  mechanisms: string[];
  weight: number | null;
}

const SKILL_UP_SIGNALS = [
  "Worker Placement",
  "Deck Construction",
  "Variable Player Powers",
  "Action Points",
];
const SKILL_DOWN_SIGNALS = ["Roll / Move", "Memory", "Paper-and-Pencil"];

const LUCK_UP_SIGNALS = [
  "Dice Rolling",
  "Push Your Luck",
  "Chit-Pull System",
  "Re-rolling and Locking",
];
const LUCK_DOWN_SIGNALS = [
  "Worker Placement",
  "Deck Construction",
  "Tile Placement",
  "Pattern Building",
  "Area Majority / Influence",
  "Route/Network Building",
];

function hasAny(haystack: string[], needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

export function deriveSkillLevel(input: SkillLuckInput): Level {
  const { mechanisms, weight } = input;

  if (weight !== null) {
    if (weight >= 3.2) return "high";
    if (weight < 2.0) return "low";
    return "medium";
  }

  if (hasAny(mechanisms, SKILL_UP_SIGNALS)) return "high";
  if (hasAny(mechanisms, SKILL_DOWN_SIGNALS)) return "low";
  return "medium";
}

export function deriveLuckLevel(input: SkillLuckInput): Level {
  const { mechanisms } = input;
  const hasUp = hasAny(mechanisms, LUCK_UP_SIGNALS);
  const hasDown = hasAny(mechanisms, LUCK_DOWN_SIGNALS);

  if (hasUp && !hasDown) return "high";
  if (hasDown && !hasUp) return "low";
  return "medium";
}

export function deriveIsCooperative(mechanisms: string[]): boolean {
  return mechanisms.includes("Cooperative Game");
}
