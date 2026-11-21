/* Build WinList.html — a single-file offline build with fonts embedded.
 * Usage: node build.js
 */
const fs = require("fs");
const path = require("path");

const root = __dirname;
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const cssSource = read("assets/app.css");
const cssInline = cssSource.replace(
  /url\("\.\/fonts\/([^"]+)"\)/g,
  function (match, file) {
    const font = fs.readFileSync(path.join(root, "assets", "fonts", file));
    return 'url("data:font/woff2;base64,' + font.toString("base64") + '")';
  }
);

const scriptSource = read("assets/app.js");
let html = read("index.html");

html = html
  .replace(/\n\s*<link rel="manifest"[^>]*>/, "")
  .replace(/\n\s*<link rel="icon"[^>]*>/, "")
  .replace(/\n\s*<link rel="apple-touch-icon"[^>]*>/, "")
  .replace(/\n\s*<link\s+rel="preload"[\s\S]*?\/>/g, "")
  .replace(
    '<link rel="stylesheet" href="assets/app.css" />',
    "<style>\n" + cssInline + "\n    </style>"
  )
  .replace(
    '<script src="assets/app.js" defer></script>',
    "<script>\n" + scriptSource + "\n    </script>"
  );

const banner =
  "<!-- WinList standalone build: all CSS, JS and fonts are embedded. " +
  "Data stays in this browser's localStorage. Built " +
  new Date().toISOString().slice(0, 10) +
  ". -->\n";

html = html.replace("<!doctype html>", "<!doctype html>\n" + banner);

const output = path.join(root, "WinList.html");
fs.writeFileSync(output, html, "utf8");

const kb = Math.round(Buffer.byteLength(html, "utf8") / 1024);
console.log("Wrote WinList.html (" + kb + " KB)");
