import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./public", import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

function resolvePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const safePath = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const target = join(root, safePath === "/" ? "index.html" : safePath);
  if (!target.startsWith(root)) return null;
  return target;
}

const server = createServer(async (req, res) => {
  try {
    const target = resolvePath(req.url || "/");
    if (!target) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    let filePath = target;
    const fileStat = await stat(filePath).catch(() => null);
    if (!fileStat) {
      filePath = join(root, "index.html");
    } else if (fileStat.isDirectory()) {
      filePath = join(filePath, "index.html");
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": types[extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Server error: ${error.message}`);
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Try: PORT=${port + 1} npm start`);
    process.exit(1);
  }
  if (error.code === "EACCES" || error.code === "EPERM") {
    console.error(`Cannot listen on ${host}:${port}. Try a higher port, for example: PORT=3100 npm start`);
    process.exit(1);
  }
  throw error;
});

server.listen(port, host, () => {
  console.log(`Money Finance Panel running at http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
});
