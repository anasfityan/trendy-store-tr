import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  // Auth is handled by middleware (cookie check)
  try {
    const { text, from = "tr", to = "ar" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

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

    let translated = "";
    if (Array.isArray(data[0])) {
      for (const segment of data[0]) {
        if (segment[0]) translated += segment[0];
      }
    }

    return NextResponse.json({ translated, from, to });
  } catch {
    return NextResponse.json({ error: "فشل في الترجمة" }, { status: 500 });
  }
}
