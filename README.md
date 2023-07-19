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

Get the favicon hash from a file through POST request. The response is the favicon hash:

```bash
curl --data-binary @favicon.ico https://favicon-hash.kmsec.uk/file/
```
