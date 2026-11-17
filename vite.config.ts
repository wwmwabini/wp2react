import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // '' prefix loads all variables from .env, not just VITE_ ones (server-side only, never bundled)
  const env = loadEnv(mode, process.cwd(), '')
  const raw = (env.WP_API_URL || env.VITE_WP_API_URL || '').replace(/\/$/, '')
  const url = raw ? new URL(raw) : null

  const headers: Record<string, string> = {}
  if (env.WP_USER && env.WP_APP_PASSWORD) {
    headers.Authorization = 'Basic ' + Buffer.from(`${env.WP_USER}:${env.WP_APP_PASSWORD}`).toString('base64')
  }

  return {
    plugins: [react()],
    server: {
      proxy: url
        ? {
            '/api/wp': {
              target: url.origin,
              changeOrigin: true,
              headers,
              rewrite: (p: string) => p.replace(/^\/api\/wp/, url.pathname),
            },
          }
        : {},
    },
  }
})