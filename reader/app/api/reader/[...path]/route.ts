// reader/app/api/reader/[...path]/route.ts
import type { NextRequest } from "next/server";

export const runtime = "edge"; // run on the edge for snappy streaming

const PROJECT_URL = process.env.SUPABASE_URL!;
const BUCKET = "books";

/**
 * GET /api/reader/<...path>
 * Proxies files from Supabase Storage (public "books" bucket).
 * For HTML, we inject a <base> and rewrite root-absolute refs so relative assets load.
 */
export async function GET(
  req: NextRequest,
  context: { params: { path: string[] } }  // <-- exact type required by Next
) {
  const pieces = context.params.path;
  const objectPath = pieces.join("/"); // e.g. "ogindo-kenya-manual/index.html"

  // Build public object URL (we use public bucket)
  const upstreamUrl =
    `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/` +
    objectPath +
    (req.nextUrl.search ? `?${req.nextUrl.searchParams.toString()}` : "");

  const upstream = await fetch(upstreamUrl, {
    // ensure proper streaming
    headers: { "accept-encoding": "identity" },
  });

  // Pass-through most headers, add cache
  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");

  // If it’s HTML, inject <base> and rewrite root-absolute URLs
  const ct = headers.get("content-type") || "";
  if (upstream.ok && ct.includes("text/html")) {
    let html = await upstream.text();

    // Base to the current API path so relative assets resolve here
    const selfBase = new URL(req.url);
    selfBase.pathname = selfBase.pathname.replace(/\/[^/]*$/, "/"); // keep directory only

    // 1) Inject <base>
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${selfBase.toString()}">`);

    // 2) Rewrite root-absolute to relative
    //    "/assets/..." -> "assets/...", "/favicon.ico" -> "favicon.ico", etc.
    html = html
      .replace(/(href|src)=["']\/assets\//gi, `$1="assets/`)
      .replace(/(href|src)=["']\/favicon\.ico/gi, `$1="favicon.ico`)
      .replace(/(href|src)=["']\/manifest\.json/gi, `$1="manifest.json`)
      .replace(/(href|src)=["']\/manifest\.webmanifest/gi, `$1="manifest.webmanifest`)
      .replace(/(href|src)=["']\/(icons|images|img)\//gi, `$1="$2/`);

    headers.delete("content-length");
    return new Response(html, { status: upstream.status, headers });
  }

  // Non-HTML (JS/CSS/images/PDF) — stream through
  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
