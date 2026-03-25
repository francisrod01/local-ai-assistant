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
  plugins: [
    ignoreWellKnownPlugin(),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  server: {
    proxy: {
      "/api/chat_stream": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/api/chat": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
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
      "/api/environment": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/api/interactions": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/api/ollama_logs": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/api/interaction_insights": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/api/ollama_runtime_settings": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/api/history": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/api/history/conversation": {
        target: "http://backend:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
