import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// relative base: the site works at a domain root, in a sub-folder, or as a preview artifact
export default defineConfig({ base: "./", plugins: [react()] });
