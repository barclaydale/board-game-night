export async function GET() {
  const res = await fetch("https://boardgamegeek.com/xmlapi2/thing?id=13", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
  });
  const text = await res.text();
  return Response.json({
    status: res.status,
    bodyPreview: text.slice(0, 500),
  });
}
