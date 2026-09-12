import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  plugins: [
    tanstackStart({
      server: { entry: "server" },
      nitro: {
        preset: "vercel",
      },
    }),
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
});