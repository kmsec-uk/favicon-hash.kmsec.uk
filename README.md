# favicon-hash.kmsec.uk
A Cloudflare Worker to gather favicon hashes for Shodan, Censys, and VirusTotal hunting.

This will calculate the favicon hash for a given file, either by retrieving the favicon from a given URL, or from a file uploaded to the site.

Please give it a go at [https://favicon-hash.kmsec.uk](https://favicon-hash.kmsec.uk).

## Retrieving a favicon hash from URL

You can interact with the Worker programmatically (e.g. with `curl`):

Get the favicon hash for a URL:

```bash
curl https://favicon-hash.kmsec.uk/api/?url=https://www.google.com/favicon.ico
```

The provided URL can be URL-encoded to ensure more reliable execution:

```bash
curl https://favicon-hash.kmsec.uk/api/?url=https%3A%2F%2Fwww%2Egoogle%2Ecom%2Ffavicon%2Eico
```

The Worker will try to intelligently retrieve a favicon by extracting the path from HTML. If that doesn't work, it will try the default location of `example.com/favicon.ico` like many browsers do:

```bash
curl https://favicon-hash.kmsec.uk/api/?url=laptopmag.com
# Response:
{
  "req_url": "http://laptopmag.com",
  "req_location": "https://vanilla.futurecdn.net/laptopmag/751486/favicon.ico",
  "req_content_type": "image/x-icon",
  "size": 15086,
  "favicon_hash": "-1658992314",
  "md5": "f66dfa8028ad96fe5a3a93d72e1289bf",
  "sha256": "5c4e137d4bcf2a86fbab08a0a416ecfbaff97cd410254a1dd4dd9d3d36eb3762",
  "debug_detect_method": [
    "redirect",
    "html_extract"
  ]
}
```

The response from the API request will contain several artefacts:

```json
{
  "req_url": "https://google.com/favicon.ico", // The requested URL
  "req_location": "https://www.google.com/favicon.ico", // The final URL for the favicon
  "req_content_type": "image/x-icon", // The Content-Type provided by the upstream server
  "favicon_hash": "708578229", // Favicon hash for Shodan searching
  "md5": "f3418a443e7d841097c714d69ec4bcb8", // MD5 hash of the favicon for Censys / VirusTotal hunting
  "sha256": "6da5620880159634213e197fafca1dde0272153be3e4590818533fab8d040770", // SHA256 of the favicon
  "debug_detect_method": [ // Debugging field for tracing the steps taken to retrieve a favicon
    "redirect"
  ]
}
```
## Get favicon hash of local file

Get the favicon hash from a file through POST request. The response is the favicon hash, MD5, and SHA256 of the submitted file:

```bash
# Post a local favicon.ico to the worker to calculate its hashes
curl --data-binary @favicon.ico https://favicon-hash.kmsec.uk/file/
```

Once you have the favicon hash, you can search Shodan using the search filter `http.favicon.hash:<hash>`

## Generating a favicon hash locally

[favicon-hash.kmsec.uk](https://favicon-hash.kmsec.uk) processes all events and data at the Cloudflare Edge. There are instances where you may want to simply generate a hash locally. **Many guides on the internet for generating favicon hashes for Shodan hunting are wrong!** 

Here's a Python script you can use to generate a Shodan favicon hash locally. Many guides omit adding newlines (`\n`) to the Base64 favicon, causing an incorrect hash digest for hunting.

```python
import base64
import re
import mmh3 # (pip install mmh3)


with open('favicon.ico', 'rb') as favicon:
    # 1. To base64
    b64 = base64.b64encode(favicon.read())
    # 2. To string
    utf8_b64 = b64.decode('utf-8')
    # 3. !Required to match Shodan! Insert newlines (\n) every 76 characters, and also at the end
    with_newlines = re.sub("(.{76}|$)", "\\1\n", utf8_b64, 0, re.DOTALL)
    # 4. MMH3 hash
    hash = mmh3.hash(with_newlines)
    
    print(hash)
```