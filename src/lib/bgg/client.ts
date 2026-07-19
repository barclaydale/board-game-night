import {
  parseCollectionXml,
  parseThingXml,
  type CollectionItem,
  type ThingItem,
} from "@/lib/bgg/xml";

const BGG_BASE = "https://boardgamegeek.com/xmlapi2";

function authHeaders(): HeadersInit {
  const token = process.env.BGG_API_TOKEN;
  if (!token) {
    throw new Error("BGG_API_TOKEN is not set");
  }
  return { Authorization: `Bearer ${token}` };
}

export type CollectionResult =
  | { status: "ready"; items: CollectionItem[] }
  | { status: "pending" }
  | { status: "error"; message: string };

export async function fetchCollection(
  username: string,
): Promise<CollectionResult> {
  const url = `${BGG_BASE}/collection?username=${encodeURIComponent(username)}&stats=1&own=1&excludesubtype=boardgameexpansion`;
  const res = await fetch(url, { headers: authHeaders() });

  if (res.status === 202) {
    return { status: "pending" };
  }
  if (!res.ok) {
    return {
      status: "error",
      message: `BGG collection request failed: ${res.status} ${await res.text()}`,
    };
  }

  const xml = await res.text();
  return { status: "ready", items: parseCollectionXml(xml) };
}

export async function fetchThings(ids: number[]): Promise<ThingItem[]> {
  if (ids.length === 0) return [];
  const url = `${BGG_BASE}/thing?id=${ids.join(",")}&stats=1`;
  const res = await fetch(url, { headers: authHeaders() });

  if (!res.ok) {
    throw new Error(
      `BGG thing request failed: ${res.status} ${await res.text()}`,
    );
  }

  const xml = await res.text();
  return parseThingXml(xml);
}
