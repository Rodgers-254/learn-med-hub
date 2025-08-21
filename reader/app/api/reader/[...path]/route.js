export const runtime = "edge";

const PROJECT_URL = process.env.SUPABASE_URL;
const BUCKET = "books";

export async function GET(req, { params }) {
  if (!PROJECT_URL) return new Response("Missing SUPABASE_URL", { status: 500 });

  // normalize key
  const pieces = Array.isArray(params?.path) ? params.path : [params?.path].filter(Boolean);
  if (!pieces.length) return new Response("Missing path", { status: 400 });
  const objectPath = pieces.join("/").replace(/^\.+|\/\.\.?(\/|$)/g, "");

  const upstreamUrl =
    `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/` +
    objectPath +
    (req.url.includes("?") ? `?${new URL(req.url).searchParams.toString()}` : "");

  const upstream = await fetch(upstreamUrl, { headers: { "accept-encoding": "identity" } });

  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");

  // these can make the browser show raw text or block scripts
  headers.delete("content-security-policy");
  headers.delete("x-frame-options");
  headers.delete("x-content-type-options");
  headers.delete("content-disposition"); // avoids “attachment”

  const ct = (headers.get("content-type") || "").toLowerCase();

  if (upstream.ok && ct.includes("text/html")) {
    let html = await upstream.text();

    // Ensure relative assets (assets/, images/, etc.) resolve under /book/<dir>/
    const base = new URL(req.url);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/");
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base.toString()}">`);

    // fix root-absolute refs coming from many bundles
    html = html
      .replace(/(href|src)=["']\/assets\//gi, `$1="assets/`)
      .replace(/(href|src)=["']\/favicon\.ico/gi, `$1="favicon.ico`)
      .replace(/(href|src)=["']\/manifest\.json/gi, `$1="manifest.json`)
      .replace(/(href|src)=["']\/manifest\.webmanifest/gi, `$1="manifest.webmanifest`)
      .replace(/(href|src)=["']\/(icons|images|img)\//gi, `$1="$2/`);

    // guarantee the browser treats it as HTML (not text)
    headers.set("content-type", "text/html; charset=utf-8");
    headers.delete("content-length"); // body changed

    return new Response(html, { status: upstream.status, headers });
  }

  // passthrough for non-HTML assets
  return new Response(upstream.body, { status: upstream.status, headers });
}
