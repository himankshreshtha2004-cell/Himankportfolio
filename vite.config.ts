import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// relative base: the site works at a domain root, in a sub-folder, or as a preview artifact
// `vite build --mode preview` inlines the small photos so a preview with a file-count cap still fits
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react()],
  build: { assetsInlineLimit: (file: string) => (mode === "preview" && file.includes("/beyond/") ? true : undefined) },
}));
