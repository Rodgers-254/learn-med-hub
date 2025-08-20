export const runtime = "edge";

const PROJECT_URL = process.env.SUPABASE_URL; // must be set in Vercel
const BUCKET = "books";

export async function GET(req, { params }) {
  if (!PROJECT_URL) {
    return new Response("Missing SUPABASE_URL", { status: 500 });
  }

  const raw = params?.path;
  const pieces = Array.isArray(raw) ? raw : [raw];
  const safePieces = pieces.map(p =>
    decodeURIComponent(String(p || ""))
      .replace(/^\.+/g, "")          // no leading dots
      .replace(/\/+/g, "/")          // collapse slashes
      .replace(/[^a-zA-Z0-9._\-\/]/g, "") // conservative
  );
  const objectPath = safePieces.join("/");

  const upstreamUrl =
    `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/` +
    objectPath +
    (req.url.includes("?") ? `?${new URL(req.url).searchParams.toString()}` : "");

  const upstream = await fetch(upstreamUrl, {
    headers: { "accept-encoding": "identity" },
  });

  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");

  const ct = headers.get("content-type") ?? "";
  if (upstream.ok && ct.includes("text/html")) {
    let html = await upstream.text();

    // set <base> to this proxy path so relative assets resolve here
    const base = new URL(req.url);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/");
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base.toString()}">`);

    // rewrite root-absolute refs to relative so they go back through this proxy
    html = html
      .replace(/(href|src)=["']\/assets\//gi, `$1="assets/`)
      .replace(/(href|src)=["']\/favicon\.ico/gi, `$1="favicon.ico`)
      .replace(/(href|src)=["']\/manifest\.json/gi, `$1="manifest.json`)
      .replace(/(href|src)=["']\/manifest\.webmanifest/gi, `$1="manifest.webmanifest`)
      .replace(/(href|src)=["']\/(icons|images|img)\//gi, `$1="$2/`)
      .replace(/(href|src)=["']\/sw\.js/gi, `$1="sw.js`)           // add SW
      .replace(/(href|src)=["']\/robots\.txt/gi, `$1="robots.txt`);// (nice-to-have)

    headers.delete("content-length");
    return new Response(html, { status: upstream.status, headers });
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
