// pages/api/purchase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET; // set this in .env.local

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Missing SUPABASE env variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');

// Helper - read admin secret from header or Authorization: Bearer <secret>
function getProvidedAdminSecret(req) {
  const header = req.headers['x-admin-secret'] || req.headers['authorization'];
  if (!header) return null;
  if (Array.isArray(header)) return header[0];
  if (typeof header === 'string' && header.startsWith('Bearer ')) return header.slice(7);
  return header;
}

export default async function handler(req, res) {
  try {
    // simple admin guard - requires the ADMIN_SECRET to be set in your .env and sent with each request
    const providedSecret = getProvidedAdminSecret(req);
    if (!ADMIN_SECRET || providedSecret !== ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized. Add header x-admin-secret or Authorization: Bearer <secret>.' });
    }

    if (req.method === 'GET') {
      // return all unconfirmed purchases (most recent first)
      const { data, error } = await supabase
        .from('purchases')
        .select('id, book_id, user_id, confirmed, created_at')
        .eq('confirmed', false)
        .order('created_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ purchases: data ?? [] });
    }

    if (req.method === 'POST') {
      const body = req.body ?? {};
      const purchaseId = body.purchaseId;

      if (!purchaseId || typeof purchaseId !== 'string') {
        return res.status(400).json({ error: 'purchaseId (string) is required in the request body.' });
      }

      // check existence (safe for different supabase client versions)
      const { data: existingRows, error: fetchErr } = await supabase
        .from('purchases')
        .select('id, confirmed')
        .eq('id', purchaseId)
        .limit(1);

      if (fetchErr) return res.status(500).json({ error: fetchErr.message });
      const existing = Array.isArray(existingRows) ? existingRows[0] : existingRows;
      if (!existing) return res.status(404).json({ error: 'Purchase not found' });
      if (existing.confirmed) return res.status(400).json({ error: 'Purchase already confirmed' });

      const { data, error } = await supabase
        .from('purchases')
        .update({ confirmed: true })
        .eq('id', purchaseId)
        .select(); // return updated row(s)

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, updated: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('purchase API error:', err);
    return res.status(500).json({ error: 'Unexpected server error', details: err?.message ?? String(err) });
  }
}
