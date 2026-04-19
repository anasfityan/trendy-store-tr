import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractDisplayName(ogTitle: string): string {
  // Format: "Name (@handle) • Instagram photos and videos"
  const match = ogTitle.match(/^([^(]+?)\s*\(@/);
  if (match) return match[1].trim();
  // Fallback: strip everything after " • "
  return ogTitle.split(" • ")[0].trim();
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    let handle = username.trim();
    if (handle.includes("instagram.com/")) {
      const match = handle.match(/instagram\.com\/([^/?#]+)/);
      if (match) handle = match[1];
    }
    handle = handle.replace(/^@/, "").replace(/\/$/, "");
    if (!handle) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    const url = `https://www.instagram.com/${encodeURIComponent(handle)}/`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "لم يتم العثور على الحساب" }, { status: 404 });
    }

    const html = await res.text();

    // Extract og:title
    const ogMatch =
      html.match(/property="og:title"\s+content="([^"]+)"/) ||
      html.match(/content="([^"]+)"\s+property="og:title"/);

    if (!ogMatch) {
      return NextResponse.json({ error: "لم يتم العثور على الاسم" }, { status: 404 });
    }

    const decoded = decodeHtmlEntities(ogMatch[1]);
    const displayName = handle;

    if (!displayName) {
      return NextResponse.json({ error: "لم يتم العثور على الاسم" }, { status: 404 });
    }

    return NextResponse.json({ displayName });
  } catch {
    return NextResponse.json({ error: "فشل في جلب البيانات" }, { status: 500 });
  }
}
