export const runtime = "edge";

const PROJECT_URL = process.env.SUPABASE_URL; // e.g. https://xxxx.supabase.co
const BUCKET = "books";

export async function GET(req, { params }) {
  if (!PROJECT_URL) {
    return new Response("Missing SUPABASE_URL", { status: 500 });
  }

  // Normalize path segments
  const pieces = Array.isArray(params?.path) ? params.path : [params?.path].filter(Boolean);
  const objectPath = pieces.join("/");

  const search = new URL(req.url).search; // keep query string if any
  const upstreamUrl = `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/${objectPath}${search || ""}`;

  const upstream = await fetch(upstreamUrl, {
    headers: { "accept-encoding": "identity" }, // avoid brotli so we can modify
  });

  // Copy headers and strip the ones that can break rendering
  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");
  headers.delete("content-length");
  headers.delete("content-security-policy");
  headers.delete("x-frame-options");
  headers.delete("content-disposition");
  headers.delete("x-content-type-options"); // we’ll set the content-type explicitly

  const ct = (headers.get("content-type") || "").toLowerCase();

  // If it's HTML, we inject a <base> and fix root-absolute refs
  if (upstream.ok && ct.includes("text/html")) {
    let html = await upstream.text();

    // Set <base> to the current directory (/book/<...>/)
    const base = new URL(req.url);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/");
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base.toString()}">`);

    // Fix root-absolute refs produced by many SPA bundles
    html = html
      .replace(/(href|src)=["']\/assets\//gi, `$1="assets/`)
      .replace(/(href|src)=["']\/favicon\.ico/gi, `$1="favicon.ico`)
      .replace(/(href|src)=["']\/manifest\.json/gi, `$1="manifest.json`)
      .replace(/(href|src)=["']\/manifest\.webmanifest/gi, `$1="manifest.webmanifest`)
      .replace(/(href|src)=["']\/(icons|images|img)\//gi, `$1="$2/`);

    // Force correct content-type
    headers.set("content-type", "text/html; charset=utf-8");

    return new Response(html, { status: upstream.status, headers });
  }

  // For everything else (js/css/png/pdf…), just stream through
  return new Response(upstream.body, { status: upstream.status, headers });
}
