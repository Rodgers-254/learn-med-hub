export const runtime = "edge";

const PROJECT_URL = process.env.SUPABASE_URL; // must be set in Vercel
const BUCKET = "books";

// small helper: normalize and prevent path traversal
function sanitize(p) {
  const parts = (Array.isArray(p) ? p : [p])
    .join("/")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(seg => seg && seg !== "." && seg !== "..");
  return parts.join("/");
}

export async function GET(req, { params }) {
  if (!PROJECT_URL) {
    return new Response("Missing SUPABASE_URL", { status: 500 });
  }

  const objectPath = sanitize(params?.path ?? "");
  if (!objectPath) {
    return new Response("Missing path", { status: 400 });
  }

  const search = new URL(req.url).search;
  const upstreamUrl =
    `${PROJECT_URL.replace(/\/+$/, "")}/storage/v1/object/public/${BUCKET}/` +
    objectPath + (search || "");

  const upstream = await fetch(upstreamUrl, {
    headers: { "accept-encoding": "identity" },
    cache: "no-store",
  });

  // clone headers, add caching, and drop restrictive headers
  const headers = new Headers(upstream.headers);
  headers.set(
    "Cache-Control",
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"
  );
  // **IMPORTANT**: strip headers that sandbox the document
  headers.delete("content-security-policy");
  headers.delete("x-frame-options");
  headers.delete("x-content-type-options"); // let the browser execute scripts/styles
  headers.delete("content-length"); // we may change body size

  const ct = (headers.get("content-type") || "").toLowerCase();

  // If it's HTML, inject a <base> and rewrite root-absolute refs
  if (upstream.ok && ct.includes("text/html")) {
    let html = await upstream.text();

    // Make all relative paths resolve to this proxy directory
    const base = new URL(req.url);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/");
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base.toString()}">`);

    // Fix common root-absolute refs from Vite builds
    html = html
      .replace(/(href|src)=["']\/assets\//gi, `$1="assets/`)
      .replace(/(href|src)=["']\/favicon\.ico/gi, `$1="favicon.ico`)
      .replace(/(href|src)=["']\/manifest\.json/gi, `$1="manifest.json`)
      .replace(/(href|src)=["']\/manifest\.webmanifest/gi, `$1="manifest.webmanifest`)
      .replace(/(href|src)=["']\/(icons|images|img)\//gi, `$1="$2/`);

    // ensure it's sent as HTML
    headers.set("content-type", "text/html; charset=utf-8");

    return new Response(html, { status: upstream.status, headers });
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
