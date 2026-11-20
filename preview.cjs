"use strict";

const http = require("node:http");
const { createReadStream, realpathSync } = require("node:fs");
const { realpath, stat } = require("node:fs/promises");
const path = require("node:path");
const { pipeline } = require("node:stream");

const root = realpathSync(path.join(__dirname, "dist"));
const port = Number(process.argv[2] ?? 8000);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".m4a": "audio/mp4",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function byteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header ?? "");
  if (!match || (!match[1] && !match[2])) return undefined;

  const [, first, last] = match;
  const start = first ? Number(first) : Math.max(0, size - Number(last));
  const end = first && last ? Math.min(Number(last), size - 1) : size - 1;
  return start <= end ? { start, end } : null;
}

async function serve(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  let file, size;
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const requested = pathname === "/" ? "/index.html" : pathname;
    file = await realpath(path.resolve(root, "." + requested));
    if (!file.startsWith(root + path.sep)) {
      response.writeHead(404).end();
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) {
      response.writeHead(404).end();
      return;
    }
    size = info.size;
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : 404).end();
    return;
  }

  // Video controls use byte ranges to seek without downloading the whole clip.
  const range = request.method === "GET" ? byteRange(request.headers.range, size) : undefined;
  const headers = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-cache",
    "Content-Type": contentTypes[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Content-Length": size,
  };
  if (range === null) {
    response.writeHead(416, { ...headers, "Content-Range": `bytes */${size}`, "Content-Length": 0 }).end();
    return;
  }
  if (range) {
    headers["Content-Range"] = `bytes ${range.start}-${range.end}/${size}`;
    headers["Content-Length"] = range.end - range.start + 1;
  }
  response.writeHead(range ? 206 : 200, headers);
  if (request.method === "HEAD" || size === 0) {
    response.end();
    return;
  }
  pipeline(createReadStream(file, range), response, () => {});
}

const server = http.createServer(serve);
server.listen(port, "127.0.0.1", () => {
  console.log(`Preview at http://localhost:${server.address().port}/`);
});
