import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

function ignoreWellKnownPlugin() {
  return {
    name: "ignore-well-known",
    configureServer(server: any) {
      // Chrome DevTools sometimes pings /.well-known/appspecific/com.chrome.devtools.json
      // when running inside containers/remote environments.  the react-router dev
      // server treats every request as a route and throws if nothing matches, which
      // cluttered our logs.  just short‑circuit those requests with a 204.
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith("/.well-known")) {
          res.writeHead(204);
          res.end();
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [ignoreWellKnownPlugin(), tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    proxy: {
      "/chat_stream": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/chat": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
        // only proxy non-GET requests; allow frontend dev server to serve the
        // React page for GET so the client-side router can render.
        // Vite's types expect the Node IncomingMessage signature, so we
        // relax to `any` to avoid the false-positive error shown by
        // `npm run typecheck`.
        bypass: (req: any) => {
          if (req.method === "GET") {
            return req.url;
          }
        },
      },
      "/history": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
      },
      "/models": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
      },
      "/health": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
      },
      "/pull": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
      },
      // backend telemetry endpoints
      // rewrite API-prefixed telemetry endpoints to avoid colliding with
      // client-side routes.  the backend still listens on /metrics and
      // /ollama_status, so we drop the /api prefix when proxying.
      "/api/metrics": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/api/ollama_status": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    }
  },
});
