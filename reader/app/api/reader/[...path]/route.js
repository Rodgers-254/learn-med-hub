export const runtime = "edge";

const PROJECT_URL = process.env.SUPABASE_URL; // set on Vercel Project 2
const BUCKET = process.env.NEXT_PUBLIC_BOOKS_BUCKET || "books";

export async function GET(req, { params }) {
  // normalize/sanitize path
  const rawPieces = Array.isArray(params?.path) ? params.path : [params.path || ""];
  const pieces = rawPieces
    .map(p => (p || "").replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);
  const objectPath = pieces.join("/");

  if (!PROJECT_URL) {
    return new Response("Missing SUPABASE_URL", { status: 500 });
  }
  if (!objectPath) {
    return new Response("Missing object path", { status: 400 });
  }

  const q = new URL(req.url).searchParams.toString();
  const upstreamUrl =
    `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/` +
    objectPath +
    (q ? `?${q}` : "");

  const upstream = await fetch(upstreamUrl, { headers: { "accept-encoding": "identity" } });

  // clone and relax headers
  const headers = new Headers(upstream.headers);

  // cache policy
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");

  // strip restrictive security headers added by Storage
  [
    "content-security-policy",
    "content-security-policy-report-only",
    "x-frame-options",
    "cross-origin-opener-policy",
    "cross-origin-embedder-policy",
    "cross-origin-resource-policy",
    "permissions-policy",
    "referrer-policy",
  ].forEach(h => headers.delete(h));

  const ct = headers.get("content-type") || "";

  // If HTML, inject <base> and fix root-absolute refs
  if (upstream.ok && ct.includes("text/html")) {
    let html = await upstream.text();

    // base href = this API directory, so relative assets resolve via the proxy
    const base = new URL(req.url);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/");
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base.toString()}">`);

    // rewrite root-absolute references
    html = html
      .replace(/(href|src)=["']\/assets\//gi, `$1="assets/`)
      .replace(/(href|src)=["']\/favicon\.ico/gi, `$1="favicon.ico`)
      .replace(/(href|src)=["']\/manifest\.json/gi, `$1="manifest.json`)
      .replace(/(href|src)=["']\/manifest\.webmanifest/gi, `$1="manifest.webmanifest`)
      .replace(/(href|src)=["']\/(icons|images|img)\//gi, `$1="$2/`);

    headers.delete("content-length"); // body changed
    if (!ct.includes("charset")) headers.set("content-type", "text/html; charset=utf-8");
    return new Response(html, { status: upstream.status, headers });
  }

  // non-HTML passthrough
  return new Response(upstream.body, { status: upstream.status, headers });
}
