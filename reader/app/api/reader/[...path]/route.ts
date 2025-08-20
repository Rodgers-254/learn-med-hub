// reader/app/api/reader/[...path]/route.ts
export const runtime = "edge";

const PROJECT_URL = process.env.SUPABASE_URL!;
const BUCKET = "books";

export async function GET(
  req: Request,
  { params }: { params: { path: string | string[] } } // <- union, not just string[]
) {
  const pieces = Array.isArray(params.path)
    ? params.path
    : [params.path]; // normalize to array

  const objectPath = pieces.join("/");

  const upstreamUrl =
    `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/` +
    objectPath +
    (req.url.includes("?") ? `?${new URL(req.url).searchParams.toString()}` : "");

  const upstream = await fetch(upstreamUrl, { headers: { "accept-encoding": "identity" } });

  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");

  const ct = headers.get("content-type") ?? "";
  if (upstream.ok && ct.includes("text/html")) {
    let html = await upstream.text();

    // Set <base> to this API directory (so relative assets load under our proxy)
    const base = new URL(req.url);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/");
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base.toString()}">`);

    // Fix root-absolute refs from the bundled HTML
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
