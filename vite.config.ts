import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // 部署到 GitHub Pages 子路径（https://<user>.github.io/<repo>/）时需要设成 "/<repo>/"。
  // 工作流会自动注入 VITE_BASE，本地构建默认用根路径。
  base: process.env.VITE_BASE || "/",
  plugins: [tailwindcss(), react()],
});
