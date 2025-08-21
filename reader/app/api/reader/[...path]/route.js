// reader/app/api/reader/[...path]/route.js
export const runtime = "edge";

const PROJECT_URL = process.env.SUPABASE_URL;
const BUCKET = "books";

export async function GET(req, { params }) {
  if (!PROJECT_URL) {
    return new Response("Missing SUPABASE_URL", { status: 500 });
  }

  const pieces = Array.isArray(params?.path) ? params.path : [params?.path].filter(Boolean);
  if (!pieces.length) {
    return new Response("Missing path", { status: 400 });
  }

  // basic path sanitization
  const objectPath = pieces.join("/").replace(/^\.+|\/\.\.?(\/|$)/g, "");

  const upstreamUrl =
    `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/` +
    objectPath +
    (req.url.includes("?") ? `?${new URL(req.url).searchParams.toString()}` : "");

  const upstream = await fetch(upstreamUrl, {
    headers: { "accept-encoding": "identity" }, // avoid brotli/gzip body passthrough issues
  });

  // copy headers from upstream
  const headers = new Headers(upstream.headers);

  // cache a bit at the edge
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");

  const ct = (headers.get("content-type") || "").toLowerCase();

  // If HTML, rewrite <base> and fix root-absolute refs
  if (upstream.ok && ct.includes("text/html")) {
    let html = await upstream.text();

    // Base href = this API directory
    const base = new URL(req.url);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/");
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base.toString()}">`);

    // Rewrite root-absolute asset refs to be relative to base
    html = html
      .replace(/(href|src)=["']\/assets\//gi, `$1="assets/`)
      .replace(/(href|src)=["']\/favicon\.ico/gi, `$1="favicon.ico`)
      .replace(/(href|src)=["']\/manifest\.json/gi, `$1="manifest.json`)
      .replace(/(href|src)=["']\/manifest\.webmanifest/gi, `$1="manifest.webmanifest`)
      .replace(/(href|src)=["']\/(icons|images|img)\//gi, `$1="$2/`);

    // Ensure correct content-type **and** strip headers that can block rendering
    headers.delete("content-length");
    headers.set("content-type", "text/html; charset=utf-8");
    headers.delete("content-security-policy");
    headers.delete("x-frame-options");
    headers.delete("content-disposition");
    headers.delete("x-content-type-options");

    return new Response(html, { status: upstream.status, headers });
  }

  // Non-HTML passthrough
  // (for safety, remove problematic headers here too)
  headers.delete("content-security-policy");
  headers.delete("x-frame-options");
  headers.delete("content-disposition");
  headers.delete("x-content-type-options");

  return new Response(upstream.body, { status: upstream.status, headers });
}
