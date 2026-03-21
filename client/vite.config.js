import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react()],
        define: {
            'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL)
        },
        build: {
            outDir: 'build',
        },
        server: {
            port: 3000,
        },
    }
})
