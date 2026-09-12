import server from "../dist/server/server.js";

export default async function handler(req, res) {
  // If invoked in Web Standard environment (Edge / Web Request)
  if (req instanceof Request) {
    return server.fetch(req);
  }

  // Node.js Serverless Function environment (req: IncomingMessage, res: ServerResponse)
  try {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
    const url = new URL(req.url, `${protocol}://${host}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    const method = req.method || "GET";
    let body = null;
    if (method !== "GET" && method !== "HEAD") {
      body = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    const webReq = new Request(url.href, {
      method,
      headers,
      body,
    });

    const webRes = await server.fetch(webReq);

    res.statusCode = webRes.status;
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const arrayBuffer = await webRes.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("Vercel Serverless Function Error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      `<!doctype html><html><head><title>Server Error</title></head><body><h1>Server Error</h1><p>${
        err?.message || "Internal Server Error"
      }</p></body></html>`,
    );
  }
}
