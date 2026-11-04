// Builds pages/: the single-file app as index.html for GitHub Pages (served from a sub-folder,
// so the app always uses its virtual location). Run after single-file.js.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
let s = fs.readFileSync(path.join(root, "dist-single", "EIN-app.html"), "utf8");
const a = 'if (/^https?:$/.test(location.protocol) && location.pathname.indexOf(".html") < 0) { window.__einLoc = window.location; return; }';
if (!s.includes(a)) throw new Error("location shim not found");
s = s.replace(a, "/* hosted under a sub-folder (GitHub Pages): always use the virtual location */");
const out = path.join(root, "pages");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "index.html"), s);
fs.writeFileSync(path.join(out, ".nojekyll"), "");
console.log("pages/index.html", s.length);
