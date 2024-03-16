class Env {
  constructor() {
    this.pageTitle = process.env.PAGE_TITLE || '';
    this.pageDesc = process.env.PAGE_DESC || '';
    this.googleFont = process.env.GOOGLE_FONT || '';
    this.proxyPort = process.env.PROXY_PORT || '3456';
    this.domain = process.env.DOMAIN || 'localhost:3456';
    this.isTls = process.env.IS_TLS || 'false';
    this.notionPageId = process.env.NOTION_PAGE_ID || 'f1db0cfbe246475784c67f279289abea';
    this.customScript = process.env.CUSTOM_SCRIPT || '';
    this.contentCacheSec = process.env.CONTENT_CACHE_SEC || '300';
    this.slugToPage = {
        "": this.notionPageId
    }

    if (isNaN(this.proxyPort)) {
      throw new Error("Invalid PROXY_PORT environment. Allow number");
    }
    if (isNaN(this.contentCacheSec)) {
      throw new Error("Invalid CONTENT_CACHE_SEC environment. Allow number");
    }
  }
}

module.exports = Env;
