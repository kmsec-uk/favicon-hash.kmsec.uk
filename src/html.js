export default `<!DOCTYPE html>
<html lang="en">
<head>
    <title>Favicon hash generator</title>
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="canonical"
        href="https://favicon-hash.kmsec.uk" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
    <link rel="stylesheet"
      href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.min.css">
    <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0, minimum-scale=1.0">
    <meta property="og:type" content="website" />
    <meta property="og:url"
        content="https://favicon-hash.kmsec.uk" />
    <meta property="og:site_name" content="Favicon hash" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:domain" content="favicon-hash.kmsec.uk" />
    <meta name="twitter:title" property="og:title" itemprop="name"
        content="Get the favicon hash of a website for Shodan hunting" />
    <meta name="twitter:description" property="og:description" itemprop="description"
        content="Get the favicon hash of a website's favicon for Shodan hunting" />
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
    .secondary {
      margin: 5px 0px 5px 0px;
    }

	</style>
</head>

<body>
<main class="container">
<h1>Favicon hash generator</h1>
<hr>
<p>Get the favicon hash of a website's favicon for Shodan hunting</p>
<div class="grid">
<article>
<h4>Retrieve from URL</h4>
<form id="by_url" onsubmit="return submit_url(this)">

  <label for="url">Favicon URL</label>
  <input type="url" id="url" name="url" placeholder="https://www.google.com/favicon.ico" onfocus="updateContents()" required>
  <small>Please provide the full URI path to the favicon</small>
  <button value="url" type="submit">Hash from URL</button>
</form>
  <div id="output"></div>

</article>
<article>
<h4>Upload file</h4>

<form id="by_file" onsubmit="return submit_file(this)">
<label for="file">File browser
  <input type="file" id="file" name="file">
</label>
<button type="submit">Hash from file</button>
<div id="output_file"></div>


</article>
</div>
<article>
<header><h4>Use this site programmatically</h4></header>
<p>Retrieve the favicon hash from a URL:<p>

<code>curl https://favicon-hash.kmsec.uk/api/?url=https://www.google.com/favicon.ico | jq</code>

<p>The response JSON contains the location, content-type, favicon hash, md5, and sha256 of the requested resource.</p> 

<pre><code class="language-json">{
  "req_url": "https://google.com/favicon.ico",
  "req_location": "https://www.google.com/favicon.ico",
  "req_content_type": "image/x-icon",
  "favicon_hash": "708578229",
  "md5": "f3418a443e7d841097c714d69ec4bcb8",
  "sha256": "6da5620880159634213e197fafca1dde0272153be3e4590818533fab8d040770"
}</code></pre>
<p><code>req_url</code> and <code>req_location</code> are the 
user-provided URL (contained in the url parameter), and the location the application was redirected to; respectively. Note the above example indicates a redirect from google.com to www.google.com. 
 <code>req_content_type</code> (Content-Type as received by the application when requesting the resource) is exposed for visibility and troubleshooting.</p>

<p>The URL that you want to retrieve the hash for can be URL-encoded to ensure more reliable execution:<p>
<code>curl https://favicon-hash.kmsec.uk/api/?url=https%3A%2F%2Fwww%2Egoogle%2Ecom%2Ffavicon%2Eico</code>

<p>Get the favicon hash from a local file through POST request. The response is a JSON object containing the md5, sha256, and favicon hashes:<p>
<pre><code class="language-bash"># Download a favicon file
wget -O favicon.ico https://example.com/favicon-file-you-want.ico

# POST it to the /file endpoint to get the favicon hash
curl --data-binary @favicon.ico https://favicon-hash.kmsec.uk/file/</code></pre>
<p>The response:</p>
<pre><code>{
  "favicon_hash": "-451606383",
  "md5": "b8f9b8401503b442e22369f9908939b7",
  "sha256": "f0623f69f6f12bf3076d3a1f07c647bb9839a0b9769ea5330e6093fb69c392d7"
}</code></pre>

</article>

<!--footer-->
<article>
  <header><h4>Generating favicon hashes</h4></header>
  <p>"Favicon hashes" are actually MurmurHash3 hashes. Shodan doesn't hash the raw file, but a modified base64-encoded version. See the below code snippet for details.</p>
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
    
    print(hash)</code></pre>
  </article>
  <article>
  <header><h4>About this site</h4></header>
  <p>This site processes requests at the Cloudflare Edge using Cloudflare Workers. When you request a favicon 
  hash from URL, your browser does not make the request to the resource. Instead, the Worker retrieves the requested resource.</p>
  <p>Because this is built with Cloudflare Workers and uses the <code>Fetch</code> Javascript API:</p>
  <ul>
    <li>Only domains will work</li>
    <li>Only valid certificates will be accepted for HTTPS requests</li>
    <li>Only default ports will work (80 and 443 for HTTP and HTTPS, respectively). This is a <a href="https://github.com/cloudflare/workers-sdk/issues/1320">known bug with Cloudflare Workers</a></li>
  </ul>
  <p>Some sites forbid access from Cloudflare's edge so you may get an error. In these cases, you can download the favicon through other means and then use the hash from file functionality.</p>
  <p>The Murmurhash3 x86 32-bit algorithm used by this site is taken from the <a href="https://github.com/karanlyons/murmurHash3.js">MurmurHash3 package</a>, but is modified to return a signed integer, as is used in Shodan.</p>
  <footer>
  <sub>
    <a href="https://kmsec.uk">kmsec.uk</a> - source on <a href="https://github.com/kmsec-uk/favicon-hash.kmsec.uk">Github</a><br>
	  Styled with <a href="https://picocss.com/">PicoCSS</a> and <a href="https://highlightjs.org/">highlight.js</a><br>
    Built with <a href="https://workers.cloudflare.com/">Cloudflare Workers</a>
	</sub>
  </footer>
</article>
</main>
</body>
<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
<script>hljs.highlightAll();</script>
<script>
var shodan_query_uri = "https://www.shodan.io/search?query=http.favicon.hash%3A"
var vt_query_uri = "https://www.virustotal.com/gui/search/entity:url%20main_icon_md5:"
var censys_query_uri = "https://search.censys.io/search?resource=hosts&sort=RELEVANCE&per_page=25&virtual_hosts=EXCLUDE&q=services.http.response.favicons.md5_hash%3A"

function updateContents() {
    document.getElementById("url").setAttribute("value", "https://")
  }
function submit_url(form) {
    var formdata = new FormData(form)
    upstream_url = encodeURIComponent(formdata.get("url"))
    
    api_url = "api/" + "?url=" + upstream_url
    console.log(\`API request URL = \${window.location.href + api_url}\`)
    fetch(api_url)
    .then(response => response.json())
    .then(data => {
        const favicon_hash = data.favicon_hash
        const output_div = document.getElementById('output');
        var exposedUIelements = ["req_location","favicon_hash","md5"];
        let tableHTML = \`<ins>Result for \${formdata.get("url")}:</ins><br><table role="grid">\`;
        for (const key in data) {
            if (exposedUIelements.indexOf(key) > -1)
            tableHTML += \`<tr><td>\${key}</td><td><kbd>\${data[key]}</kbd></td></tr>\`;
        }
        tableHTML += \`</table>
          <div class="grid">
            <div><a role="button" class="secondary" href="\${shodan_query_uri + data.favicon_hash}"><strong>Search Shodan</strong></a></div>
            <div><a role="button" class="secondary" href="\${vt_query_uri + data.md5}"><strong>Search VirusTotal</strong></a></div>
            <div><a role="button" class="secondary" href="\${censys_query_uri + data.md5}"><strong>Search Censys</strong></a></div>
          </div>
          <hr>
          <details>
            <summary>View raw API data</summary>
              <pre><code>\${JSON.stringify(data, null, 2)}</code></pre>
          </details>\`
        output_div.innerHTML = tableHTML;
        output_div.style.visibility = 'visible';
        })
    return false;
}

function submit_file(form) {
    var formdata = new FormData(form)
    file_data = formdata.get("file")
    file_endpoint = "/file/"
    fetch(file_endpoint, {
        method: "POST",
        body: file_data
    })
        .then(response => response.json())
        .then(data => {
            const output_div = document.getElementById('output_file')
            var exposedUIelements = ["favicon_hash","md5"];
            let tableHTML = \`<ins>Result for file:</ins><br><table role="grid">\`;
            for (const key in data) {
              if (exposedUIelements.indexOf(key) > -1)
              tableHTML += \`<tr><td>\${key}</td><td><kbd>\${data[key]}</kbd></td></tr>\`;
          }
          tableHTML += \`</table>
            <div class="grid">
              <div><a role="button" class="secondary" href="\${shodan_query_uri + data.favicon_hash}"><strong>Search Shodan</strong></a></div>
              <div><a role="button" class="secondary" href="\${vt_query_uri + data.md5}"><strong>Search VirusTotal</strong></a></div>
              <div><a role="button" class="secondary" href="\${censys_query_uri + data.md5}"><strong>Search Censys</strong></a></div>
            </div>
            <hr>
            <details>
              <summary>View raw API data</summary>
                <pre><code>\${JSON.stringify(data, null, 2)}</code></pre>
            </details>\`
          output_div.innerHTML = tableHTML;
          output_div.style.visibility = 'visible';
          })
    return false;
}
</script>
</html>`