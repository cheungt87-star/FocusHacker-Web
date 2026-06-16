import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

/** Vite static server does not map directory roots without trailing slash. */
function staticIndexRouteFix(): Plugin {
  const redirects: Record<string, string> = {
    "/blog": "/blog/",
    "/who-is-it-for": "/who-is-it-for/",
    "/privacy-policy": "/privacy-policy.html",
    "/terms-of-service": "/terms-of-service.html",
  };
  const middleware = (
    req: { url?: string },
    _res: unknown,
    next: () => void
  ) => {
    const raw = req.url ?? "";
    const path = raw.split("?")[0];
    const target = redirects[path];
    if (target) {
      const qs = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
      req.url = `${target}${qs}`;
    }
    next();
  };
  return {
    name: "static-index-route-fix",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  root: ".",
  plugins: [react(), staticIndexRouteFix()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        blogIndex: resolve(__dirname, "blog/index.html"),
        blogWhyFocus: resolve(__dirname, "blog/why-focus-systems-matter.html"),
        blogFocusApps: resolve(__dirname, "blog/focus-apps-vs-systems.html"),
        blogBestTools: resolve(__dirname, "blog/best-focus-tools-mac.html"),
        whoIsItFor: resolve(__dirname, "who-is-it-for/index.html"),
        privacyPolicy: resolve(__dirname, "privacy-policy.html"),
        termsOfService: resolve(__dirname, "terms-of-service.html"),
      },
    },
  },
});
