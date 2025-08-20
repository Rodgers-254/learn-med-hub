// reader/app/api/reader/[...path]/route.js
export const runtime = "edge";

const PROJECT_URL = process.env.SUPABASE_URL; // e.g. https://xxxx.supabase.co
const BUCKET = "books";

export async function GET(req, context) {
  if (!PROJECT_URL) {
    return new Response("Missing SUPABASE_URL", { status: 500 });
  }

  // ---- normalize & sanitize path segments ----
  const raw = context?.params?.path ?? [];
  const pieces = Array.isArray(raw) ? raw : [raw];
  const safePieces = pieces
    .map((s) => (s == null ? "" : String(s)))
    .map((s) => decodeURIComponent(s))
    .map((s) => s.replace(/\.\./g, ""))      // no traversal
    .map((s) => s.replace(/^\/+|\/+$/g, "")) // trim slashes
    .filter(Boolean);

  if (safePieces.length === 0) {
    return new Response("No path provided", { status: 400 });
  }

  const objectPath = safePieces.join("/");

  // Preserve any query string the client sent to the proxy
  const inUrl = new URL(req.url);
  const qs = inUrl.search ? inUrl.search : "";

  const upstreamUrl =
    `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/` + objectPath + qs;

  const upstream = await fetch(upstreamUrl, {
    headers: { "accept-encoding": "identity" },
  });

  // pass-through headers with sensible caching
  const headers = new Headers(upstream.headers);
  headers.set(
    "Cache-Control",
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"
  );

  const ct = headers.get("content-type") || "";
  if (upstream.ok && ct.includes("text/html")) {
    let html = await upstream.text();

    // Set <base> to THIS proxy folder so relative assets resolve back through the proxy
    const base = new URL(req.url);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/"); // strip filename
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base.toString()}">`);

    // Fix root-absolute references common in Vite builds
    html = html
      .replace(/(href|src)=["']\/assets\//gi, `$1="assets/`)
      .replace(/(href|src)=["']\/favicon\.ico/gi, `$1="favicon.ico`)
      .replace(/(href|src)=["']\/manifest\.json/gi, `$1="manifest.json`)
      .replace(/(href|src)=["']\/manifest\.webmanifest/gi, `$1="manifest.webmanifest`)
      .replace(/(href|src)=["']\/(icons|images|img)\//gi, `$1="$2/`);

    headers.delete("content-length"); // length changed
    return new Response(html, { status: upstream.status, headers });
  }

  // Non-HTML (js/css/fonts/images/etc) or error: stream it through
  return new Response(upstream.body, { status: upstream.status, headers });
}
