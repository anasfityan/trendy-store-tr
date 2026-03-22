import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { username } = await req.json();
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const handle = username.replace(/^@/, "").trim();
    if (!handle) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    // Use Googlebot UA — Instagram serves proper og: meta tags to crawlers
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(handle)}/`, {
      headers: {
        "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
        Accept: "text/html",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const html = await res.text();

    let displayName = "";

    // Instagram og:title: "Display Name (&#064;username) &#x2022; Instagram photos and videos"
    const ogTitleMatch =
      html.match(/"og:title"\s+content="([^"]+)"/i) ||
      html.match(/content="([^"]+)"\s+property="og:title"/i);

    if (ogTitleMatch) {
      const ogTitle = decodeHtmlEntities(ogTitleMatch[1]);
      // Extract display name before (@username)
      const nameMatch = ogTitle.match(/^(.+?)\s*\(@/);
      if (nameMatch) {
        displayName = nameMatch[1].trim();
      } else {
        displayName = ogTitle.replace(/\s*[•·|].*/g, "").trim();
      }
    }

    // Fallback: <title> tag
    if (!displayName) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        const title = decodeHtmlEntities(titleMatch[1]);
        const nameMatch = title.match(/^(.+?)\s*\(@/);
        if (nameMatch) {
          displayName = nameMatch[1].trim();
        }
      }
    }

    if (!displayName) {
      return NextResponse.json({ error: "Could not extract display name" }, { status: 404 });
    }

    return NextResponse.json({ displayName });
  } catch {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
