# Notion proxy

> [!WARNING]  
> Notion launches [functionality to publish Notion site on custom domain](https://www.notion.so/ja-jp/help/connect-a-custom-domain-with-notion-sites). So this repository has been stopped for maintenance.

Deliver notion pages via your domain. Reference [fruitionsite](https://github.com/stephenou/fruitionsite) for rewrite html processing.  This proxy does not depend on Cloudflare and launches on express server.

## Node Version

`<20.5.1`

If using version 21.x or above, it will generate a deprecation warning indicating the use of the
deprecated punycode module.

## Environment variable

(※) is required.

| ProxyConfig        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Default                            |
|--------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------|
| PROXY_PORT (※)     | Proxy port number                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | "3456"                             |
| DOMAIN (※)         | Proxy domain (*Your domain*) for rewrite                                                                                                                                                                                                                                                                                                                                                                                                                                                 | "localhost:3456"                   |
| IS_TLS (※)         | Proxy tls(http/https) for rewrite                                                                                                                                                                                                                                                                                                                                                                                                                                                        | "false"                            |
| NOTION_PAGE_ID (※) | Notion public page id                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | "f1db0cfbe246475784c67f279289abea" |
| CUSTOM_SCRIPT      | Custom script                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | ""                                 |
| CONTENT_CACHE_SEC  | Cache time for loaded content (sec)                                                                                                                                                                                                                                                                                                                                                                                                                                                      | "300"                              |
| GOOGLE_FONT        | See: https://developers.google.com/fonts                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ""                                 |
| AUTO_SET_OG_TAG    | The server automatically extracts Open Graph Protocol (OGP) data from your NotionId upon startup. <br/>When this feature is enabled, the values of `OG_TAG_TITLE` and `OG_TAG_IMAGE_URL` and `ICON_URL` are utilized for automatic configuration.<br/>If you prefer to wait until the OGP tags are fetched automatically, you can use the `/readyz` endpoint.<br/><br/><b>Requirements</b><br/>- Headless chrome<br/>- CPU is always allocated<br/>- At least 512MB of memory for better | "false"                            |
| OG_TAG_TITLE       | Title for rewrite og:site_name, og:title, twitter:title tag.<br/>If you use default value, there is no data to rewrite, so the data from when it back post to Notion will be used.                                                                                                                                                                                                                                                                                                       | ""                                 |
| OG_TAG_DESC        | Description for rewrite description, og:description, twitter:description tag.<br/>If you use default value, there is no data to rewrite, so the data from when it back post to Notion will be used.                                                                                                                                                                                                                                                                                      | ""                                 |
| OG_TAG_IMAGE_URL   | Image url for rewrite og:image, twitter:image tag.<br/>If you use default value, there is no data to rewrite, so the data from when it back post to Notion will be used.                                                                                                                                                                                                                                                                                                                 | ""                                 |
| OG_TAG_TYPE        | Type for rewrite og:type tag.                                                                                                                                                                                                                                                                                                                                                                                                                                                            | "website"                          |
| ICON_URL           | Icon url for rewrite favicon.<br/>If you use default value, there is no data to rewrite, so the data from when it back post to Notion will be used.                                                                                                                                                                                                                                                                                                                                      | ""                                 |                                   |
| TWITTER_CARD       | Twitter card for rewrite twitter:card tag.                                                                                                                                                                                                                                                                                                                                                                                                                                               | "summary_large_image"              |

### Note for AUTO_SET_OG_TAG variable

**OgTag setting priority**

Environment variables with OG_xxx in prefix are set with the highest priority.   
So, if AUTO_SET_OG_TAG is enabled but the OG_xxx environment variable is set, OG_xxx will have
priority.

**Headless chrome Requirements**

At startup, we are extracting og tags from the NotionId page using Chrome Headless.  
So, CPU allocation is necessary. Please be cautious when using request allocation in services like
Cloud Functions or Cloud Run or Other.

## Getting started

Start proxy for debug on local.

```bash
npm ci
npm test
npm run start_proxy

> notion-proxy@1.0.0 start
> node src/index.js

Listening at localhost:3456 by NotionProxy. NotionId: f1db0cfbe246475784c67f279289abea
```

Start proxy binary.

```bash
npm install -g pkg
npm run build
./notion-proxy

Listening at localhost:3456 by NotionProxy. NotionId: f1db0cfbe246475784c67f279289abea
```

Start proxy with AUTO_SET_OG_TAG for debug.

```bash
export AUTO_SET_OG_TAG='true';  npm run start_proxy

> notion-proxy@1.0.0 start
> node src/index.js

Successful automatic fetched of OGP tag. Title: Re:Earth Documentation, Image: http://localhost:3456/image/ht..., Icon: http://localhost:3456/image/ht...
Listening at localhost:3456 by NotionProxy. NotionId: f1db0cfbe246475784c67f279289abea
```


## Proxy example with your domain 

```bash
export DOMAIN="CHANGE IT" && \
export NOTION_PAGE_ID="CHANGE IT" && \
export IS_TLS="true" && \
export AUTO_SET_OG_TAG="true" && \
npm run start_proxy
```

## How to contribute

1. Fork or clone the project
2. Create your feature branch and Commit your changes
3. Push to the branch
4. Open a new pull request

[MIT License](LICENSE)
