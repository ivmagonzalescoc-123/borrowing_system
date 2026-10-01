import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Public (signed-out) routes; everything else redirects to /login.
const PUBLIC_ROUTES = ['/login', '/register']

// og:url, og:image and the sitemap need absolute URLs, so they are
// only emitted when VITE_SITE_URL (e.g. https://coc-library.vercel.app) is set.
function seo(siteUrl) {
  return {
    name: 'seo',
    apply: 'build',
    transformIndexHtml() {
      if (!siteUrl) return []
      return [
        { tag: 'meta', attrs: { property: 'og:url', content: `${siteUrl}/login` }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image', content: `${siteUrl}/assets/img/logo.png` }, injectTo: 'head' },
      ]
    },
    generateBundle() {
      if (!siteUrl) return
      const urls = PUBLIC_ROUTES.map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`).join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      })
    },
    writeBundle(options) {
      if (!siteUrl) return
      // public/robots.txt is copied as-is; point it at the sitemap.
      return import('node:fs/promises').then(({ appendFile }) =>
        appendFile(`${options.dir}/robots.txt`, `\nSitemap: ${siteUrl}/sitemap.xml\n`),
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const siteUrl = (loadEnv(mode, '.', '').VITE_SITE_URL || '').replace(/\/+$/, '')
  return {
    plugins: [react(), seo(siteUrl)],
    server: {
      open: true,
    },
  }
})
