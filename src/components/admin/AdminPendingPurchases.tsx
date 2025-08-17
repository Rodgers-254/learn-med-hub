import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type PurchaseRow = {
  id: string;
  created_at: string;
  user_id: string;
  book_id: string;
  status: string | null;
  confirmed: boolean;
  books?: { title?: string | null } | null;
  profiles?: { email?: string | null; phone_number?: string | null } | null;
};

export default function AdminPendingPurchases() {
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchPendingPurchases();
  }, []);

  const fetchPendingPurchases = async () => {
    setLoading(true);
    setError(null);

    const selectClause =
      `id, created_at, user_id, book_id, status, confirmed, ` +
      `books:book_id ( title ), ` +
      `profiles:user_id ( email, phone_number )`;

    const { data, error } = await supabase
      .from("purchases")
      .select(selectClause)
      .eq("confirmed", false)
      .order("created_at", { ascending: false })
      .returns<PurchaseRow[]>(); // ✅ tell TS what comes back

    if (error) {
      console.error("Error fetching purchases:", error);
      setError(error.message);
      setPurchases([]); // ✅ safe fallback
    } else {
      setPurchases(data ?? []); // ✅ now typed
    }

    setLoading(false);
  };

  const confirmPurchase = async (id: string) => {
    setError(null);
    const { error } = await supabase
      .from("purchases")
      .update({ confirmed: true, status: "confirmed" })
      .eq("id", id)
      .select("id"); // trigger RLS checks and return something

    if (error) {
      console.error("Error confirming purchase:", error);
      setError(error.message);
    } else {
      // remove from list locally
      setPurchases((prev) => prev.filter((p) => p.id !== id));
    }
  };

  if (loading) return <p className="p-6">Loading pending purchases...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Pending Purchases</h1>
        <button
          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
          onClick={() => void fetchPendingPurchases()}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {purchases.length === 0 ? (
        <p>No pending purchases 🎉</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">User</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Book</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-2 border">{p.profiles?.email || p.user_id}</td>
                <td className="p-2 border">{p.profiles?.phone_number || "—"}</td>
                <td className="p-2 border">{p.books?.title || p.book_id}</td>
                <td className="p-2 border">
                  {new Date(p.created_at).toLocaleString()}
                </td>
                <td className="p-2 border">{p.status ?? "pending"}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => void confirmPurchase(p.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Confirm
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
