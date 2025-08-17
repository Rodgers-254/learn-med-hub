import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Use VITE_ env vars injected by Vite into your frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;



interface Book {
  id: string;
  title: string;
  storage_folder: string;
  // add more fields as needed
}

const Library: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Replace with actual logged-in user ID or auth context
  const userId = "5d93a30e-8b53-4919-8afc-37ef0074807f";

  useEffect(() => {
    async function fetchPurchasedBooks() {
      setLoading(true);

      // First fetch book_ids from purchases table where user_id matches and confirmed is true
      const { data: purchasedBooks, error: purchaseError } = await supabase
        .from("purchases")
        .select("book_id")
        .eq("user_id", userId)
        .eq("confirmed", true);

      if (purchaseError) {
        console.error("Error fetching purchased books:", purchaseError);
        setLoading(false);
        return;
      }

      const bookIds = purchasedBooks?.map((p) => p.book_id) || [];

      if (bookIds.length === 0) {
        setBooks([]);
        setLoading(false);
        return;
      }

      // Then fetch books that match those book_ids
      const { data: booksData, error: booksError } = await supabase
        .from("books")
        .select("*")
        .in("id", bookIds);

      if (booksError) {
        console.error("Error fetching books:", booksError);
        setLoading(false);
        return;
      }

      setBooks(booksData || []);
      setLoading(false);
    }

    fetchPurchasedBooks();
  }, [userId]);

  if (loading) return <div>Loading your library...</div>;

  if (books.length === 0) return <div>You haven't purchased any books yet.</div>;

  return (
    <div>
      <h1>Your Library</h1>
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            <strong>{book.title}</strong>{" "}
            <a href={`/books/${book.storage_folder}`} target="_blank" rel="noopener noreferrer">
              Read Book
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Library;
