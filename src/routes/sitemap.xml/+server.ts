import type { RequestHandler } from './$types'

export const prerender = true

const SITE_URL = 'https://rust-rcon-web.evs-ptr.workers.dev'

class SitemapPage {
	readonly url: string
	readonly lastmod: string

	constructor(url: string, lastmod: string) {
		this.url = url
		this.lastmod = lastmod
	}
}

const pages = [new SitemapPage('', '2025-07-16'), new SitemapPage('/rcon', '2025-07-16')]

export const GET: RequestHandler = async () => {
	const body = render(pages)
	const response = new Response(body)
	response.headers.set('Cache-Control', 'max-age=0, s-maxage=3600')
	response.headers.set('Content-Type', 'application/xml')
	return response
}

function render(staticPages: SitemapPage[]) {
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
	.map((page) => {
		return `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
  </url>`
	})
	.join('\n')}
</urlset>`.trim()
}
