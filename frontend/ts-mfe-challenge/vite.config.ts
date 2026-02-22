import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import path from "path";
import { fileURLToPath } from "url";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're in test mode
const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";

// https://vitejs.dev/config/
export default defineConfig({
    base: process.env.CDN_URL || "/",
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
            manifest: {
                name: "TalentSphere Challenge",
                short_name: "Challenge",
                description: "Coding Challenges & IDE",
                theme_color: "#ffffff",
                background_color: "#ffffff",
                display: "standalone",
                icons: [
                    {
                        src: "pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                ],
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 5000000,
            },
        }),
        federation({
            name: "challenge",
            filename: "remoteEntry.js",
            exposes: {
                "./App": "./src/App.tsx",
            },
            shared: ["react", "react-dom", "zustand", "@talentsphere/api"],
        }),
    ],
    server: {
        port: 3002,
        host: "0.0.0.0",
        proxy: {
            "/api": {
                target: "http://localhost:8000",
                changeOrigin: true,
                secure: false,
                rewrite: path => path,
            },
            "/collaboration": {
                target: "ws://localhost:1234",
                ws: true,
                changeOrigin: true,
            },
        },
    },
    preview: {
        port: 3002,
    },
    build: {
        modulePreload: true,
        target: "esnext",
        minify: "terser",
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ["react", "react-dom"],
                    ui: ["@talentsphere/ui"],
                },
            },
        },
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
    },
    resolve: {
        // Only use mocks during testing
        alias: isTest
            ? [
                  {
                      find: /^monaco-editor($|\/)/,
                      replacement: path.resolve(__dirname, "./__mocks__/monaco-editor.tsx"),
                  },
                  {
                      find: /^@monaco-editor\/react($|\/)/,
                      replacement: path.resolve(__dirname, "./__mocks__/monaco-editor.tsx"),
                  },
                  {
                      find: /\.css$/,
                      replacement: path.resolve(__dirname, "./__mocks__/styleMock.ts"),
                  },
              ]
            : [],
    },
    define: {
        "import.meta.env.VITE_USE_MOCK": JSON.stringify("false"),
    },
    test: {
        globals: true,
        environment: "jsdom",
        css: {
            include: /.+/,
        },
        server: {
            deps: {
                inline: ["monaco-editor", "@monaco-editor/react"],
            },
        },
        setupFiles: "./src/test/setup.tsx",
        alias: [
            {
                find: /^monaco-editor($|\/)/,
                replacement: path.resolve(__dirname, "./__mocks__/monaco-editor.tsx"),
            },
            {
                find: /^@monaco-editor\/react($|\/)/,
                replacement: path.resolve(__dirname, "./__mocks__/monaco-editor.tsx"),
            },
        ],
    },
} as import("@vite/js").UserConfig);
