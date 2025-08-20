export const runtime = "edge";

const PROJECT_URL = process.env.SUPABASE_URL;             // e.g. https://xxxx.supabase.co
const BUCKET = process.env.NEXT_PUBLIC_BOOKS_BUCKET || "books";

// headers we don't want to pass through from Supabase
const STRIP_HEADERS = [
  "content-security-policy",
  "x-frame-options",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
  "permissions-policy"
];

export async function GET(req, { params }) {
  // normalize and sanitize the object path
  const raw = Array.isArray(params?.path) ? params.path.join("/") : String(params?.path || "");
  const objectPath = raw.replace(/^\/+|\/+$/g, "");                 // no leading/trailing slashes

  // fetch from Supabase public storage
  const qs = new URL(req.url).searchParams.toString();
  const upstreamUrl = `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/${objectPath}${qs ? `?${qs}` : ""}`;

  const upstream = await fetch(upstreamUrl, { headers: { "accept-encoding": "identity" } });

  // clone headers and strip restrictive ones
  const headers = new Headers(upstream.headers);
  for (const h of STRIP_HEADERS) headers.delete(h);

  // add a relaxed CSP so the book’s JS/CSS can run
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self' blob: data: https:;",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https:;",
      "style-src 'self' 'unsafe-inline' https:;",
      "img-src 'self' data: blob: https:;",
      "font-src 'self' data: https:;",
      "connect-src 'self' https: blob: data:;",
      "frame-src 'self' https:;"
    ].join(" ")
  );
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");

  const ct = headers.get("content-type") || "";

  // If it's HTML, inject <base> and rewrite root-absolute references
  if (upstream.ok && /text\/html/i.test(ct)) {
    let html = await upstream.text();

    // set <base> to the current directory (so relative assets resolve via our proxy)
    const base = new URL(req.url);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/");
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base.toString()}">`);

    // rewrite /assets, /images, etc. to relative
    html = html
      .replace(/(href|src)=["']\/assets\//gi, `$1="assets/`)
      .replace(/(href|src)=["']\/favicon\.ico/gi, `$1="favicon.ico`)
      .replace(/(href|src)=["']\/manifest\.json/gi, `$1="manifest.json`)
      .replace(/(href|src)=["']\/manifest\.webmanifest/gi, `$1="manifest.webmanifest`)
      .replace(/(href|src)=["']\/(icons|images|img)\//gi, `$1="$2/`);

    // content length will change
    headers.delete("content-length");
    return new Response(html, { status: upstream.status, headers });
  }

  // pass through everything else (js/css/fonts/img/pdf…)
  return new Response(upstream.body, { status: upstream.status, headers });
}
