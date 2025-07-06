import { defineConfig } from 'vite'
import path from "path";
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    root: "./frontend",
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./frontend/src/")
        },
    },
    server: {
        host: "0.0.0.0",
        hmr: {
            
        },
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true
            }
        }
    }
});