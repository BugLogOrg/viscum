const { Pool } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const p = path.join(__dirname, ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

async function main() {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const pool = new Pool({ connectionString: url });
  const r = await pool.query(
    "UPDATE request_dms SET work_thumb_url = NULL WHERE work_thumb_url LIKE 'data:%' RETURNING id",
  );
  console.log("cleared thumbs:", r.rowCount);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
