import { XMLParser } from "fast-xml-parser";

const ARRAY_TAGS = new Set(["item", "link", "name", "rank"]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (tagName) => ARRAY_TAGS.has(tagName),
  // BGG escapes apostrophes etc. as numeric entities (e.g. &#039;) even
  // inside attribute values; these are only decoded when htmlEntities is on.
  htmlEntities: true,
});

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function num(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export interface SearchItem {
  bggId: number;
  name: string;
  yearPublished: number | null;
}

export interface ThingItem {
  bggId: number;
  name: string;
  yearPublished: number | null;
  image: string | null;
  thumbnail: string | null;
  description: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playingTime: number | null;
  minPlayTime: number | null;
  maxPlayTime: number | null;
  weight: number | null;
  bggRating: number | null;
  bggRank: number | null;
  categories: string[];
  mechanisms: string[];
}

function extractRank(ranksNode: unknown): number | null {
  const ranks = toArray<Record<string, unknown>>(
    (ranksNode as Record<string, unknown> | undefined)?.rank as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | undefined,
  );
  const overall = ranks.find((r) => r["@_name"] === "boardgame");
  const value = overall?.["@_value"];
  if (typeof value !== "string" || value === "Not Ranked") return null;
  return num(value);
}

export function parseSearchXml(xml: string): SearchItem[] {
  const doc = parser.parse(xml);
  const items = toArray<Record<string, any>>(doc?.items?.item);

  return items.map((item) => {
    const names = toArray<Record<string, any>>(item.name);
    const primaryName =
      names.find((n) => n["@_type"] === "primary")?.["@_value"] ??
      names[0]?.["@_value"] ??
      "";

    return {
      bggId: num(item["@_id"]) ?? 0,
      name: primaryName,
      yearPublished: num(item.yearpublished?.["@_value"]),
    };
  });
}

export function parseThingXml(xml: string): ThingItem[] {
  const doc = parser.parse(xml);
  const items = toArray<Record<string, any>>(doc?.items?.item);

  return items.map((item) => {
    const names = toArray<Record<string, any>>(item.name);
    const primaryName =
      names.find((n) => n["@_type"] === "primary")?.["@_value"] ??
      names[0]?.["@_value"] ??
      "";

    const links = toArray<Record<string, any>>(item.link);
    const categories = links
      .filter((l) => l["@_type"] === "boardgamecategory")
      .map((l) => l["@_value"] as string);
    const mechanisms = links
      .filter((l) => l["@_type"] === "boardgamemechanic")
      .map((l) => l["@_value"] as string);

    const ratings = item.statistics?.ratings ?? {};
    const description =
      typeof item.description === "string" ? item.description : null;

    return {
      bggId: num(item["@_id"]) ?? 0,
      name: primaryName,
      yearPublished: num(item.yearpublished?.["@_value"]),
      image: item.image ?? null,
      thumbnail: item.thumbnail ?? null,
      description,
      minPlayers: num(item.minplayers?.["@_value"]),
      maxPlayers: num(item.maxplayers?.["@_value"]),
      playingTime: num(item.playingtime?.["@_value"]),
      minPlayTime: num(item.minplaytime?.["@_value"]),
      maxPlayTime: num(item.maxplaytime?.["@_value"]),
      weight: num(ratings.averageweight?.["@_value"]),
      bggRating: num(ratings.average?.["@_value"]),
      bggRank: extractRank(ratings.ranks),
      categories,
      mechanisms,
    };
  });
}
