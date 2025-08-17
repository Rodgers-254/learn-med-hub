// src/pages/Books.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Eye, Download, Clock } from "lucide-react";

type BookRow = {
  id: string;
  title: string;
  summary?: string;
  thumbnail_url?: string;
  book_url?: string;
  price?: number | string | null;
  category?: string | null;
  preview_pages?: number | null;
  created_at?: string | null;
};

export default function BooksPage(): JSX.Element {
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const { data, error } = await supabase
          .from("books")
          .select(
            "id, title, summary, thumbnail_url, book_url, price, category, preview_pages, created_at"
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!mounted) return;
        setBooks(data ?? []);
      } catch (err: any) {
        console.error("Books fetch error:", err);
        if (mounted) setError(err.message || "Failed to load books");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  const formatPrice = (p?: number | string | null) => {
    if (p == null || p === "") return "Free";
    if (typeof p === "number") return `$${p.toFixed(2)}`;
    return String(p);
  };

  if (loading) return <div className="container py-20 text-center">Loading books…</div>;
  if (error) return <div className="container py-20 text-center text-red-600">{error}</div>;

  return (
    <main className="py-20 bg-muted/30 min-h-screen">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">All Medical Books</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our full library of comprehensive digital medical textbooks.
          </p>
        </div>

        {books.length === 0 ? (
          <p className="text-center text-muted-foreground">No books available.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {books.map((book) => (
              <Card key={book.id} className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                {/* Add badge if needed */}
                <CardHeader className="pb-4">
                  <div className="aspect-[3/4] rounded-lg border border-primary/30 mb-4 overflow-hidden">
                    {book.thumbnail_url ? (
                      <img src={book.thumbnail_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">{book.category ?? "General"}</Badge>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{book.title}</h3>
                    <p className="text-sm text-muted-foreground">{book.summary}</p>
                  </div>
                </CardHeader>

                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{book.summary}</p>

                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{book.preview_pages ?? "—"} pages</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{book.book_url ? "Preview available" : "No preview"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < 4 ? "text-warning fill-warning" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">4.0</span>
                    <span className="text-sm text-muted-foreground">({/* reviews */}— reviews)</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-0 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-primary">{formatPrice(book.price)}</span>
                    <span className="text-xs text-muted-foreground">One-time purchase</span>
                  </div>
                  <div className="flex gap-2">
                    {book.book_url ? (
                      <Button variant="outline" size="sm" onClick={() => window.open(book.book_url, "_blank")}>
                        Preview
                      </Button>
                    ) : (
                      <Link to={`/books/${book.id}`}>
                        <Button variant="outline" size="sm">Details</Button>
                      </Link>
                    )}
                    <Button size="sm" className="shadow-md" onClick={() => book.book_url && window.open(book.book_url, "_blank")}>
                      <Download className="h-4 w-4 mr-1" />
                      Buy Now
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
