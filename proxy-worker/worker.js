// Cloudflare Worker — lightweight proxy for fetching product pages & Instagram profiles

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== "POST") {
      return new Response("POST only", { status: 405, headers: corsHeaders() });
    }

    try {
      const { url } = await request.json();
      if (!url || typeof url !== "string") {
        return jsonResponse({ error: "url required" }, 400);
      }

      const hostname = new URL(url).hostname.toLowerCase();

      // Special handling for Instagram — extract display name server-side
      if (hostname.includes("instagram.com")) {
        return await handleInstagram(url);
      }

      // Strategy 1: Try multiple User-Agents
      const uas = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Googlebot/2.1 (+http://www.google.com/bot.html)",
        "Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      ];

      for (const ua of uas) {
        try {
          const res = await fetch(url, {
            headers: {
              "User-Agent": ua,
              "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
            redirect: "follow",
          });

          if (res.ok) {
            const html = await res.text();
            // Check if we got a real page (not a captcha/block page)
            if (html.includes("og:title") || html.includes("ld+json") || html.includes("__PRODUCT") || html.length > 50000) {
              return new Response(html, {
                status: 200,
                headers: { ...corsHeaders(), "Content-Type": "text/html; charset=utf-8" },
              });
            }
          }
        } catch {}
      }

      // Strategy 2: Extract product info from the URL slug itself
      // Most Turkish e-commerce URLs contain the product name in the slug
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        // Find the product slug (usually the longest path segment with dashes)
        let slug = pathParts.reduce((best, part) => part.length > best.length ? part : best, '');
        // Remove product ID suffix like -p-XXXXX
        slug = slug.replace(/-p-[A-Za-z0-9]+$/, '').replace(/-p\d+$/, '');
        // Convert dashes to spaces and capitalize
        const productName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        if (productName && productName.length > 5) {
          const miniHtml = `<html><head>
            <meta property="og:title" content="${productName.replace(/"/g, '&quot;')}" />
            <meta property="product:price:currency" content="TRY" />
          </head><body></body></html>`;
          return new Response(miniHtml, {
            status: 200,
            headers: { ...corsHeaders(), "Content-Type": "text/html; charset=utf-8" },
          });
        }
      } catch {}

      // All strategies failed
      return new Response("blocked", {
        status: 403,
        headers: corsHeaders(),
      });
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  },
};

async function handleInstagram(url) {
  // Extract username from URL
  const match = url.match(/instagram\.com\/([^/?#]+)/);
  if (!match) return jsonResponse({ error: "invalid instagram url" }, 400);
  const username = match[1];

  // Strategy 1: Try Instagram's web profile API with app ID
  try {
    const apiRes = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          "User-Agent": "Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100)",
          "X-IG-App-ID": "936619743392459",
          Accept: "*/*",
        },
      }
    );
    if (apiRes.ok) {
      const data = await apiRes.json();
      const fullName = data?.data?.user?.full_name;
      if (fullName) {
        return jsonResponse({ displayName: fullName });
      }
    }
  } catch {}

  // Strategy 2: Try Googlebot UA (Instagram shows og:title to Googlebot)
  try {
    const botRes = await fetch(url, {
      headers: {
        "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    if (botRes.ok) {
      const html = await botRes.text();
      const ogMatch = html.match(/"og:title"\s+content="([^"]+)"/i) ||
                       html.match(/content="([^"]+)"\s+property="og:title"/i);
      if (ogMatch) {
        const decoded = decodeEntities(ogMatch[1]);
        const nameMatch = decoded.match(/^(.+?)\s*\(@/);
        if (nameMatch) {
          return jsonResponse({ displayName: nameMatch[1].trim() });
        }
      }
    }
  } catch {}

  // Strategy 3: Search DuckDuckGo for the Instagram profile
  try {
    const ddgRes = await fetch(
      `https://html.duckduckgo.com/html/?q=instagram.com/${username}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
      }
    );
    if (ddgRes.ok) {
      const html = await ddgRes.text();
      // Look for: DisplayName (@username) • Instagram photos and videos
      const re = new RegExp(`([^<"]+?)\\s*\\(@${username}\\)\\s*[•·]`, "i");
      const m = html.match(re);
      if (m) {
        return jsonResponse({ displayName: decodeEntities(m[1].trim()) });
      }
    }
  } catch {}

  return jsonResponse({ error: "could not find profile" }, 404);
}

function decodeEntities(str) {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#064;/g, "@");
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
