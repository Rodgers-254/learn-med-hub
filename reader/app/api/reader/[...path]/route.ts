// reader/app/api/reader/[...path]/route.ts
export const runtime = "edge";

const PROJECT_URL = process.env.SUPABASE_URL!;
const BUCKET = "books";

export async function GET(req: Request, ctx: any) {
  // Next.js will pass { params: { path: string[] } } here.
  // Keep it flexible to satisfy Next 15’s route typing.
  const raw = ctx?.params?.path;
  const pieces: string[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const objectPath = pieces.join("/");

  // Build upstream public URL in Supabase Storage
  const qs = new URL(req.url).searchParams.toString();
  const upstreamUrl =
    `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/` +
    objectPath +
    (qs ? `?${qs}` : "");

  const upstream = await fetch(upstreamUrl, {
    // Avoid compressed transfer so we can safely read/modify HTML when needed
    headers: { "accept-encoding": "identity" },
  });

  // Copy headers and add caching
  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");

  const ct = headers.get("content-type") ?? "";

  // If it's HTML, inject <base> and rewrite root-absolute refs
  if (upstream.ok && ct.includes("text/html")) {
    let html = await upstream.text();

    // Make relative URLs resolve under our proxy path
    const base = new URL(req.url);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/");
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base.toString()}">`);

    // Rewrite "/assets/..." etc. to relative paths
    html = html
      .replace(/(href|src)=["']\/assets\//gi, `$1="assets/`)
      .replace(/(href|src)=["']\/favicon\.ico/gi, `$1="favicon.ico`)
      .replace(/(href|src)=["']\/manifest\.json/gi, `$1="manifest.json`)
      .replace(/(href|src)=["']\/manifest\.webmanifest/gi, `$1="manifest.webmanifest`)
      .replace(/(href|src)=["']\/(icons|images|img)\//gi, `$1="$2/`);

    headers.delete("content-length");
    return new Response(html, { status: upstream.status, headers });
  }

  // Non-HTML (e.g., JS/CSS/fonts/PDF) – stream through
  return new Response(upstream.body, { status: upstream.status, headers });
}
