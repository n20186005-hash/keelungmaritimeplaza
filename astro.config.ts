import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://keelungmaritimeplaza.com",
  integrations: [sitemap()],
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
});
