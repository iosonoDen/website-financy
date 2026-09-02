import "dotenv/config";
import express, { Response, NextFunction } from 'express';
import type { Request } from 'express';
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "node:http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Verbosità della console: LOG=silent | quiet (predefinito) | verbose
// - silent : nessun log delle richieste
// - quiet  : solo le richieste con errore (stato >= 400)
// - verbose: tutte le richieste, con il corpo della risposta
const LIVELLO_LOG = (process.env.LOG ?? "quiet").toLowerCase();

app.use((req, res, next) => {
  if (LIVELLO_LOG === "silent") return next();

  const start = Date.now();
  const path = req.path;
  let corpoRisposta: unknown;

  if (LIVELLO_LOG === "verbose") {
    const jsonOriginale = res.json;
    res.json = function (bodyJson, ...args) {
      corpoRisposta = bodyJson;
      return jsonOriginale.apply(res, [bodyJson, ...args]);
    };
  }

  res.on("finish", () => {
    if (!path.startsWith("/api")) return;
    const errore = res.statusCode >= 400;
    if (LIVELLO_LOG !== "verbose" && !errore) return;

    const durata = Date.now() - start;
    let riga = `${req.method} ${path} ${res.statusCode} in ${durata}ms`;
    if (corpoRisposta !== undefined) {
      const testo = JSON.stringify(corpoRisposta) ?? "";
      riga += ` :: ${testo.length > 300 ? `${testo.slice(0, 300)}…` : testo}`;
    }
    log(riga);
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "0.0.0.0";
  // `reusePort` è supportato solo da Linux: su Windows e macOS produce ENOTSUP.
  const reusePort = process.platform === "linux";

  httpServer.on("error", (errore: NodeJS.ErrnoException) => {
    if (errore.code === "EADDRINUSE") {
      log(`la porta ${port} è occupata. Avvia con un'altra porta, per esempio PORT=5173`);
    } else if (errore.code === "ENOTSUP" || errore.code === "EACCES") {
      log(`impossibile ascoltare su ${host}:${port} (${errore.code}). Prova con HOST=127.0.0.1`);
    } else {
      log(`errore del server: ${errore.message}`);
    }
    process.exit(1);
  });

  httpServer.listen({ port, host, reusePort }, () => {
    log(`serving on port ${port} — apri http://localhost:${port}`);
  });
})();
