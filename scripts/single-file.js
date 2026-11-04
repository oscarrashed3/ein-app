// Builds dist-single/EIN-app.html: the whole web app in one file that opens by double-click (file://).
// Browsers refuse history.pushState on file:// and expo-router reads window.location for routes,
// so on file:// the app gets a virtual location (starting at "/") and history calls keep the URL out.
const fs = require("fs");
const path = require("path");
const dist = path.join(__dirname, "..", "dist");
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const src = html.match(/<script src="([^"]+)" defer><\/script>/)[1];
let js = fs.readFileSync(path.join(dist, src), "utf8");

// Inline every asset the bundle references as a data URI.
const mime = { ttf: "font/ttf", png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml", otf: "font/otf" };
js = js.replace(/"(\/assets\/[^"]+\.(ttf|png|jpg|svg|otf))"/g, (m, p, ext) => {
  const f = path.join(dist, p);
  if (!fs.existsSync(f)) return m;
  return JSON.stringify(`data:${mime[ext]};base64,${fs.readFileSync(f).toString("base64")}`);
});
// Route all location reads through a swappable object.
js = js.replace(/window\.location/g, "window.__einLoc");
js = js.replace(/([^a-zA-Z_$.])location\.(href|origin|pathname|protocol|search|hash)/g, "$1window.__einLoc.$2");

const shim = `<script>
(function(){
  // Real web server: use the real location. Anything else (file://, about:srcdoc, blob:, sandboxed previews): virtual.
  if (/^https?:$/.test(location.protocol) && location.pathname.indexOf(".html") < 0) { window.__einLoc = window.location; return; }
  // Storage can be blocked in sandboxed previews: fall back to memory so the app still runs.
  try { var k = "__ein_t"; window.localStorage.setItem(k, "1"); window.localStorage.removeItem(k); }
  catch (e) {
    var mem = {};
    var store = { getItem: function(k){ return k in mem ? mem[k] : null }, setItem: function(k,v){ mem[k] = String(v) },
      removeItem: function(k){ delete mem[k] }, clear: function(){ mem = {} }, key: function(i){ return Object.keys(mem)[i] || null },
      get length(){ return Object.keys(mem).length } };
    try { Object.defineProperty(window, "localStorage", { value: store, configurable: true }); } catch (e2) {}
  }
  var cur = new URL("http://localhost/");
  var L = {
    get href(){return cur.href}, get pathname(){return cur.pathname}, get search(){return cur.search},
    get hash(){return cur.hash}, get origin(){return cur.origin}, get protocol(){return cur.protocol},
    get host(){return cur.host}, get hostname(){return cur.hostname}, get port(){return cur.port},
    reload:function(){location.reload()}, assign:function(u){set(u)}, replace:function(u){set(u)}, toString:function(){return cur.href}
  };
  function set(u){ if (u != null && u !== "") cur = new URL(String(u), cur); }
  var H = window.history, push = H.pushState.bind(H), rep = H.replaceState.bind(H);
  H.pushState = function(s,t,u){ set(u); try { push(Object.assign({}, s, {__u: cur.href}), t); } catch (e) {} };
  H.replaceState = function(s,t,u){ set(u); try { rep(Object.assign({}, s, {__u: cur.href}), t); } catch (e) {} };
  window.addEventListener("popstate", function(){ var s = null; try { s = H.state } catch (e) {} cur = new URL(s && s.__u ? s.__u : "http://localhost/"); }, true);
  window.__einLoc = L;
})();
</script>`;

let out = html
  .replace(/<link rel="icon"[^>]*>/, "")
  .replace("</head>", shim + "</head>")
  .replace(/<script src="[^"]+" defer><\/script>/, () => "<script>" + js.replace(/<\/script/gi, "<\\/script") + "</script>");
fs.mkdirSync(path.join(__dirname, "..", "dist-single"), { recursive: true });
const outFile = path.join(__dirname, "..", "dist-single", "EIN-app.html");
fs.writeFileSync(outFile, out);
console.log("wrote", outFile, (out.length / 1e6).toFixed(2) + " MB");
