// signed-url.cjs
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // must be the service role key
const objectPath = process.argv[2]; // e.g. "ogindo-kenya-manual/index.html"
const bucket = 'books';

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.');
  process.exit(1);
}
if (!objectPath) {
  console.error('Usage: node signed-url.cjs "<objectPath>"');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

(async () => {
  const { data, error } = await supabase
    .storage.from(bucket)
    .createSignedUrl(objectPath, 60 * 60); // 1 hour

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
  console.log('Signed URL:', data.signedUrl);
})();
