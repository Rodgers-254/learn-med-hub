// src/components/Testimonials.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Quote } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

type ReviewRow = {
  id: string;
  user_id?: string | null;
  name?: string | null;
  role?: string | null;
  hospital?: string | null;
  rating: number;
  content: string;
  created_at?: string | null;
};

/**
 * Hardcoded, Kenya-based medical testimonials to display
 * alongside DB reviews. Names/titles are generic and used
 * as illustrative endorsements of the book’s local utility.
 */
const SEED_REVIEWS: ReviewRow[] = [
  {
    id: "seed-1",
    name: "Dr. Achieng’ Owuor",
    role: "Consultant Obstetrician & Gynecologist",
    hospital: "The Nairobi Hospital",
    rating: 5,
    content:
      "Clear, locally relevant guidance. The obstetric protocols align well with resources available in our theatres and wards, which makes day-to-day decisions faster and safer."
  },
  {
    id: "seed-2",
    name: "Dr. David Kamau",
    role: "General Practitioner",
    hospital: "Nakuru County Referral Hospital",
    rating: 5,
    content:
      "Concise, practical, and evidence-based. It reflects the realities of Kenyan practice—from triage to prescribing—without assuming high-end equipment."
  },
  {
    id: "seed-3",
    name: "Dr. Mercy Naliaka",
    role: "Resident Doctor, Internal Medicine",
    hospital: "Kenyatta National Hospital",
    rating: 5,
    content:
      "The algorithms are easy to follow on call. I’ve used the emergency and antimicrobial sections repeatedly; they’re contextualized for our formularies."
  },
  {
    id: "seed-4",
    name: "Dr. Brian Otieno",
    role: "Emergency Physician",
    hospital: "Moi Teaching & Referral Hospital, Eldoret",
    rating: 5,
    content:
      "Great for rapid stabilization and handover. The stepwise approach for shock, DKA, and sepsis fits our ED workflows and resource constraints."
  },
  {
    id: "seed-5",
    name: "Dr. Wanjiru Mwangi",
    role: "Paediatrician",
    hospital: "Aga Khan University Hospital, Nairobi",
    rating: 5,
    content:
      "Excellent paediatric dosing tables and dehydration management. It saves time and improves consistency when supervising juniors."
  },
  {
    id: "seed-6",
    name: "Dr. Abdi Hassan",
    role: "Medical Officer",
    hospital: "Garissa County Teaching & Referral Hospital",
    rating: 5,
    content:
      "Adapted to peripheral facilities. The guidance offers realistic alternatives where labs or imaging are limited—very helpful during night shifts."
  },
  {
    id: "seed-7",
    name: "Dr. Faith Wambui",
    role: "Family Medicine Specialist",
    hospital: "Nyeri County",
    rating: 5,
    content:
      "Primary care chapters are strong—chronic disease follow-up, counselling tips, and screening recommendations we can actually implement."
  },
  {
    id: "seed-8",
    name: "Dr. Kevin Mwenda",
    role: "Surgical Registrar",
    hospital: "Coast General Teaching & Referral Hospital",
    rating: 5,
    content:
      "Pre-op optimization and postoperative care checklists match our surgical pathways and enhance ward rounds."
  }
];

