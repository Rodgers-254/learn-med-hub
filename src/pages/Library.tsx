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

// Public base (only used if you ever bring back blob fallback)
const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL!;

// Reader proxy base – MUST end with `/book/`
const READER_BASE = (
  (import.meta.env.VITE_READER_BASE as string) ||
  "https://bookreader2025.vercel.app/book/"
).replace(/\/+$/, "") + "/";

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

  const openBook = async (book: Book) => {
    setOpeningId(book.id);
    try {
      // A) If a direct absolute link is saved, just open it.
      if (book.book_url && /^https?:\/\//i.test(book.book_url)) {
        window.open(book.book_url, "_blank", "noopener,noreferrer");
        return;
      }

      // B) Use the proxy for Storage. This avoids CSP/CORS & SW issues.
      const keyRaw = (book.storage_folder ?? "").trim().replace(/^\/+|\/+$/g, "");
      if (!keyRaw) {
        alert("This book does not have a storage path yet.");
        return;
      }

      const isFile = /\.[a-z0-9]+$/i.test(keyRaw);
      const key = encodeURI(isFile ? keyRaw : `${keyRaw}/index.html`);

      // 🚀 Always open via proxy (/book/* → rewrite → /api/reader/*)
      window.open(`${READER_BASE}${key}`, "_blank", "noopener,noreferrer");
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
              <Button
                className="w-full"
                onClick={() => void openBook(b)}
                disabled={openingId === b.id}
              >
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
