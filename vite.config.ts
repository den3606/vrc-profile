import { minify } from "html-minifier-terser";
import { defineConfig, type Plugin } from "vite";

function minifyHtmlPlugin(): Plugin {
  return {
    name: "minify-html",
    apply: "build",
    enforce: "post",
    async transformIndexHtml(html) {
      return minify(html, {
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeComments: false,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
        minifyURLs: true,
        processScripts: ["text/javascript", "module"],
      });
    },
  };
}

export default defineConfig({
  root: ".",
  publicDir: "public",
  plugins: [minifyHtmlPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: "esbuild",
    cssMinify: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