const Testimonials: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // form state (rating is a number)
  const [form, setForm] = useState({
    name: "",
    role: "",
    hospital: "",
    rating: 5,
    content: "",
  });

  // fetch reviews
  const fetchReviews = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, user_id, name, role, hospital, rating, content, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Combine DB reviews with seed testimonials.
      // DB reviews appear first (most recent), followed by seeds.
      const dbReviews = (data ?? []) as ReviewRow[];

      // Optional: avoid duplicates by matching same content+name
      const seen = new Set(dbReviews.map(r => `${(r.name ?? "").trim()}::${r.content.trim()}`));
      const seeds = SEED_REVIEWS.filter(
        s => !seen.has(`${(s.name ?? "").trim()}::${s.content.trim()}`)
      );

      setReviews([...dbReviews, ...seeds]);
    } catch (err: any) {
      console.error("Failed to load reviews:", err);
      // If DB fails, still show the seeds so the section isn’t empty
      setReviews([...SEED_REVIEWS]);
      setErrorMsg(err.message ?? "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // auto-populate from logged-in user if available (non-destructive)
  useEffect(() => {
    if (!user) return;
    // try common metadata fields; use email username as fallback
    const md = (user as any).user_metadata ?? (user as any).raw_user_meta_data ?? {};
    const displayName =
      md?.name || md?.full_name || md?.displayName || (user as any).email?.split?.("@")?.[0] || "";
    setForm((f) => ({
      ...f,
      name: f.name || displayName,
      role: f.role || md?.role || "",
      hospital: f.hospital || md?.hospital || "",
    }));
  }, [user]);

  const openForm = () => {
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
  };

  // submit review
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorMsg(null);

    if (!user) {
      setErrorMsg("You must be logged in to leave a review.");
      return;
    }

    // Basic validation
    if (!form.content.trim()) {
      setErrorMsg("Please write your review.");
      return;
    }
    if (!(Number.isInteger(form.rating) && form.rating >= 1 && form.rating <= 5)) {
      setErrorMsg("Rating must be an integer between 1 and 5.");
      return;
    }

    setSubmitting(true);
    try {
      // Ensure rating is numeric
      const payload = {
        user_id: (user as any).id,
        name: form.name || null,
        role: form.role || null,
        hospital: form.hospital || null,
        rating: Number(form.rating), // <-- numeric
        content: form.content.trim(),
      };

      const { data, error } = await supabase.from("reviews").insert([payload]).select();

      if (error) throw error;

      // Insert succeeded — refresh list
      await fetchReviews();

      // reset form & close
      setForm({ name: "", role: "", hospital: "", rating: 5, content: "" });
      setShowForm(false);
    } catch (err: any) {
      console.error("Submit review error:", err);
      // If RLS or other DB error, surfacing message helps debugging
      setErrorMsg(err.message ?? "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">What Medical Professionals Say</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trusted by healthcare professionals across Kenya
          </p>
          <div className="mt-6">
            <Button variant="premium" size="lg" onClick={openForm}>
              Leave a Review
            </Button>
          </div>
        </div>

        {errorMsg && (
          <div className="max-w-3xl mx-auto mb-4 text-center text-sm text-red-600">{errorMsg}</div>
        )}

        {loading ? (
          <p className="text-center">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          // This will rarely show because we fall back to SEED_REVIEWS on error or empty DB
          <p className="text-center text-muted-foreground mb-8">No reviews yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {reviews.map((r) => (
              <Card key={r.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: Math.max(0, Math.min(5, Math.round(r.rating))) }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-warning fill-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">"{r.content}"</p>

                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-foreground">
                        {r.name ? r.name.slice(0, 2).toUpperCase() : "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{r.name ?? "Anonymous"}</p>
                      <p className="text-sm text-muted-foreground">{r.role ?? ""}</p>
                      <p className="text-xs text-muted-foreground">{r.hospital ?? ""}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal form */}
        {showForm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface text-foreground rounded-lg shadow-lg w-full max-w-lg">
              <div className="p-5 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Leave a review</h3>
                <button className="text-sm text-muted-foreground" onClick={closeForm}>
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    className="w-full rounded border p-2"
                  />
                  <input
                    type="text"
                    placeholder="Your role (e.g. Emergency Physician)"
                    value={form.role}
                    onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
                    className="w-full rounded border p-2"
                  />
                  <input
                    type="text"
                    placeholder="Hospital (optional)"
                    value={form.hospital}
                    onChange={(e) => setForm((s) => ({ ...s, hospital: e.target.value }))}
                    className="w-full rounded border p-2"
                  />
                  <textarea
                    placeholder="Write your review"
                    value={form.content}
                    onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
                    className="w-full rounded border p-2 min-h-[100px]"
                    required
                  />
                  <label className="text-sm text-muted-foreground">Rating</label>
                  <select
                    value={form.rating}
                    onChange={(e) => setForm((s) => ({ ...s, rating: +e.target.value }))}
                    className="w-full rounded border p-2"
                  >
                    <option value={5}>5 — Excellent</option>
                    <option value={4}>4 — Very good</option>
                    <option value={3}>3 — Good</option>
                    <option value={2}>2 — Fair</option>
                    <option value={1}>1 — Poor</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={closeForm} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit review"}
                  </Button>
                </div>

                {errorMsg && <div className="text-sm text-red-600 mt-2">{errorMsg}</div>}
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
