import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // For GitHub Pages deployment, use relative paths so that the app works in a subdirectory.
  base: process.env.VITE_BASE_URL ?? "./",
  server: {
    port: Number(process.env.DEV_SERVER_PORT ?? 8080),
    host: process.env.DEV_SERVER_HOST,
    allowedHosts: process.env.DEV_SERVER_DOMAIN != null ? [process.env.DEV_SERVER_DOMAIN] : undefined,
  },
});
