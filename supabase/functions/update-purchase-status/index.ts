import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // ✅ Check Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${supabaseServiceRoleKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { purchaseId, confirm } = await req.json();

    if (typeof purchaseId !== "string" || typeof confirm !== "boolean") {
      return new Response("Invalid payload", { status: 400 });
    }

    const { error } = await supabase
      .from("purchases")
      .update({ confirmed: confirm })
      .eq("id", purchaseId);

    if (error) {
      return new Response(`Error updating purchase: ${error.message}`, { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});
