import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://keelungmaritimeplaza.com",
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/404"),
    }),
  ],
  // 主體維持靜態輸出；天氣面板以伺服器元件（server island）在 Cloudflare Workers 上即時渲染後回傳。
  output: "static",
  adapter: cloudflare({
    imageService: "passthrough",
    // 以 Node 執行靜態預渲染，避免本機 workerd 環境差異造成建置失敗。
    prerenderEnvironment: "node",
  }),
  vite: {
    plugins: [tailwindcss()],
  },
});
