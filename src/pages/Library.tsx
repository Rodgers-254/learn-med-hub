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

  // keep your READER_BASE constant as you have it
// const READER_BASE = ((import.meta.env.VITE_READER_BASE as string) || "https://bookreader2025.vercel.app/book/").replace(/\/+$/, "") + "/";

const openBook = async (book: Book) => {
  setOpeningId(book.id);
  try {
    // If you manually stored a full URL (pdf, external site), use it:
    if (book.book_url && /^https?:\/\//i.test(book.book_url)) {
      window.open(book.book_url, "_blank", "noopener,noreferrer");
      return;
    }

    const keyRaw = (book.storage_folder ?? "").trim().replace(/^\/+|\/+$/g, "");
    if (!keyRaw) {
      alert("This book does not have a storage path yet.");
      return;
    }

    const hasExt = /\.[a-z0-9]+$/i.test(keyRaw);
    const path = encodeURI(hasExt ? keyRaw : `${keyRaw}/index.html`);

    // IMPORTANT: always go through the proxy on the reader app
    window.open(`${READER_BASE}${path}`, "_blank", "noopener,noreferrer");
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
