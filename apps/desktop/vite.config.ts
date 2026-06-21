import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import path from "path";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "./" : "/",
  plugins: [
    react(),
    {
      name: "orca-favicon",
      transformIndexHtml(html) {
        const favicon = command === "serve" ? "favicon-dev.ico" : "favicon.ico";
        return html.replace(
          "<!-- favicon -->",
          `<link rel="icon" href="/${favicon}" sizes="any" />\n    <link rel="apple-touch-icon" href="/${command === "serve" ? "apple-touch-icon-dev.png" : "apple-touch-icon.png"}" />`
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/renderer"),
      "@newsflow/config": path.resolve(__dirname, "../../packages/config/src/index.ts"),
      "@newsflow/db": path.resolve(__dirname, "../../packages/db/src/index.ts"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
}));
