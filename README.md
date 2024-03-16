## Notion proxy

Notion proxy for public page

### Node Version

18

### Environment variable

| Env               | Description                                                     | Default                          |
|-------------------|-----------------------------------------------------------------|----------------------------------|
| PAGE_TITLE        | Page title                                                      | ""                               |
| PAGE_DESC         | Page desc                                                       | ""                               |
| GOOGLE_FONT       | See: `https://developers.google.com/fonts/docs/getting_started` | ""                               |
| PROXY_PORT        | Proxy port number                                               | 3456                             |
| DOMAIN            | Proxy domain for rewrite                                        | localhost:3456                   |
| IS_TLS            | Proxy tls                                                       | false                            |
| NOTION_PAGE_ID    | Notion public page id                                           | f1db0cfbe246475784c67f279289abea |
| CUSTOM_SCRIPT     | Custom script                                                   | ""                               |
| CONTENT_CACHE_SEC | Cache time for loaded content (sec)                             | 300                              |

### Reference for rewrite html processing

Reference: https://github.com/stephenou/fruitionsite

### Getting started

Start proxy for debug on local.

```bash
$ npm ci
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