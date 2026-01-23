import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig(({command, mode}) => {
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [react(), tailwindcss()],
            root: 'src',
        publicDir: fileURLToPath(new URL('public', import.meta.url)),
        envDir: process.cwd(),
        server: {
        port: 5174,
            open: true,
        },
        build: {
            outDir: '../dist',
                emptyOutDir: true,
        },
        resolve: {
            alias: {
                '@root': fileURLToPath(new URL('src/', import.meta.url)),
            },
        },
    }
});
