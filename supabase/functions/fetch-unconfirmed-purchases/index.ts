import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async () => {
  try {
    const { data: purchases, error } = await supabase
      .from("purchases")
      .select("id, book_id, user_id, confirmed, created_at")
      .eq("confirmed", false);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch emails for all user_ids in one go
    const userIds = purchases.map((p) => p.user_id);
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      return new Response(JSON.stringify({ error: userError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const usersMap = Object.fromEntries(
      users.users.map((u) => [u.id, u.email])
    );

    const purchasesWithEmails = purchases.map((p) => ({
      ...p,
      email: usersMap[p.user_id] || null,
    }));

    return new Response(JSON.stringify({ purchases: purchasesWithEmails }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
