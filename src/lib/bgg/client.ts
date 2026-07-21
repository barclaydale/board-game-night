import {
  parseSearchXml,
  parseThingXml,
  type SearchItem,
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

export async function fetchSearch(query: string): Promise<SearchItem[]> {
  const url = `${BGG_BASE}/search?query=${encodeURIComponent(query)}&type=boardgame`;
  const res = await fetch(url, { headers: authHeaders() });

  if (!res.ok) {
    throw new Error(
      `BGG search request failed: ${res.status} ${await res.text()}`,
    );
  }

  const xml = await res.text();
  return parseSearchXml(xml);
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
