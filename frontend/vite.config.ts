import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
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
        bypass: (req: { method: string; url: string }) => {
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
    }
  },
});
