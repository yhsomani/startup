/**
 * Simple working Vite configuration with minimal types
 */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import { VitePWA } from "vite-plugin-pwa";

// Simple remote configurations (avoid complex types)
const remotes = {
    lms: "http://localhost:3001/assets/remoteEntry.js",
    challenge: "http://localhost:3002/assets/remoteEntry.js",
    analytics: "http://localhost:3003/assets/remoteEntry.js",
    dashboard: "http://localhost:3004/assets/remoteEntry.js",
    recruitment: "http://localhost:3005/assets/remoteEntry.js",
};

// Simple shared dependencies
const shared = {
    react: { singleton: true, requiredVersion: "^18.0.0" },
    "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
    "react-router-dom": { singleton: true, requiredVersion: "^6.0.0" },
    zustand: { singleton: true, requiredVersion: "^4.0.0" },
    axios: { singleton: false },
    "date-fns": { singleton: false },
};

export default defineConfig({
    base: process.env.CDN_URL || "/",
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
            manifest: {
                name: "TalentSphere",
                short_name: "TalentSphere",
                description: "Learning Management System with Coding Challenges",
                theme_color: "#6366f1",
                background_color: "#ffffff",
                display: "standalone",
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/api\./i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "api-cache",
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24,
                            },
                        },
                    },
                ],
            },
        }),
        federation({
            name: "shell",
            filename: "remoteEntry.js",
            exposes: {
                "./shell-container": "./src/components/ShellContainer",
                "./auth-provider": "./src/contexts/AuthContext",
                "./theme-provider": "./src/contexts/ThemeContext",
                "./shared-utils": "./src/utils/shared",
            },
            remotes,
        }),
    ],

    server: {
        port: 3000,
        host: true,
        cors: true,
        proxy: {
            "/api": {
                target: "http://localhost:8000",
                changeOrigin: true,
                secure: false,
            },
            "/collaboration": {
                target: "ws://localhost:1234",
                ws: true,
                changeOrigin: true,
            },
        },
    },

    build: {
        modulePreload: true,
        target: "es2020",
        minify: "terser",
        cssCodeSplit: true,
        sourcemap: process.env.NODE_ENV !== "production",
        reportCompressedSize: true,
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            output: {
                manualChunks: id => {
                    // Core React framework
                    if (
                        id.includes("node_modules/react") ||
                        id.includes("node_modules/react-dom")
                    ) {
                        return "vendor-react";
                    }
                    // Router
                    if (id.includes("react-router-dom")) {
                        return "vendor-router";
                    }
                    // State management
                    if (id.includes("zustand")) {
                        return "vendor-state";
                    }
                    // HTTP / data utils
                    if (id.includes("axios") || id.includes("date-fns")) {
                        return "vendor-utils";
                    }
                    // Sentry
                    if (id.includes("@sentry")) {
                        return "vendor-sentry";
                    }
                    // Socket.io
                    if (id.includes("socket.io")) {
                        return "vendor-socket";
                    }
                },
                // Use content hashes for cache-busting
                chunkFileNames: "assets/js/[name]-[hash].js",
                entryFileNames: "assets/js/[name]-[hash].js",
                assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
            },
            external: id => id.includes("remoteEntry"),
        },
        terserOptions: {
            compress: {
                drop_console: process.env.NODE_ENV === "production",
                drop_debugger: true,
                pure_funcs: ["console.debug", "console.trace"],
            },
            format: {
                comments: false,
            },
        },
    },

    preview: {
        port: 3000,
        host: true,
    },

    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: "./src/test/setup.ts",
    },

    define: {
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
        "process.env.VITE_APP_VERSION": JSON.stringify(process.env.npm_package_version || "1.0.0"),
        "process.env.VITE_API_URL": JSON.stringify(
            process.env.VITE_API_URL || "http://localhost:8000"
        ),
    },
});
