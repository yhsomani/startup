import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import path from "path";

// Shared singleton dependencies to avoid loading multiple versions
const sharedDependencies = {
    react: { singleton: true, requiredVersion: "^18.0.0" },
    "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
    "react-router-dom": { singleton: true, requiredVersion: "^6.0.0" },
    zustand: { singleton: true, requiredVersion: "^4.0.0" },
};

// https://vitejs.dev/config/
export default defineConfig({
    base: process.env.CDN_URL || "/",
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    define: {
        "import.meta.env.VITE_USE_MOCK": JSON.stringify("false"),
    },
    plugins: [
        react(),
        federation({
            name: "lms",
            filename: "remoteEntry.js",
            exposes: {
                "./App": "./src/App.tsx",
            },
            shared: sharedDependencies,
        }),
    ],
    build: {
        modulePreload: false,
        target: "esnext",
        minify: false,
        cssCodeSplit: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    "vendor-react": ["react", "react-dom"],
                    "vendor-router": ["react-router-dom"],
                    "vendor-state": ["zustand"],
                },
            },
        },
    },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: "./src/test/setup.tsx",
    },
} as any);
