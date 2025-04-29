import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(), 
    runtimeErrorOverlay(), 
    themePlugin({
      themeJsonPath: path.resolve(__dirname, "theme.json")
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared")
    }
  },
  build: {
    outDir: "./dist",
    emptyOutDir: true
  },
  css: {
    postcss: "./postcss.config.cjs"
  }
}); 