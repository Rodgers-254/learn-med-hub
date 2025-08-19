import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // ✅ unified client

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
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Debug panel state
  const [me, setMe] = useState<{ id?: string; email?: string } | null>(null);
  const [isSuper, setIsSuper] = useState<boolean | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);

  useEffect(() => {
    void hydrateDebug();
    void fetchPendingPurchases();
  }, []);

  const hydrateDebug = async () => {
    // Who am I?
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setMe({ id: user.id, email: user.email ?? undefined });
      // Read my profile.is_super_admin (RLS must allow users to read their own profile)
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .maybeSingle();
      if (profErr) {
        // If this errors or returns null, your profiles SELECT RLS likely blocks self-read.
        setIsSuper(null);
      } else {
        setIsSuper(Boolean(prof?.is_super_admin));
      }
    }
  };

  const fetchPendingPurchases = async () => {
    setLoading(true);
    setError(null);

    const selectClause =
      `id, created_at, user_id, book_id, status, confirmed, ` +
      `books:book_id ( title ), ` +
      `profiles:user_id ( email, phone_number )`;

    const { data, error, count } = await supabase
      .from("purchases")
      .select(selectClause, { count: "exact" }) // ✅ see how many rows RLS returns
      .eq("confirmed", false)
      .order("created_at", { ascending: false })
      .returns<PurchaseRow[]>();

    setRowCount(typeof count === "number" ? count : null);

    if (error) {
      console.error("Error fetching purchases:", error);
      setError(error.message);
      setPurchases([]);
    } else {
      setPurchases(data ?? []);
    }

    setLoading(false);
  };

  const confirmPurchase = async (id: string) => {
    setError(null);
    setConfirmingId(id);
    const { error } = await supabase
      .from("purchases")
      .update({ confirmed: true, status: "confirmed" })
      .eq("id", id)
      .select("id"); // force RLS evaluation

    if (error) {
      console.error("Error confirming purchase:", error);
      setError(error.message);
    } else {
      setPurchases((prev) => prev.filter((p) => p.id !== id));
    }
    setConfirmingId(null);
  };

  if (loading) return <p className="p-6">Loading pending purchases...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      {/* Small debug panel so you can see RLS facts */}
      <div className="mb-4 rounded border bg-gray-50 p-3 text-xs text-gray-700">
        <div><strong>You:</strong> {me?.email ?? "—"} <span className="ml-2 text-gray-500">({me?.id ?? "—"})</span></div>
        <div><strong>profiles.is_super_admin:</strong> {isSuper === null ? "unknown (check profiles RLS)" : isSuper ? "true ✅" : "false ❌"}</div>
        <div><strong>RLS row count (pending):</strong> {rowCount ?? "—"}</div>
      </div>

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
                <td className="p-2 border">{new Date(p.created_at).toLocaleString()}</td>
                <td className="p-2 border">{p.status ?? "pending"}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => void confirmPurchase(p.id)}
                    disabled={confirmingId === p.id}
                    className={`px-3 py-1 rounded text-white ${
                      confirmingId === p.id
                        ? "bg-green-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {confirmingId === p.id ? "Confirming..." : "Confirm"}
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
