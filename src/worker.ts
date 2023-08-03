import { Base64 } from 'js-base64';
import html from './html.js';
import { hash32 } from './mmh3_32_signed.js'
import site_favicon from './site_favicon.js';

const userAgent: string = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'

let upstreamURL: string = ''
let detectMethod: string = 'direct'

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
	// favicon hashes are calculated on a *MODIFIED* base64. Shodan inserts newlines (\n) every 76 characters and at the end of the base64 before calculating the hash:
	const base64 = Base64.fromUint8Array(uint8View).replace(/(.{76}|$)/g, "$1\n")
	// Return a stringified signed integer from mmh3 function:
	const mmh3hash = hash32(base64).toString()
	return mmh3hash
}



async function extractFaviconfromHTML(response: Response) {
	// This function crudely attempts to extract a valid favicon from a html response
	// The return string is a string for a URL location of a favicon we extract
	// DEBUGGING:
	// console.log(`Scraping from ${response.url}`)
	
	const matches: (string | null )[] = []
	
	let returnString: string | null = null
	// Run through the HTML and find shortcun icon links:
	await new HTMLRewriter().on('link[rel="shortcut icon" i]', {
		element(element) {
		// DEBUGGING:
		// console.log(`Shortucut icon located at ${element.getAttribute("href")}`)
		  matches.push(element.getAttribute("href"))
		},
	  }).transform(response).text()
	
	if (matches.length > 0) {
		for (let faviconCandidate of matches) {
			// First, we find the first .ico or .png we come across:
			if (faviconCandidate?.endsWith('ico' || 'png')) {

				returnString = faviconCandidate

				break
			}}
		// Else, we just take the first candidate and run with it:
		var faviconCandidate = matches[0]

		// Handle relative URLs:
		if (faviconCandidate?.startsWith('/')) {
			returnString = new URL(response.url).origin + faviconCandidate
		}
		if (faviconCandidate?.match(/^https?:\/\//)) {
			returnString = faviconCandidate
		}
		// Return with our candidate:
		if (returnString) {
			return returnString
		
		// We don't want to account for every scenario (e.g. inline base64 encoded favicon), so return null if we exhaust our preferred options:
		} else {
			return null
		}			
	} else {
		return null
	}
}


async function JSONResponse(arraybuf: ArrayBuffer, externalRequest: Response) {
	const data = {
		req_url : upstreamURL,
		req_location : externalRequest.url,
		req_content_type : externalRequest.headers.get('Content-Type'),
		size : arraybuf.byteLength,
		favicon_hash : await favicon_to_mmh3(arraybuf),
		md5 : await favicon_to_md5Digest(arraybuf),
		sha256 : await favicon_to_sha256Digest(arraybuf),
		debug_detect_method : detectMethod,
	}
	
	const json = JSON.stringify(data, null, 2);
	
	return new Response(json, {
		headers: {
		"content-type": "application/json;charset=UTF-8",
		}})
}

async function retrieveFavicon(parsedURL: URL) : Promise<Response> { 
	// DEBUGGING:
	// console.log(`retrieving from ${parsedURL}`)

	const externalRequest = await fetch(parsedURL, {
		headers: {
			'User-Agent' : userAgent
		}
	})
	if (externalRequest.redirected) {
		detectMethod = 'redirect'
	}

	if (!externalRequest.ok) {
		if (!parsedURL.pathname) {
			detectMethod = 'guess'
			return await retrieveFavicon(new URL(parsedURL.origin + '/favicon.ico'))
		} else {
			return new Response(`Error getting upstream content - favicon not found at ${externalRequest.url}.\r\nUpstream status: ${externalRequest.status}\r\n${await externalRequest.text()}`, { status: 500 })
		}
	
	} else {
		// If we detect a non-favicon, try to extract from HTML
		if (externalRequest.headers.get('Content-Type')?.startsWith('text/html')) {
			detectMethod = 'html_extract'
			const faviconsFromHTML = await extractFaviconfromHTML(externalRequest)

			if (faviconsFromHTML) {
				return await retrieveFavicon(new URL(faviconsFromHTML))
			}
			// Lastly, fallback to retrieve the favicon from an accepted standard location of the favicon, e.g. https://example.com/favicon.ico
			else {
				detectMethod = 'guess'
				return await retrieveFavicon(new URL(parsedURL.origin + '/favicon.ico'))
			}
		} else {
			// Turn into ArrayBuffer then trigger JSON response
			const arraybuf = await externalRequest.arrayBuffer()

			return await JSONResponse(arraybuf, externalRequest)
		}
		
	}
}

async function apiRequest(requestURL: URL) {
	
	upstreamURL = requestURL.searchParams.get("url") || ''

	if (upstreamURL) {

		if (!upstreamURL.match(/^https?:\/\//)) upstreamURL = 'http://' + upstreamURL
		
		try {
			return await retrieveFavicon(new URL (upstreamURL))

		} catch (e) {
			return new Response(`Error getting upstream content from ${upstreamURL}:\r\n${e}`, { status: 400 })
		}
	} else {
		return new Response(`Error: missing url parameter from request`, { status: 400 })
	}

}

async function fileRequest(request: Request) {
	if (request.method !== "POST") {
		return new Response(`Error: only POST requests accepted at this endpoint`, { status: 400 })
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
				});

			default:
				return new Response('404 not found', {
					status: 404
			})
		}
	},
};
