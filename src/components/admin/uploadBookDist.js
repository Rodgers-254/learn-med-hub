// src/components/admin/uploadBookDist.js
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { supabase } from "@/lib/supabase";

// ✅ Always load .env from project root (no matter where script is run from)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ✅ Check required env vars
if (!process.env.SUPABASE_URL) {
  console.error('❌ Missing environment variable: SUPABASE_URL');
  process.exit(1);
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}



// ✅ Read CLI arguments
const [,, bookTitle, distFolder] = process.argv;
if (!bookTitle || !distFolder) {
  console.error('Usage: node uploadBookDist.js "<Book Title>" "<Path to dist folder>"');
  process.exit(1);
}

// ✅ Recursively upload all files in the dist folder
async function uploadFolder(localFolder, remoteFolder) {
  const items = fs.readdirSync(localFolder, { withFileTypes: true });

  for (const item of items) {
    const localPath = path.join(localFolder, item.name);
    const remotePath = `${remoteFolder}/${item.name}`;

    if (item.isDirectory()) {
      await uploadFolder(localPath, remotePath);
    } else {
      const fileBuffer = fs.readFileSync(localPath);
      const { error } = await supabase
        .storage
        .from('books') // 📌 Bucket name
        .upload(remotePath, fileBuffer, {
          upsert: true,
          contentType: getMimeType(item.name)
        });

      if (error) {
        console.error(`❌ Failed to upload ${remotePath}:`, error.message);
      } else {
        console.log(`✅ Uploaded: ${remotePath}`);
      }
    }
  }
}

// ✅ Simple MIME type detection
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html';
    case '.css': return 'text/css';
    case '.js': return 'application/javascript';
    case '.json': return 'application/json';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

// ✅ Main
(async () => {
  console.log(`📚 Uploading "${bookTitle}" from ${distFolder}...`);
  const remoteBase = `${bookTitle.replace(/\s+/g, '-').toLowerCase()}`;
  await uploadFolder(distFolder, remoteBase);
  console.log('🎉 Upload complete!');
})();
