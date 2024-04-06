class ProxyConfig {
  constructor() {
    this.googleFont = process.env.GOOGLE_FONT || '';
    this.proxyPort = process.env.PROXY_PORT || '3456';
    this.domain = process.env.DOMAIN || `localhost:${this.proxyPort}`;
    this.isTls = process.env.IS_TLS || 'false';
    this.isTls = this.isTls === 'true';
    this.notionPageId = process.env.NOTION_PAGE_ID || 'f1db0cfbe246475784c67f279289abea';
    this.customScript = process.env.CUSTOM_SCRIPT || '';
    this.contentCacheSec = process.env.CONTENT_CACHE_SEC || '300';
    this.iconUrl = process.env.ICON_URL || '';
    this.autoSetOgTag = process.env.AUTO_SET_OG_TAG || 'false';
    this.autoSetOgTag = this.autoSetOgTag === 'true';
    this.slugToPage = {
      "": this.notionPageId
    }

    const protocol = this.isTls === 'true' ? 'https' : 'http';
    const url = `${protocol}://${this.domain}`;
    const twitterCard = process.env.TWITTER_CARD || 'summary_large_image';
    const pageTitle = process.env.OG_TAG_TITLE || '';
    const pageDesc = process.env.OG_TAG_DESC || '';
    const pageImageUrl = process.env.OG_TAG_IMAGE_URL || '';
    const pageType = process.env.OG_TAG_TYPE || 'website';

    this.twitterTag = new TwitterTag(
        pageTitle,
        pageDesc,
        twitterCard,
        this.domain,
        url,
        pageImageUrl
    );

    this.ogTag = new OgTag(
        pageTitle,
        pageDesc,
        url,
        pageType,
        pageImageUrl
    );

    if (this.domain === '') {
      throw new Error("Invalid DOMAIN environment. Please set your domain");
    }
    if (this.notionPageId === '') {
      throw new Error("Invalid NOTION_PAGE_ID environment. Please set notion id");
    }
    if (isNaN(this.proxyPort)) {
      throw new Error("Invalid PROXY_PORT environment. Allow number");
    }
    if (isNaN(this.contentCacheSec)) {
      throw new Error("Invalid CONTENT_CACHE_SEC environment. Allow number");
    }
  }

  replaceIconUrl(v) {
    this.iconUrl = v;
  }
}

class TwitterTag {
  constructor(title, desc, card, domain, url, image) {
    this.title = title;
    this.desc = desc;
    this.card = card;
    this.domain = domain;
    this.url = url;
    this.image = image;
  }

  replaceTitle(v) {
    this.title = v;
  }

  replaceDesc(v) {
    this.desc = v;
  }

  replaceImage(v) {
    this.image = v;
  }
}

class OgTag {
  constructor(title, desc, url, type, image) {
    this.title = title;
    this.desc = desc;
    this.url = url;
    this.type = type;
    this.image = image;
  }

  replaceTitle(v) {
    this.title = v;
  }

  replaceDesc(v) {
    this.desc = v;
  }

  replaceImage(v) {
    this.image = v;
  }
}

module.exports = ProxyConfig;
