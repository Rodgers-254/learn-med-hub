// reader/app/api/reader/[...path]/route.ts
export const runtime = "edge";          // run on the Edge
export const dynamic = "force-dynamic"; // always proxy fresh

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BOOKS_BUCKET = process.env.NEXT_PUBLIC_BOOKS_BUCKET || "books";

// Simple helper to build the public Storage URL we want to proxy
const upstreamUrlFor = (key: string) =>
  `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${BOOKS_BUCKET}/${key}`;

export async function GET(
  req: Request,
  ctx: { params: { path?: string[] } }
) {
  const pathParts = ctx.params.path ?? [];
  if (pathParts.length === 0) {
    return new Response("Missing path", { status: 400 });
  }

  // requested key inside the bucket, e.g. "ogindo-kenya-manual/index.html"
  const key = pathParts.join("/");
  const upstream = upstreamUrlFor(key);

  // Fetch from Supabase Storage (public object)
  const res = await fetch(upstream, {
    // pass headers you want forwarded (usually not needed for public)
    headers: { "cache-control": "no-cache" },
  });

  if (!res.ok) {
    return new Response(await res.text(), { status: res.status });
  }

  // Content-Type from upstream (default to binary)
  const ct = res.headers.get("content-type") ?? "application/octet-stream";

  // If it's HTML, we can tweak it so all absolute paths work behind this proxy
  if (ct.includes("text/html")) {
    let html = await res.text();

    // Directory of the current html inside our proxy
    // e.g. /api/reader/ogindo-kenya-manual/
    const dirInProxy = "/api/reader/" + key.replace(/\/[^/]*$/, "/");

    // 1) Inject <base> so relative URLs resolve inside *this* proxy directory
    html = html.replace(
      /<head([^>]*)>/i,
      `<head$1><base href="${dirInProxy}">`
    );

    // 2) Rewrite root-absolute refs like /assets/... → /api/reader/<dir>/assets/...
    //    Also handle /favicon.ico, /manifest.json, and common asset folders.
    const prefix = dirInProxy.endsWith("/") ? dirInProxy : dirInProxy + "/";
    html = html
      .replace(/(href|src)=["']\/assets\//gi, `$1="${prefix}assets/`)
      .replace(/(href|src)=["']\/favicon\.ico/gi, `$1="${prefix}favicon.ico`)
      .replace(/(href|src)=["']\/manifest\.json/gi, `$1="${prefix}manifest.json`)
      .replace(
        /(href|src)=["']\/(icons|images|img|fonts)\//gi,
        `$1="${prefix}$2/`
      );

    // 3) Neutralize service-worker registration to avoid cross-origin SW issues
    const swStub = `
      <script>
        try {
          if ('serviceWorker' in navigator) {
            const fakeReg = {
              addEventListener(){}, removeEventListener(){},
              update(){}, unregister(){ return Promise.resolve(false); },
              installing:null, waiting:null, active:null, scope:location.origin
            };
            navigator.serviceWorker.register = async () => fakeReg;
            navigator.serviceWorker.addEventListener = () => {};
          }
        } catch (_) {}
      </script>
    `;
    html = html.replace(/<\/head>/i, swStub + "</head>");

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        // keep small cache since we proxy dynamic html
        "cache-control": "private, max-age=30",
      },
    });
  }

  // Non-HTML: just stream through with long cache (images, css, js, pdf, etc.)
  return new Response(res.body, {
    status: 200,
    headers: {
      "content-type": ct,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
