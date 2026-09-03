import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4173);
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw2ZMnJSM8zwMBQLMg_9k_cJMZlPhZiC82c1rMbZaXe8K52GV0Hz_qMg7ru8pZcdVA/exec";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(body);
}

async function proxyApi(req, res, requestUrl) {
  try {
    const target = new URL(APPS_SCRIPT_URL);
    for (const [key, value] of requestUrl.searchParams) {
      target.searchParams.append(key, value);
    }

    const options = {
      method: req.method,
      redirect: "follow",
      headers: { "Accept": "application/json" }
    };

    if (req.method === "POST") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      options.headers["Content-Type"] = "text/plain;charset=utf-8";
      options.body = Buffer.concat(chunks);
    }

    const upstream = await fetch(target, options);
    const body = await upstream.text();
    send(res, upstream.ok ? 200 : upstream.status, body, "application/json; charset=utf-8");
  } catch (error) {
    console.error("Proxy Luxury:", error);
    send(res, 502, JSON.stringify({
      success: false,
      ok: false,
      message: "No se pudo contactar la agenda."
    }), "application/json; charset=utf-8");
  }
}

async function serveStatic(req, res, requestUrl) {
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/") pathname = "/index.html";

  const relative = pathname.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT, relative);
  if (!filePath.startsWith(ROOT + path.sep)) {
    return send(res, 403, "Acceso denegado");
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) throw new Error("not file");
    const data = await fs.readFile(filePath);
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff"
    });
    res.end(data);
  } catch (_) {
    send(res, 404, "Archivo no encontrado");
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (requestUrl.pathname === "/api/luxury") {
    if (req.method !== "GET" && req.method !== "POST") {
      return send(res, 405, "Método no permitido");
    }
    return proxyApi(req, res, requestUrl);
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Método no permitido");
  }

  return serveStatic(req, res, requestUrl);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`The Luxury Studio listo en http://localhost:${PORT}`);
  console.log("La agenda está enlazada con Google Apps Script.");
});
