// src/pages/Library.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Book = {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  book_url?: string | null;        // full URL (PDF or hosted HTML)
  storage_folder?: string | null;  // key/folder inside 'books' bucket
};

type PurchaseWithBook = {
  id: string;
  book_id: string;
  created_at: string;
  books: Book | null;
};

// Needed to build public base paths for Storage
const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL!;

const Library: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        setError("Please sign in to view your library.");
        setBooks([]);
        setLoading(false);
        return;
      }

      const { data, error: qErr } = await supabase
        .from("purchases")
        .select(`
          id,
          book_id,
          created_at,
          books:book_id (
            id,
            title,
            thumbnail_url,
            book_url,
            storage_folder
          )
        `)
        .eq("user_id", user.id)
        .eq("confirmed", true)
        .order("created_at", { ascending: false })
        .returns<PurchaseWithBook[]>();

      if (qErr) {
        setError(qErr.message);
        setBooks([]);
        setLoading(false);
        return;
      }

      const unique: Book[] = [];
      const seen = new Set<string>();
      (data ?? []).forEach((row) => {
        const b = row.books;
        if (b && !seen.has(b.id)) {
          seen.add(b.id);
          unique.push(b);
        }
      });

      setBooks(unique);
      setLoading(false);
    })();
  }, []);

  /** Resolve a Storage object path to a URL.
   *  Prefer public (HEAD-checked), then fall back to a signed URL.
   */
  const resolveObjectUrl = async (objectPath: string): Promise<string | null> => {
    const pub = supabase.storage.from("books").getPublicUrl(objectPath).data?.publicUrl;
    if (pub) {
      try {
        const head = await fetch(pub, { method: "HEAD" });
        if (head.ok) return pub;
      } catch { /* ignore */ }
    }
    const { data: signed, error: sErr } = await supabase
      .storage.from("books")
      .createSignedUrl(objectPath, 60 * 60);
    if (!sErr && signed?.signedUrl) return signed.signedUrl;
    return null;
  };

  const injectBeforeFirstScript = (html: string, snippet: string) => {
    const idx = html.search(/<script\b/i);
    if (idx !== -1) return html.slice(0, idx) + snippet + html.slice(idx);
    return html.replace(/<\/head>/i, `${snippet}</head>`);
  };

  // Disable SW registration inside the viewer (blob pages / cross-origin)
  const SW_SHIM = `<script>
    try {
      if (navigator.serviceWorker) {
        const _orig = navigator.serviceWorker.register?.bind(navigator.serviceWorker);
        navigator.serviceWorker.register = async function() {
          console.warn("Service worker registration suppressed in viewer.");
          return { addEventListener: function(){} };
        };
      }
    } catch(e) { console.warn("SW shim error", e); }
  </script>`;

  const openBook = async (book: Book) => {
    setOpeningId(book.id);
    try {
      // A) If a direct absolute URL was stored (PDF or hosted site), just open it
      if (book.book_url && /^https?:\/\//i.test(book.book_url)) {
        window.open(book.book_url, "_blank", "noopener,noreferrer");
        return;
      }

      // B) Build from storage_folder
      const rawFolder = (book.storage_folder ?? "").trim();
      if (!rawFolder) {
        alert("This book does not have a storage path yet.");
        return;
      }

      const hasExt = /\.[a-z0-9]+$/i.test(rawFolder);
      const baseFolder = rawFolder.replace(/^\/+|\/+$/g, ""); // trim leading/trailing slashes

      const candidates: string[] = hasExt
        ? [baseFolder] // exact file specified (e.g., foo/book.pdf or foo/index.html)
        : [
            `${baseFolder}/index.html`,
            `${baseFolder}/dist/index.html`,
          ];

      for (const objectPath of candidates) {
        const fileUrl = await resolveObjectUrl(objectPath);
        if (!fileUrl) continue;

        // Non-HTML (PDF, etc.)
        if (!/\.html?$/i.test(objectPath)) {
          window.open(fileUrl, "_blank", "noopener,noreferrer");
          return;
        }

        // HTML: fetch, add <base>, rewrite root-absolute refs, and inject SW shim
        const res = await fetch(fileUrl, { cache: "no-store" });
        if (!res.ok) continue;

        let html = await res.text();

        // Public base path so all relative assets load from Storage
        const publicBaseDir =
          `${PROJECT_URL}/storage/v1/object/public/books/` +
          (hasExt ? baseFolder.replace(/\/[^/]*$/, "") : baseFolder) +
          "/";

        // Inject base
        html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${publicBaseDir}">`);

        // Rewrite root-absolute to relative paths
        html = html
          .replace(/(href|src)=["']\/assets\//gi, `$1="assets/`)
          .replace(/(href|src)=["']\/favicon\.ico/gi, `$1="favicon.ico`)
          .replace(/(href|src)=["']\/manifest\.json/gi, `$1="manifest.json`)
          .replace(/(href|src)=["']\/manifest\.webmanifest/gi, `$1="manifest.webmanifest`)
          .replace(/(href|src)=["']\/(icons|images|img)\//gi, `$1="$2/`);

        // Inject SW shim before the first script so the app doesn't crash
        html = injectBeforeFirstScript(html, SW_SHIM);

        // Open in a blob (avoids Supabase viewer CSP/sandbox)
        const blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
        window.open(blobUrl, "_blank", "noopener,noreferrer");
        return;
      }

      alert("Book file not found in Storage. Check the 'storage_folder' and ensure index.html (or dist/index.html) exists.");
    } catch (err) {
      console.error("openBook error:", err);
      alert("An error occurred while opening the book. Please allow popups and try again.");
    } finally {
      setOpeningId(null);
    }
  };

  if (loading) return <div className="p-6">Loading your library…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (books.length === 0) return <div className="p-6">You haven’t purchased any books yet.</div>;

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Your Library</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((b) => (
          <Card key={b.id} className="overflow-hidden">
            <CardHeader className="pb-0">
              <div className="aspect-[3/4] w-full border rounded-md overflow-hidden">
                {b.thumbnail_url ? (
                  <img src={b.thumbnail_url} alt={b.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="font-semibold mb-3">{b.title}</div>
              <Button className="w-full" onClick={() => void openBook(b)} disabled={openingId === b.id}>
                {openingId === b.id ? "Opening…" : "Read Now"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Library;
