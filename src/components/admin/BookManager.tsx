import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { BookForm } from "./BookForm";
import { useToast } from "@/components/ui/use-toast";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  subscriptionTier: string;
  thumbnail: string;
  summary: string;
  previewPages: number;
  status: "published" | "draft";
  createdAt: string;
  bookUrl?: string;
}

// Helper to convert snake_case DB row to camelCase Book
function mapDbBookToBook(dbBook: any): Book {
  return {
    id: dbBook.id,
    title: dbBook.title,
    author: dbBook.author,
    category: dbBook.category,
    price: dbBook.price,
    subscriptionTier: dbBook.subscription_tier,
    thumbnail: dbBook.thumbnail_url,
    summary: dbBook.summary,
    previewPages: dbBook.preview_pages,
    status: dbBook.status,
    createdAt: dbBook.created_at,
    bookUrl: dbBook.book_url,
  };
}

export const BookManager = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("books")
        .select(
          `
          id,
          title,
          author,
          category,
          price,
          subscription_tier,
          summary,
          preview_pages,
          status,
          thumbnail_url,
          book_url,
          created_at
          `
        )
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        toast({
          title: "Error loading books",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        const mapped = data.map(mapDbBookToBook);
        setBooks(mapped);
      }
      setLoading(false);
    };

    fetchBooks();
  }, [toast]);

  const handleAddBook = async (bookData: Partial<Book>) => {
    const newBook = {
      ...bookData,
      created_at: new Date().toISOString(),
      status: "draft",
      subscription_tier: bookData.subscriptionTier,
      preview_pages: bookData.previewPages,
      thumbnail_url: bookData.thumbnail,
      book_url: bookData.bookUrl,
    } as any;

    // Remove camelCase keys before insert
    delete newBook.subscriptionTier;
    delete newBook.previewPages;
    delete newBook.thumbnail;
    delete newBook.bookUrl;

    const { data, error } = await supabase
      .from("books")
      .insert([newBook])
      .select()
      .single();

    if (error) {
      toast({
        title: "Failed to add book",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setBooks((prev) => [mapDbBookToBook(data), ...prev]);
    setDialogOpen(false);
    toast({
      title: "Book Added",
      description: "New book has been successfully added.",
    });
  };

  const handleEditBook = async (bookData: Partial<Book>) => {
    if (!selectedBook) return;

    const updatePayload: any = {
      ...bookData,
      subscription_tier: bookData.subscriptionTier,
      preview_pages: bookData.previewPages,
      thumbnail_url: bookData.thumbnail,
      book_url: bookData.bookUrl,
    };

    delete updatePayload.subscriptionTier;
    delete updatePayload.previewPages;
    delete updatePayload.thumbnail;
    delete updatePayload.bookUrl;

    const { data, error } = await supabase
      .from("books")
      .update(updatePayload)
      .eq("id", selectedBook.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Failed to update book",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setBooks((prev) =>
      prev.map((book) => (book.id === selectedBook.id ? mapDbBookToBook(data) : book))
    );
    setSelectedBook(null);
    setDialogOpen(false);
    toast({
      title: "Book Updated",
      description: "Book has been successfully updated.",
    });
  };

  const handleDeleteBook = async (bookId: string) => {
    const { error } = await supabase.from("books").delete().eq("id", bookId);

    if (error) {
      toast({
        title: "Failed to delete book",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setBooks((prev) => prev.filter((book) => book.id !== bookId));
    toast({
      title: "Book Deleted",
      description: "Book has been successfully deleted.",
      variant: "destructive",
    });
  };

  const openEditDialog = (book: Book) => {
    setSelectedBook(book);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedBook(null);
    setDialogOpen(true);
  };

  if (loading) return <div>Loading books...</div>;
  if (error) return <div>Error loading books: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Books Library</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedBook ? "Edit Book" : "Add New Book"}</DialogTitle>
              <DialogDescription>
                {selectedBook
                  ? "Update book information"
                  : "Add a new medical book to your library"}
              </DialogDescription>
            </DialogHeader>
            <BookForm
              book={selectedBook}
              onSubmit={selectedBook ? handleEditBook : handleAddBook}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book.id}>
                <TableCell className="font-medium">{book.title}</TableCell>
                <TableCell>{book.category}</TableCell>
                <TableCell>{book.price.toLocaleString("en-KE", { style: "currency", currency: "KES" })}</TableCell>
                <TableCell>
                  <Badge
                    variant={book.subscriptionTier === "Premium" ? "default" : "secondary"}
                  >
                    {book.subscriptionTier}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={book.status === "published" ? "default" : "secondary"}
                  >
                    {book.status}
                  </Badge>
                </TableCell>
                <TableCell>{book.createdAt.split("T")[0]}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(book)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBook(book.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
