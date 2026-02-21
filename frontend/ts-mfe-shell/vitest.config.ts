import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./test/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'test/',
                '**/*.spec.ts',
                '**/*.test.ts',
                '**/*.test.tsx',
                '**/dist/',
                '**/.{idea,git,cache,output,temp}/',
                '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
            ],
            thresholds: {
                lines: 90,
                functions: 90,
                branches: 85,
                statements: 90,
            },
        },
        include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@services': path.resolve(__dirname, './src/services'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@test': path.resolve(__dirname, './test'),
            // Module federation mocks for testing
            'lms/App': path.resolve(__dirname, './__mocks__/lms/App.tsx'),
            'challenge/App': path.resolve(__dirname, './__mocks__/challenge/App.tsx'),
        },
    },
});
