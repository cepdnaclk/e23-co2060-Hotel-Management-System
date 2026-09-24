const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const { once } = require("node:events");

const media = import("../../shared/media.mjs");

test("catalogue images stay on the frontend; uploads use the API", async () => {
  const { createAssetUrl } = await media;
  const resolve = createAssetUrl({ serverBaseUrl: "http://localhost:5000/" });
  const local = "/images/destinations/sigiriya-rock-fortress/main.jpg";
  for (const input of [local, local.slice(1), `.${local}`, `  ${local}  `, `http://localhost:5000${local}`]) {
    assert.equal(resolve(input), local);
    assert.equal(resolve(resolve(input)), local);
  }
  assert.equal(resolve("/uploads/guide/photo.jpg"), "http://localhost:5000/uploads/guide/photo.jpg");
  assert.equal(resolve("uploads/event.jpg"), "http://localhost:5000/uploads/event.jpg");
  assert.equal(resolve("/videos/hero.mp4"), "/videos/hero.mp4");
});

test("asset configuration supports separate clients, relative APIs and deployment subpaths", async () => {
  const { createAssetUrl } = await media;
  const publicClient = createAssetUrl({ serverBaseUrl: "https://api.example.test", publicBaseUrl: "/travel/" });
  assert.equal(publicClient("/images/room.jpg"), "/travel/images/room.jpg");
  assert.equal(publicClient(publicClient("/images/room.jpg")), "/travel/images/room.jpg");
  const admin = createAssetUrl({ serverBaseUrl: "https://api.example.test/", publicBaseUrl: "https://api.example.test/" });
  assert.equal(admin("/images/room.jpg"), "https://api.example.test/images/room.jpg");
  assert.equal(admin(admin("/images/room.jpg")), "https://api.example.test/images/room.jpg");
  assert.equal(createAssetUrl()("/uploads/photo.jpg"), "/uploads/photo.jpg");
});

test("existing remote photos, upload previews and map URLs are preserved", async () => {
  const { createAssetUrl } = await media;
  const resolve = createAssetUrl({ serverBaseUrl: "http://localhost:5000" });
  for (const url of ["https://hotel.example.test/photo.jpg", "//cdn.example.test/photo.jpg", "blob:http://localhost:5173/preview", "data:image/png;base64,AAAA", "https://www.google.com/maps?q=Sri+Lanka", "https://www.openstreetmap.org/", "https://api.openrouteservice.org/"]) {
    assert.equal(resolve(url), url);
  }
  for (const empty of [null, undefined, "", "  ", {}, "javascript:alert(1)"]) assert.equal(resolve(empty), "");
});

test("legacy snapshot conversion resolves downloaded photos without external requests", async () => {
  const { createAssetUrl, IMAGE_PLACEHOLDER } = await media;
  const { legacyImagePaths } = await import("../../shared/legacyImagePaths.mjs");
  const resolve = createAssetUrl();
  for (const [source, local] of Object.entries(legacyImagePaths)) {
    assert.equal(resolve(`https://${source}`), local);
    assert.ok(fs.existsSync(path.resolve(__dirname, "../../client/public", `.${local}`)), local);
  }
  assert.equal(resolve("https://images.unsplash.com/unknown-photo"), IMAGE_PLACEHOLDER);
});

test("Express serves shared catalogue images and returns a real 404 for missing files", async (t) => {
  const app = express();
  app.use("/images", require("../src/middleware/localImages"));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const file of ["destinations/sigiriya-rock-fortress/main.jpg", "destinations/temple-of-the-sacred-tooth-relic/main.jpg", "destinations/nine-arch-bridge/main.jpg", "image-unavailable.svg"]) {
    const result = await fetch(`${base}/images/${file}`);
    assert.equal(result.status, 200);
    assert.match(result.headers.get("content-type"), /^image\//);
    assert.ok((await result.arrayBuffer()).byteLength > 100);
  }
  const missing = await fetch(`${base}/images/does-not-exist.jpg`);
  assert.equal(missing.status, 404);
  await missing.text();
});
