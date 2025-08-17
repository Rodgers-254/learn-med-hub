// pages/books/index.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, Clock, Star } from "lucide-react";



interface Book {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  rating: number;
  reviews: number;
  pages: number;
  category: string;
  bestseller: boolean;
  preview: string;
  description: string;
  thumbnail_url?: string;
}

export default function AllBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching books:", error);
      } else {
        setBooks(data as Book[]);
      }
      setLoading(false);
    };

    fetchBooks();
  }, []);

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <p>Loading books...</p>
      </div>
    );
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <h1 className="text-3xl lg:text-4xl font-bold mb-8 text-center">
          All Medical Books
        </h1>

        {books.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No books available yet.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {books.map((book) => (
              <Card key={book.id} className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                {book.bestseller && (
                  <Badge className="absolute top-4 left-4 z-10 bg-warning text-warning-foreground">
                    Bestseller
                  </Badge>
                )}

                <CardHeader className="pb-4">
                  <div className="aspect-[3/4] rounded-lg border border-primary/30 mb-4 relative overflow-hidden">
                    {book.thumbnail_url ? (
                      <img
                        src={book.thumbnail_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-primary/20 to-accent/20 w-full h-full" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      {book.category}
                    </Badge>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{book.subtitle}</p>
                  </div>
                </CardHeader>

                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {book.description}
                  </p>
                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{book.pages} pages</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{book.preview}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(book.rating)
                              ? "text-warning fill-warning"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{book.rating}</span>
                    <span className="text-sm text-muted-foreground">({book.reviews} reviews)</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-0 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-primary">{book.price}</span>
                    <span className="text-xs text-muted-foreground">One-time purchase</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Preview</Button>
                    <Button size="sm" className="shadow-md">
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
    </section>
  );
}
