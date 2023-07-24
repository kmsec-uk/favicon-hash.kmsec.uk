import { Base64 } from 'js-base64';
import html from './html.js';
import { hash32 } from './mmh3_32_signed.js'
import site_favicon from './site_favicon.js';

async function favicon_to_sha256Digest(arraybuf: ArrayBuffer) {
	const hashArray = await crypto.subtle.digest("SHA-256", arraybuf)
	const uint8ViewOfHash = new Uint8Array(hashArray);
	const hashAsString = Array.from(uint8ViewOfHash)
	  .map((b) => b.toString(16).padStart(2, "0"))
	  .join("");
	return hashAsString;
}

async function favicon_to_md5Digest(arraybuf: ArrayBuffer) {
	const hashArray = await crypto.subtle.digest("MD5", arraybuf)
	const uint8ViewOfHash = new Uint8Array(hashArray);
	const hashAsString = Array.from(uint8ViewOfHash)
	  .map((b) => b.toString(16).padStart(2, "0"))
	  .join("");
	return hashAsString;
}

async function favicon_to_mmh3(arraybuf: ArrayBuffer) {
	// Takes an ArrayBuffer of a favicon file and returns a string (favicon hash for Shodan)
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
				
				const data = {
					req_url : upstream_url,
					req_location : external_request.url,
					req_content_type : external_request.headers.get("Content-Type"),
					favicon_hash : await favicon_to_mmh3(arraybuf),
					md5 : await favicon_to_md5Digest(arraybuf),
					sha256 : await favicon_to_sha256Digest(arraybuf),
				}
				const json = JSON.stringify(data, null, 2);
				
				return new Response(json, {
					headers: {
					  "content-type": "application/json;charset=UTF-8",
					}})
			}

		} catch (e) {
			return new Response(`Error getting upstream content from ${upstream_url}:\r\n${e}`, { status: 500 })
		}
	} else {
		return new Response(`Error: missing url parameter from request`, { status: 500 })
	}

}

async function fileRequest(request: Request) {
	if (request.method !== "POST") {
		return new Response(`Error: only POST requests accepted at this endpoint`, { status: 500 })
	} else {
		const arraybuf =  await request.arrayBuffer()
		const data = {
			favicon_hash : await favicon_to_mmh3(arraybuf),
			md5 : await favicon_to_md5Digest(arraybuf),
			sha256 : await favicon_to_sha256Digest(arraybuf),
		}
		const json = JSON.stringify(data, null, 2);
		
		return new Response(json, {
			headers: {
			  "content-type": "application/json;charset=UTF-8",
			}})
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
			
			case '/file':
			case '/file/':
				return fileRequest(request)
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
