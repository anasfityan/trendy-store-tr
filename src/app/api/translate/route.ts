import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * Uses Google Translate's free API to translate Turkish → Arabic.
 * No API key needed — uses the same endpoint the Google Translate website uses.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { text, from = "tr", to = "ar" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Use Google Translate free API
    const params = new URLSearchParams({
      client: "gtx",
      sl: from,
      tl: to,
      dt: "t",
      q: text,
    });

    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?${params.toString()}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "فشل في الترجمة" }, { status: 502 });
    }

    const data = await res.json();

    // Response format: [[["translated text","original text",null,null,10]],null,"tr",...]
    // Concatenate all translated segments
    let translated = "";
    if (Array.isArray(data[0])) {
      for (const segment of data[0]) {
        if (segment[0]) translated += segment[0];
      }
    }

    return NextResponse.json({ translated, from, to });
  } catch (error) {
    console.error("Translate error:", error);
    return NextResponse.json({ error: "فشل في الترجمة" }, { status: 500 });
  }
}
