import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("chat", "routes/chat.tsx"),
  route("ollama_status", "routes/ollama_status.tsx"),
  route("metrics", "routes/metrics.tsx"),
] satisfies RouteConfig;
