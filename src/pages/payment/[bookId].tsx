import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function PaymentPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!bookId) return;

    const fetchBook = async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .single();

      if (error) {
        console.error(error);
      } else {
        setBook(data);
      }
      setLoading(false);
    };

    fetchBook();
  }, [bookId]);

  if (loading) return <p className="text-center mt-10">Loading book details…</p>;
  if (!book) return <p className="text-center mt-10">Book not found</p>;

  const handlePayment = () => {
    alert(`Please send KSh ${book.price} to Till Number: 6886218`);
    // Here, you could redirect to an actual payment integration page if needed
  };

  return (
    <div className="container max-w-xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">Purchase: {book.title}</h1>
      <p className="mb-4">{book.summary}</p>
      <p className="text-lg font-semibold mb-4">
        Price: {book.price ? `KSh ${book.price}` : "Free"}
      </p>

      <div className="border p-4 rounded-lg bg-gray-50 mb-6">
        <h2 className="font-bold mb-2">Payment Instructions</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Go to M-Pesa on your phone</li>
          <li>Select <b>Lipa na M-Pesa</b></li>
          <li>Select <b>Buy Goods and Services</b></li>
          <li>Enter Till Number: <b>6886218</b></li>
          <li>Enter Amount: <b>{book.price}</b></li>
          <li>Enter your PIN and confirm</li>
        </ol>
      </div>

      <Button className="w-full" onClick={handlePayment}>
        I Have Paid
      </Button>

      <Button
        variant="outline"
        className="w-full mt-4"
        onClick={() => navigate("/books")}
      >
        Cancel
      </Button>
    </div>
  );
}
