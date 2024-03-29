## Notion proxy

Deliver notion pages via your domain.  
Reference [fruitionsite](https://github.com/stephenou/fruitionsite) for rewrite html processing.  
This proxy does not depend on Cloudflare and launches on express server.

### Node Version

`<20.5.1`

If using version 21.x or above, it will generate a deprecation warning indicating the use of the deprecated punycode module.

### Environment variable

| ProxyConfig       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Default                            |
|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------|
| PROXY_PORT        | Proxy port number                                                                                                                                                                                                                                                                                                                                                                                                                                                | "3456"                             |
| DOMAIN            | Proxy domain for rewrite                                                                                                                                                                                                                                                                                                                                                                                                                                         | "localhost:3456"                   |
| IS_TLS            | Proxy tls(http/https) for rewrite                                                                                                                                                                                                                                                                                                                                                                                                                                | "false"                            |
| NOTION_PAGE_ID    | Notion public page id                                                                                                                                                                                                                                                                                                                                                                                                                                            | "f1db0cfbe246475784c67f279289abea" |
| CUSTOM_SCRIPT     | Custom script                                                                                                                                                                                                                                                                                                                                                                                                                                                    | ""                                 |
| CONTENT_CACHE_SEC | Cache time for loaded content (sec)                                                                                                                                                                                                                                                                                                                                                                                                                              | "300"                              |
| GOOGLE_FONT       | See: `https://developers.google.com/fonts`                                                                                                                                                                                                                                                                                                                                                                                                                       | ""                                 |
| AUTO_SET_OGP      | The server automatically extracts Open Graph Protocol (OGP) data from your NotionId upon startup. <br/>When this feature is enabled, the values of `OG_TAG_TITLE` and `OG_TAG_IMAGE_URL` are utilized for automatic configuration.<br/>If you prefer to wait until the OGP tags are fetched automatically, you can use the `/readyz` command.<br/><br/>Requirement<br/>- Headless chrome<br/>- CPU is always allocated<br/>- At least 512MB of memory for better | "false"                            |
| OG_TAG_TITLE      | Title for og tag                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ""                                 |
| OG_TAG_DESC       | Description for og tag                                                                                                                                                                                                                                                                                                                                                                                                                                           | ""                                 |
| OG_TAG_IMAGE_URL  | Image url for og tag                                                                                                                                                                                                                                                                                                                                                                                                                                             | ""                                 |
| OG_TAG_TYPE       | Type for og tag                                                                                                                                                                                                                                                                                                                                                                                                                                                  | "website"                          |
| TWITTER_CARD      | Twitter card for og tag                                                                                                                                                                                                                                                                                                                                                                                                                                          | "summary_large_image"              |

### Getting started

Start proxy for debug on local.

```bash
$ npm ci
$ npm test
$ npm start_proxy
> notion-proxy@1.0.0 start
> node src/index.js
NotionProxy listening at localhost:3456, NotionId: f1db0cfbe246475784c67f279289abea
```

Start proxy binary.

```bash
$ npm install -g pkg
$ npm run build
$ ./notion-proxy
NotionProxy listening at localhost:3456, NotionId: f1db0cfbe246475784c67f279289abea
```