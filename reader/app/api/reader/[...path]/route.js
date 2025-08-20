export const runtime = "edge";

const PROJECT_URL = process.env.SUPABASE_URL; // e.g. https://xxxx.supabase.co
const BUCKET = process.env.NEXT_PUBLIC_BOOKS_BUCKET || "books";

function cleanPath(p) {
  // disallow sneaky paths
  return p.replace(/^\/+|\/+$/g, "").replace(/\.\.+/g, "");
}

export async function GET(req, { params }) {
  if (!PROJECT_URL) {
    return new Response("<pre>Missing SUPABASE_URL</pre>", { status: 500, headers: { "content-type": "text/html" } });
  }

  const pieces = Array.isArray(params?.path) ? params.path : [params?.path].filter(Boolean);
  const objectPath = cleanPath(pieces.join("/"));

  const upstreamUrl =
    `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/` +
    objectPath +
    (req.url.includes("?") ? `?${new URL(req.url).searchParams.toString()}` : "");

  const upstream = await fetch(upstreamUrl, {
    // some hosts try to gzip; identity avoids weird length mismatches after we edit html
    headers: { "accept-encoding": "identity" },
  });

  // Copy & sanitize headers
  const headers = new Headers(upstream.headers);

  // ---- critical: remove blocking headers coming from storage ----
  headers.delete("content-security-policy");
  headers.delete("content-security-policy-report-only");
  headers.delete("x-frame-options");
  headers.delete("cross-origin-opener-policy");
  headers.delete("cross-origin-embedder-policy");
  headers.delete("cross-origin-resource-policy");
  headers.delete("permissions-policy");

  // helpful cache
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");

  const ct = (headers.get("content-type") || "").toLowerCase();

  // If it's HTML, inject <base> and fix root-absolute asset refs
  if (upstream.ok && ct.includes("text/html")) {
    let html = await upstream.text();

    // base to the API directory so relative assets resolve under /book/<folder>/
    const base = new URL(req.url);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/");
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base.toString()}">`);

    // fix root-absolute links in the bundle
    html = html
      .replace(/(href|src)=["']\/assets\//gi, `$1="assets/`)
      .replace(/(href|src)=["']\/favicon\.ico/gi, `$1="favicon.ico`)
      .replace(/(href|src)=["']\/manifest\.json/gi, `$1="manifest.json`)
      .replace(/(href|src)=["']\/manifest\.webmanifest/gi, `$1="manifest.webmanifest`)
      .replace(/(href|src)=["']\/(icons|images|img)\//gi, `$1="$2/`);

    // ensure type is correct and length recalculated
    headers.set("content-type", "text/html; charset=utf-8");
    headers.delete("content-length");

    return new Response(html, { status: upstream.status, headers });
  }

  // Non-HTML: stream as-is (PDFs, images, etc.)
  return new Response(upstream.body, { status: upstream.status, headers });
}
