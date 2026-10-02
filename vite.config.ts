import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // 部署到 GitHub Pages 子路径（https://<user>.github.io/<repo>/）时需要设成 "/<repo>/"。
  // 工作流会自动注入 VITE_BASE，本地构建默认用根路径。
  base: process.env.VITE_BASE || "/",
  plugins: [tailwindcss(), react()],
  server: {
    watch: {
      // 编辑工具写文件时会先在「.<文件名>.<pid>.<uuid>.tmpdir/」里落地再原子替换，
      // watcher 追到这个已被删掉的临时文件会抛 EBUSY 把 dev server 整个搞崩，这里忽略掉。
      ignored: ["**/*.tmpdir/**", "**/*.tmp"],
    },
  },
});
