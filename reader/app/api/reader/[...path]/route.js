// reader/app/api/reader/[...path]/route.js
export const runtime = "edge";

const PROJECT_URL = process.env.SUPABASE_URL;
const BUCKET = "books";

export async function GET(req, context) {
  const raw = context.params.path;
  const segments = Array.isArray(raw) ? raw : [raw];
  const objectPath = segments.join("/");

  const upstreamUrl =
    `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/` +
    objectPath +
    (req.url.includes("?") ? `?${new URL(req.url).searchParams.toString()}` : "");

  const upstream = await fetch(upstreamUrl, { headers: { "accept-encoding": "identity" } });

  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");

  const ct = headers.get("content-type") || "";
  if (upstream.ok && ct.includes("text/html")) {
    let html = await upstream.text();

    // set <base> so relative assets resolve via this API
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

    headers.delete("content-length");
    return new Response(html, { status: upstream.status, headers });
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
