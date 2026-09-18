import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "/unloop/",
  plugins: [tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("..", import.meta.url)) } },
  build: { outDir: "../dist-site", emptyOutDir: true },
});
