// supabase/functions/get-book-url/index.ts

import { serve } from "https://deno.land/std@0.171.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { book_id } = await req.json();

    if (!book_id) {
      return new Response("Missing book_id", { status: 400 });
    }

    // Query book by id
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("storage_folder")
      .eq("id", book_id)
      .single();

    if (bookError || !book) {
      return new Response("Book not found", { status: 404 });
    }

    // Generate signed URL for the folder or index.html inside the storage folder
    // Adjust path if your book dist folder structure is different
    const filePath = `${book.storage_folder}/index.html`;

    const { data: signedUrlData, error: urlError } = await supabase
      .storage
      .from("books-private") // your private storage bucket name
      .createSignedUrl(filePath, 60 * 60); // URL valid for 1 hour

    if (urlError || !signedUrlData) {
      return new Response("Failed to generate signed URL", { status: 500 });
    }

    return new Response(
      JSON.stringify({ signed_url: signedUrlData.signedUrl }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
