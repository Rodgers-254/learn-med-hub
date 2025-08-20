export const runtime = "edge";
export const dynamic = "force-dynamic";

const PROJECT_URL = process.env.SUPABASE_URL!;
const BUCKET = "books";

type Context = {
  params: {
    path?: string | string[];
  };
};

export async function GET(req: Request, context: Context): Promise<Response> {
  const raw = context.params.path;
  const segments = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (segments.length === 0) {
    return new Response("Missing path", { status: 400 });
  }
  const objectPath = segments.join("/");

  const url = new URL(req.url);
  const upstreamUrl =
    `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/` +
    objectPath +
    (url.search ? url.search : "");

  const upstream = await fetch(upstreamUrl, {
    headers: { "accept-encoding": "identity" },
  });

  const headers = new Headers(upstream.headers);
  headers.set(
    "Cache-Control",
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"
  );

  const contentType = headers.get("content-type") ?? "";
  if (upstream.ok && contentType.includes("text/html")) {
    let html = await upstream.text();

    // set <base> to this API directory so relative assets load via the proxy
    const base = new URL(req.url);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/");
    html = html.replace(
      /<head([^>]*)>/i,
      `<head$1><base href="${base.toString()}">`
    );

    // fix root-absolute refs from bundled HTML
    html = html
      .replace(/(href|src)=["']\/assets\//gi, `$1="assets/`)
      .replace(/(href|src)=["']\/favicon\.ico/gi, `$1="favicon.ico`)
      .replace(/(href|src)=["']\/manifest\.json/gi, `$1="manifest.json`)
      .replace(
        /(href|src)=["']\/manifest\.webmanifest/gi,
        `$1="manifest.webmanifest`
      )
      .replace(/(href|src)=["']\/(icons|images|img)\//gi, `$1="$2/`);

    headers.delete("content-length");
    return new Response(html, { status: upstream.status, headers });
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
