import type { RequestHandler } from './$types'

export const prerender = true

const SITE_URL = 'https://rust-rcon-web.evs-ptr.workers.dev'

const pages = import.meta.glob('/src/routes/**/+page.svelte')
const staticPages = Object.keys(pages)
	.filter((path) => !path.includes('['))
	.map((path) => {
		return path.replace('/src/routes', '').replace('/+page.svelte', '')
	})

export const GET: RequestHandler = async () => {
	const body = render(staticPages)
	const response = new Response(body)
	response.headers.set('Cache-Control', 'max-age=0, s-maxage=3600')
	response.headers.set('Content-Type', 'application/xml')
	return response
}

function render(staticPages: string[]) {
	return `<?xml version="1.0" encoding="UTF-8" ?>
<urlset
  xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="https://www.w3.org/1999/xhtml"
  xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
  xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
  xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
>
${staticPages
	.map((path) => {
		return `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`
	})
	.join('\n')}
</urlset>`.trim()
}
