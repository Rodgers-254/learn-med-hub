import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Needs service role to bypass RLS
);

export default async function handler(req, res) {
  const { bookId, userId } = req.body;

  // 1. Check if purchase exists and confirmed
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .select('*')
    .eq('book_id', bookId)
    .eq('user_id', userId)
    .eq('confirmed', true)
    .single();

  if (purchaseError || !purchase) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  // 2. Get the book storage folder
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('storage_folder')
    .eq('id', bookId)
    .single();

  if (bookError || !book?.storage_folder) {
    return res.status(404).json({ error: 'Book not found' });
  }

  // 3. Create signed URL for index.html
  const { data: signedUrlData, error: signedUrlError } =
    await supabase.storage
      .from('books')
      .createSignedUrl(`${book.storage_folder}/index.html`, 60 * 60); // 1 hour

  if (signedUrlError) {
    return res.status(500).json({ error: signedUrlError.message });
  }

  return res.status(200).json({ url: signedUrlData.signedUrl });
}
