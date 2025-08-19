// src/pages/payment/Payment.tsx
import React from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { supabase } from "@/lib/supabase"; // ✅ use the unified client

const PaymentPage: React.FC = () => {
  // Support BOTH /payment?id=... and /payment/:id
  const { id: routeId } = useParams<{ id: string }>();
  const location = useLocation();
  const qsId = new URLSearchParams(location.search).get("id") || undefined;
  const bookId = routeId ?? qsId;

  const tillNumber = "6886218"; // ✅ your current till number

  const copyTill = async () => {
    try {
      await navigator.clipboard.writeText(tillNumber);
      alert(`Till number ${tillNumber} copied to clipboard!`);
    } catch {
      alert(`Could not copy. Please copy manually: ${tillNumber}`);
    }
  };

  const handlePaid = async () => {
    if (!bookId) {
      alert("Missing book id.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("You must be logged in to confirm payment.");
      return;
    }

    // Duplicate guard (requires SELECT policy on purchases)
    const { data: existing, error: selErr } = await supabase
      .from("purchases")
      .select("id, confirmed, status")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .maybeSingle();

    if (selErr) {
      console.error("Supabase select error:", selErr);
      alert("Supabase select error: " + selErr.message);
      return;
    }

    if (existing) {
      alert(
        existing.confirmed
          ? "You already own this book ✅"
          : "Payment already recorded. Awaiting admin review."
      );
      return;
    }

    // Insert pending purchase
    const { error: insErr } = await supabase.from("purchases").insert({
      user_id: user.id,
      book_id: bookId,
      confirmed: false,
      status: "pending",
    });

    if (insErr) {
      console.error("Supabase insert error:", insErr);
      alert("Supabase insert error: " + insErr.message);
      return;
    }

    alert("Payment marked as pending. Admin will confirm shortly.");
  };

  return (
    <div className="container py-20 max-w-lg mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">Complete Your Purchase</h1>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg">
            You are buying book ID: <strong>{bookId ?? "—"}</strong>
          </p>

          <div className="p-4 border rounded-lg bg-muted flex items-center justify-between">
            <span className="text-xl font-bold">{tillNumber}</span>
            <Button variant="outline" size="sm" onClick={copyTill}>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
          </div>

          <div className="space-y-2">
            <h2 className="font-bold">M-Pesa Payment Instructions:</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open your SIM Toolkit app.</li>
              <li>Select <strong>M-Pesa</strong>.</li>
              <li>Select <strong>Lipa na M-Pesa</strong>.</li>
              <li>Choose <strong>Buy Goods and Services</strong>.</li>
              <li>Enter Till Number: <strong>{tillNumber}</strong>.</li>
              <li>Enter the amount shown on the book page.</li>
              <li>Enter your M-Pesa PIN and confirm.</li>
            </ol>
          </div>

          <Button className="w-full" onClick={handlePaid} disabled={!bookId}>
            I have paid
          </Button>

          <Link to="/books">
            <Button variant="outline" className="w-full mt-2">
              Back to Books
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPage;
