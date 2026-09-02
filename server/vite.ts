import type { Express } from 'express';
import { createServer as createViteServer, createLogger } from "vite";
import type { Server } from 'node:http';
import viteConfig from "../vite.config";
import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";

// Livello di log: silent | quiet (predefinito) | verbose
const LIVELLO = (process.env.LOG ?? 'quiet').toLowerCase();
const viteLogger = createLogger(LIVELLO === 'verbose' ? 'info' : 'warn');

// Avvisi noti e innocui delle dipendenze, da non mostrare in console.
const AVVISI_IGNORATI = [
  'PostCSS plugin did not pass the `from` option',
  'Re-optimizing dependencies',
];
const daIgnorare = (msg: unknown) =>
  typeof msg === 'string' && AVVISI_IGNORATI.some((f) => msg.includes(f));

// PostCSS scrive direttamente su console.warn: filtriamo alla fonte.
if (LIVELLO !== 'verbose') {
  const warnOriginale = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (daIgnorare(args[0])) return;
    warnOriginale(...(args as []));
  };
}

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    logLevel: LIVELLO === 'verbose' ? 'info' : LIVELLO === 'silent' ? 'silent' : 'warn',
    customLogger: {
      ...viteLogger,
      info: (msg, options) => {
        if (LIVELLO === 'verbose') viteLogger.info(msg, options);
      },
      warn: (msg, options) => {
        if (!daIgnorare(msg)) viteLogger.warn(msg, options);
      },
      warnOnce: (msg, options) => {
        if (!daIgnorare(msg)) viteLogger.warnOnce(msg, options);
      },
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("/{*path}", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
