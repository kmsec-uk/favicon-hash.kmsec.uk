export default `<!DOCTYPE html>
<html lang="en">
<head>
    <title>View the IP, headers, and geolocation of your browser request</title>
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="canonical"
        href="https://faviconhash.kmsec.uk" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
    <link rel="stylesheet"
      href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.min.css">
    <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0, minimum-scale=1.0">
    <meta property="og:type" content="website" />
    <meta property="og:url"
        content="https://faviconhash.kmsec.uk" />
    <meta property="og:site_name" content="Favicon hash" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:domain" content="faviconhash.kmsec.uk" />
    <meta name="twitter:title" property="og:title" itemprop="name"
        content="Get the favicon hash of a website for Shodan hunting" />
    <meta name="twitter:description" property="og:description" itemprop="description"
        content="Get the favicon hash of a website for Shodan hunting" />
	<style>
		body {
			padding: 20px;
		}
		kbd {
			word-break: break-all
		}
        h4 {
            margin: 0px
        }

	</style>
</head>

<body>
<main class="container">
<h1>Favicon hash generator</h1>
<hr>
<p>Get the favicon hash of a website for Shodan hunting</p>
<article>
<form id="by_url" onsubmit="return submit_url(this)">

  <label for="url">Favicon URL</label>
  <input type="url" id="url" name="url" placeholder="https://kmsec.uk/favicon.ico" onfocus="updateContents()" required>
  <small>Only domains are supported. If HTTPS is used, the upstream must have a valid certificate</small>
  <button value="url" type="submit">Hash from URL</button>
  </form>
  <div id="output"><div id="outputinner"></div></div>

</article>
<!--footer-->
<article>
  <header><h4>Generating favicon hashes</h4></header>
  <p>"Favicon hashes" are actually MurmurHash3 hashes. Shodan doesn't hash the raw file, but a modified base64-encoded version.</p>
  <p>The Murmurhash3 x86 32-bit algorithm used by this site is taken from the <a href="https://github.com/karanlyons/murmurHash3.js">MurmurHash3 package</a>, but is modified to return a signed integer, as is used in Shodan.</p>
  <p>Because this is built with Cloudflare Workers and uses the <code>Fetch</code> Javascript API on the Cloudflare Edge, Only domains will work (and only valid certificates will be accepted for HTTPS requests).
  <p>Some sites will also forbid access from Cloudflare cloud so you may get an error</p>
  <p>This is some Python3 code you can use if you would rather generate a favicon hash locally:</p>
  <pre><code class="language-python">
import base64
import re
import mmh3 # (pip install mmh3)


with open('favicon.ico', 'rb') as favicon:
    # 1. To base64
    b64 = base64.b64encode(favicon.read())
    # 2. To string
    utf8_b64 = b64.decode('utf-8')
    # 3. !Required to match Shodan! Insert newlines (\\n) every 76 characters, and also at the end 
    with_newlines = re.sub("(.{76}|$)", "\\\\1\\n", utf8_b64, 0, re.DOTALL)
    # 4. MMH3 hash
    hash = mmh3.hash(with_newlines)
    
    print(hash)
  </code>
  </pre>
  <footer>
  	<sub><a href="https://kmsec.uk">kmsec.uk</a> - source on <a href="https://github.com/kmsec-uk/">Github</a><br>
	Styled with <a href="https://picocss.com/">PicoCSS</a><br>
    Built with <a href="https://workers.cloudflare.com/">Cloudflare Workers</a>
	</sub>
  </footer>
</article>
</main>
</body>
<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
<script>hljs.highlightAll();</script>
<script>
function updateContents() {
    document.getElementById("url").setAttribute("value", "https://")
  }
function submit_url(form) {
    var formdata = new FormData(form)
    upstream_url = encodeURIComponent(formdata.get("url"))
    
    api_url = "api/" + "?url=" + upstream_url
    console.log(\`API request URL = \${window.location.href + api_url}\`)
    fetch(api_url)
        .then(response => response.text())
        .then(hash => {
            console.log(hash)
            const output_div = document.getElementById('output')
            output_div.innerHTML = \`<ins>result for \${formdata.get("url")}:</ins><br>\${hash}\`
            output_div.style.visibility='visible'

        }) 
    return false;
}
</script>
</html>`