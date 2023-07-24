# favicon-hash.kmsec.uk
A Cloudflare Worker to gather favicon hashes for Shodan hunting.

This will calculate the favicon hash for a given file, either by retrieving the favicon from a given URL, or from a file uploaded to the site.

Please give it a go at [https://favicon-hash.kmsec.uk](https://favicon-hash.kmsec.uk).

You can interact with the site programmatically:

Get the favicon hash for a URL:

```bash
curl https://favicon-hash.kmsec.uk/api/?url=https://www.google.com/favicon.ico
```

The provided URL can be URL-encoded to ensure more reliable execution:

```bash
curl https://favicon-hash.kmsec.uk/api/?url=https%3A%2F%2Fwww%2Egoogle%2Ecom%2Ffavicon%2Eico
```
The response from the API request will contain several:

```json
{
  "req_url": "https://google.com/favicon.ico", // The requested URL
  "req_location": "https://www.google.com/favicon.ico", // The final URL
  "req_content_type": "image/x-icon", // The Content-Type provided by the upstream server when requesting the URL
  "favicon_hash": "708578229", // Favicon hash for Shodan searching
  "md5": "f3418a443e7d841097c714d69ec4bcb8", // MD5 hash of the favicon
  "sha256": "6da5620880159634213e197fafca1dde0272153be3e4590818533fab8d040770" // SHA256 of the favicon
}
```

Get the favicon hash from a file through POST request. The response is the favicon hash:

```bash
curl --data-binary @favicon.ico https://favicon-hash.kmsec.uk/file/
```

Once you have the favicon hash, you can search Shodan using `http.favicon.hash:<hash>`