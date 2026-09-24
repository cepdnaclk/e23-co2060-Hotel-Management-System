// Read-only audit. No schema setup, migrations, INSERT/UPDATE/DELETE or DB resets.
// node scripts/audit-local-images.js [--database] [--http] [--output=path.json]
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const args = process.argv.slice(2);
const report = { localReferences: [], missingFiles: [], runtimeExternalReferences: [], database: [], http: [], api: [], identityRepairs: [] };
const imagePattern = /\/images\/[A-Za-z0-9_./-]+\.(?:jpg|jpeg|png|webp|svg|avif|gif)/g;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".git", "artifacts"].includes(entry.name)) return [];
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function localExists(url, app = "client") {
  const filename = path.resolve(root, app, "public", `.${url}`);
  return fs.existsSync(filename) && fs.statSync(filename).size > 0;
}

async function main() {
  const localUrls = new Set();
  for (const folder of ["client/src", "admin-client/src", "reception-client/src", "server/src", "database", "shared"]) {
    for (const file of walk(path.join(root, folder)).filter((file) => /\.(?:[cm]?js|jsx|css|sql|html|json)$/.test(file))) {
      const source = fs.readFileSync(file, "utf8");
      const relative = path.relative(root, file).replaceAll("\\", "/");
      for (const url of new Set(source.match(imagePattern) || [])) {
        const app = relative.startsWith("admin-client/") && localExists(url, "admin-client") ? "admin-client" : "client";
        const found = localExists(url, app);
        report.localReferences.push({ file: relative, url, app, found });
        if (!found) report.missingFiles.push({ file: relative, url });
        if (app === "client") localUrls.add(url);
      }
      // These domains are allowed only in migration SQL and the explicit legacy converter.
      if (!relative.startsWith("database/") && relative !== "shared/legacyImagePaths.mjs" && /images\.(?:unsplash|pexels)\.com/.test(source)) {
        report.runtimeExternalReferences.push(relative);
      }
    }
  }

  if (args.includes("--database")) {
    require("dotenv").config({ path: path.join(root, "server/.env"), quiet: true });
    const db = await require("mysql2/promise").createConnection({
      host: process.env.DB_HOST, user: process.env.DB_USER,
      password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    });
    try {
      await db.query("SET TRANSACTION READ ONLY");
      await db.query("START TRANSACTION");
      for (const [table, field] of [["explore_places", "image_url"], ["explore_place_images", "image_url"], ["properties", "logo_url"], ["property_photos", "image_url"], ["room_photos", "image_url"], ["tourist_events", "image_url"], ["partner_guides", "image_url"]]) {
        const [rows] = await db.query(`SELECT id, ${field} AS image FROM ${table}`);
        const missing = rows.filter((row) => row.image?.startsWith("/images/") && !localExists(row.image));
        report.database.push({ table, field, rows: rows.length, empty: rows.filter((row) => !row.image).length,
          external: rows.filter((row) => /images\.(?:unsplash|pexels)\.com/.test(row.image || "")), missing });
        for (const row of rows) if (row.image?.startsWith("/images/")) localUrls.add(row.image);
      }
      const [places] = await db.query("SELECT i.id, p.slug, i.sort_order, i.image_url FROM explore_place_images i JOIN explore_places p ON p.id = i.place_id WHERE p.slug = 'adams-peak'");
      for (const row of places) {
        const expected = `/images/destinations/adams-peak/gallery-${String(row.sort_order).padStart(2, "0")}.jpg`;
        if (row.image_url.startsWith("/images/destinations/nuwara-eliya-") && row.image_url !== expected) report.identityRepairs.push({ table: "explore_place_images", ...row, expected });
      }
      const [rooms] = await db.query("SELECT rp.id, rp.image_url FROM room_photos rp JOIN rooms r ON r.id = rp.room_id JOIN properties p ON p.id = r.property_id WHERE p.name = 'Jaffna Heritage Guesthouse' AND r.room_type = 'Northern Comfort Room'");
      for (const row of rooms) if (row.image_url === "/images/rooms/colombo-city-stay/business-room.jpg") report.identityRepairs.push({ table: "room_photos", ...row, expected: "/images/rooms/jaffna-heritage-guesthouse/northern-comfort-room.jpg" });
      await db.query("ROLLBACK");
    } finally { await db.end(); }
  }

  if (args.includes("--http")) {
    const api = process.env.IMAGE_AUDIT_API_URL || "http://localhost:5000/api";
    const frontend = process.env.IMAGE_AUDIT_CLIENT_URL || "http://localhost:5173";
    const collectImages = (data) => {
      if (typeof data === "string" && data.startsWith("/images/")) localUrls.add(data);
      else if (Array.isArray(data)) data.forEach(collectImages);
      else if (data && typeof data === "object") Object.values(data).forEach(collectImages);
    };
    const request = async (route) => {
      const response = await fetch(`${api}${route}`, { signal: AbortSignal.timeout(10000) });
      const data = await response.json();
      report.api.push({ route, status: response.status });
      collectImages(data);
      return data;
    };
    const home = await request("/home");
    report.homeCollections = Object.fromEntries(["featuredPlaces", "featuredHotels", "upcomingEvents", "featuredGuides"].map((key) => [key, home.data?.[key]?.length || 0]));
    const places = (await request("/explore/places")).places || [];
    report.exploreExamples = places.filter((p) => ["sigiriya-rock-fortress", "temple-of-the-sacred-tooth-relic", "nine-arch-bridge"].includes(p.slug)).map((p) => ({ name: p.name, image: p.image, image_url: p.image_url }));
    for (const place of places) await request(`/explore/places/${place.id}`);
    await request("/explore/seasonal");
    await request("/explore/itineraries");
    const hotels = (await request("/properties")).data || [];
    for (const hotel of hotels) {
      await request(`/properties/${hotel.id}`);
      await request(`/properties/${hotel.id}/rooms`);
    }
    const events = (await request("/tourist/events")).events || [];
    for (const event of events) await request(`/tourist/events/${encodeURIComponent(event.slug)}`);
    const guides = (await request("/guides")).guides || [];
    for (const guide of guides) await request(`/guides/${encodeURIComponent(guide.slug)}`);

    const targets = [...localUrls].flatMap((url) => [frontend, api.replace(/\/api\/?$/, "")].map((base) => `${base}${url}`));
    for (let index = 0; index < targets.length; index += 8) {
      const results = await Promise.all(targets.slice(index, index + 8).map(async (url) => {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const type = response.headers.get("content-type");
        const bytes = (await response.arrayBuffer()).byteLength;
        return { url, status: response.status, type, bytes, ok: response.ok && /^image\//.test(type || "") && bytes > 100 };
      }));
      report.http.push(...results);
    }
  }

  report.summary = {
    uniqueLocalPaths: localUrls.size,
    missingFiles: report.missingFiles.length,
    runtimeExternalReferences: report.runtimeExternalReferences.length,
    databaseExternalImages: report.database.reduce((n, table) => n + table.external.length, 0),
    databaseMissingFiles: report.database.reduce((n, table) => n + table.missing.length, 0),
    identityRepairsPending: report.identityRepairs.length,
    apiChecks: report.api.length,
    apiFailures: report.api.filter((item) => item.status !== 200).length,
    imageHttpChecks: report.http.length,
    imageHttpFailures: report.http.filter((item) => !item.ok).length,
  };
  const output = args.find((arg) => arg.startsWith("--output="))?.slice(9);
  if (output) fs.writeFileSync(path.resolve(output), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary, null, 2));
  const failed = report.summary.missingFiles || report.summary.runtimeExternalReferences || report.summary.databaseExternalImages || report.summary.databaseMissingFiles || report.summary.apiFailures || report.summary.imageHttpFailures;
  if (failed) process.exitCode = 1;
}

main().catch((error) => { console.error(error.code || error.name, error.message); process.exitCode = 1; });
