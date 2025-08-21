// tools/upload-book.mjs
import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import mime from "mime-types";

const [localDir, destPrefix = "ogindo-kenya-manual", bucket = "books"] = process.argv.slice(2);

if (!localDir) {
  console.error("Usage: node tools/upload-book.mjs <local_folder> [dest_prefix] [bucket]");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(fp);
    else yield fp;
  }
}

(async () => {
  let ok = 0, fail = 0;
  for await (const filePath of walk(path.resolve(localDir))) {
    const rel = path.relative(localDir, filePath).replaceAll("\\", "/");
    const key = `${destPrefix}/${rel}`;
    const contentType = mime.lookup(filePath) || "application/octet-stream";
    const bytes = await fs.readFile(filePath);

    const { error } = await sb.storage
      .from(bucket)
      .upload(key, bytes, { upsert: true, contentType });

    if (error) {
      console.error("✗", key, "-", error.message);
      fail++;
    } else {
      console.log("✓", key, "-", contentType);
      ok++;
    }
  }
  console.log(`Done. Uploaded: ${ok}, Failed: ${fail}`);
})();
