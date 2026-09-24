const express = require("express");
const path = require("path");

// One catalogue for tourist, admin and reception clients. Keep client/public/images
// in the deployment alongside the server; uploads remain in server/uploads.
module.exports = express.static(path.resolve(__dirname, "../../../client/public/images"), {
  dotfiles: "deny",
  index: false,
  redirect: false,
  setHeaders(res) {
    res.setHeader("X-Content-Type-Options", "nosniff");
  },
});
