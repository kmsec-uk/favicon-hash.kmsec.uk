import { Base64 } from 'js-base64';
import html from './html.js';
import { hash32 } from './mmh3_32_signed.js'
import site_favicon from './site_favicon.js';




async function favicon_to_hash(arraybuf: ArrayBuffer) {
	// Takes an ArrayBuffer of a favicon file and returns a string

	const uint8View = new Uint8Array(arraybuf);
	// favicon hashes are calculated on a *modified* base64. Shodan inserts newlines (\n) every 76 characters and at the end of the base64 before calculating the hash:
	const base64 = Base64.fromUint8Array(uint8View).replace(/(.{76}|$)/g, "$1\n")
	// Return a stringified signed integer from mmh3 function:
	const mmh3hash = hash32(base64).toString()

	return mmh3hash
}

const userAgent = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'


async function apiRequest(requestURL: URL) {
	const upstream_url = requestURL.searchParams.get("url")
	if (upstream_url) {
		try {
			const external_request = await fetch(upstream_url, {
				
				headers: {
					'User-Agent' : userAgent
				}
			})
			if (!external_request.ok) {
				return new Response(`Error getting upstream content.\r\nUpstream status: ${external_request.status}\r\n${await external_request.text()}`, { status: 500 })
			} else {
				const arraybuf = await  external_request.arrayBuffer()
				const mmh3hash = await favicon_to_hash(arraybuf)
				console.log(`Favicon hash of ${external_request.url}: ${mmh3hash}`)
				return new Response(mmh3hash)
			}

		} catch (e) {
			return new Response(`Error getting upstream content from ${upstream_url}:\r\n${e}`, { status: 500 })
		}
	} else {
		return new Response(`Error: missing url parameter from request`, { status: 500 })
	}

}


export default {
	async fetch(request: Request): Promise<Response> {
		
		const requestURL = new URL(request.url)

		switch (requestURL.pathname) {
			case "/":

			return new Response(html,  {
				headers: {
					'content-type': 'text/html',
				},
			})

			case '/api':
			case '/api/':
				return apiRequest(requestURL)
			
			case '/favicon.ico':
				return new Response(Base64.toUint8Array(site_favicon).buffer, {
					headers: {
						'content-type': 'image/png',
					},
				})
			default:
				return new Response('404 not found', {
					status: 404
			})
		}
	},
};
