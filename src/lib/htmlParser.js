const {JSDOM} = require("jsdom");
const {getMineTypeIfAwsUrl} = require("./utility");

class HtmlParser {

  /**
   * Constructor.
   *
   * @param pageTitle ProxyConfig.ogTag.title
   * @param pageDesc ProxyConfig.ogTag.desc
   * @param pageImageUrl ProxyConfig.ogTag.image
   * @param pageUrl ProxyConfig.ogTag.url
   * @param pageType ProxyConfig.ogTag.pageType
   * @param twitterCard ProxyConfig.twitterTag.twitterCard
   * @param iconUrl ProxyConfig.iconUrl
   * @param googleFont ProxyConfig.googleFont
   * @param domain ProxyConfig.domain
   * @param customScript ProxyConfig.customScript
   * @param isTls ProxyConfig.isTls
   * @param stp slug to page record
   */
  constructor(pageTitle, pageDesc, pageImageUrl, pageUrl, pageType, twitterCard, iconUrl, googleFont, domain, customScript, isTls, stp) {
    this.pageTitle = pageTitle;
    this.pageDescription = pageDesc;
    this.pageImageUrl = pageImageUrl;
    this.pageUrl = pageUrl;
    this.pageType = pageType;
    this.iconUrl = iconUrl;
    this.twitterCard = twitterCard;
    this.googleFont = googleFont;
    this.domain = domain;
    this.customScript = customScript;
    this.isTls = isTls;
    this.slugToPage = stp;
  }

  // Note
  // Replace og:image data without dom because set original image url.
  // If you are using DOM, the url is escaped.
  replaceMetaImageWithoutDom(htmlStr) {
    if (this.pageImageUrl !== '') {
      htmlStr = htmlStr.replace(/(<meta property="og:image" content=")([^"]*)("[^>]*>)/g, `$1${this.pageImageUrl}$3`);
      htmlStr = htmlStr.replace(/(<meta name="twitter:image" content=")([^"]*)("[^>]*>)/g, `$1${this.pageImageUrl}$3`);
    }
    return htmlStr;
  }

  // Note
  // Replace icon data without dom because set original icon url.
  // If you are using DOM, the url is escaped.
  replaceLinkIconWithoutDom(htmlStr) {
    if (this.iconUrl !== '') {
      const notionDefaultType = "image/x-icon";
      const convertedType = getMineTypeIfAwsUrl(this.iconUrl, notionDefaultType);

      // Replace href on icon if exist
      const hrefRegexForIcon = new RegExp(`(<link rel="icon" type="image/png" href=")([^"]*)("[^>]*>)`, "g");
      const typeRegexForIcon = new RegExp(`(<link rel="icon" type=")([^"]*)("[^>]*>)`, "g");
      htmlStr = htmlStr.replace(hrefRegexForIcon, `$1${this.iconUrl}$3`);
      htmlStr = htmlStr.replace(typeRegexForIcon, `$1${convertedType}$3`);

      // Replace href on apple-touch-icon if exist
      htmlStr = htmlStr.replace(/(<link rel="apple-touch-icon" href=")([^"]*)("[^>]*>)/g, `$1${this.iconUrl}$3`);
    }
    return htmlStr;
  }

  // Note
  // Insert icon tag before shortcut icon tag if this.iconUrl is existed
  // Also, Remove shortcut icon tag for notion rendering
  // It seems that Notion's JavaScript monitors shortcut icon tag. And render the notion icon
  parseShortCutIcon(document) {
    const shortcutElement = document.querySelector('link[rel="shortcut icon"]');
    if (shortcutElement && this.iconUrl !== '') {
      const newElement = document.createElement('link');
      newElement.setAttribute('rel', 'icon');
      newElement.setAttribute('type', 'image/png');
      newElement.setAttribute('href', this.iconUrl);
      shortcutElement.parentNode.insertBefore(newElement, shortcutElement.nextSibling);

      shortcutElement.remove();
    }
  }

  parseMeta(element) {
    try {
      if (this.pageTitle !== '') {
        if (element.getAttribute('property') === 'og:title' || element.getAttribute('name') === 'twitter:title' || element.getAttribute('property') === 'og:site_name') {
          element.setAttribute('content', this.pageTitle);
        }
      }
      if (this.pageDescription !== '') {
        if (element.getAttribute('name') === 'description' || element.getAttribute('property') === 'og:description' || element.getAttribute('name') === 'twitter:description') {
          element.setAttribute('content', this.pageDescription);
        }
      }
      if (this.pageUrl !== '') {
        if (element.getAttribute('property') === 'og:url' || element.getAttribute('name') === 'twitter:url') {
          element.setAttribute('content', this.pageUrl);
        }
      }
      if (this.pageType !== '') {
        if (element.getAttribute('property') === 'og:type') {
          element.setAttribute('content', this.pageType);
        }
      }
      if (this.domain !== '') {
        if (element.getAttribute('property') === 'twitter:domain') {
          element.setAttribute('content', this.domain);
        }
      }
      if (this.twitterCard !== '') {
        if (element.getAttribute('property') === 'twitter:card') {
          element.setAttribute('content', this.twitterCard);
        }
      }
      if (element.getAttribute('name') === 'apple-itunes-app') {
        element.remove();
      }
    } catch (e) {
      console.log(e)
    }
  }

  parseHead(element) {
    if (this.googleFont !== '') {
      element.innerHTML += `<link href="https://fonts.googleapis.com/css?family=
      ${this.googleFont.replace(' ', '+')}:
      Regular,Bold,Italic&display=swap" rel="stylesheet">
      <style>* { font-family: "${this.googleFont}" !important; }
      .notion-topbar { display: none; }
      .notion-selectable.notion-collection_view-block > div > div > div > a { display: none!important; }
      </style>`;
    }
  }

  parseBody(element) {
    const protocol = this.isTls ? 'https' : 'http';
    element.innerHTML += `
    <script>
    window.CONFIG.domainBaseUrl = '${protocol}://${this.domain}';
    const SLUG_TO_PAGE =  ${JSON.stringify(this.slugToPage)};
    const PAGE_TO_SLUG = {};
    const slugs = [];
    const pages = [];
    const el = document.createElement('div');
    let redirected = false;
    Object.keys(SLUG_TO_PAGE).forEach(slug => {
      const page = SLUG_TO_PAGE[slug];
      slugs.push(slug);
      pages.push(page);
      PAGE_TO_SLUG[page] = slug;
    });
    function getPage() {
      return location.pathname.slice(-32);
    }
    function getSlug() {
      return location.pathname.slice(1);
    }
    function updateSlug() {
      const slug = PAGE_TO_SLUG[getPage()];
      if (slug != null) {
        history.replaceState(history.state, '', '/' + slug);
      }
    }
    const observer = new MutationObserver(function(mutationsList) {
      if (redirected) {
        return;
      }
      const nav = document.querySelector('.notion-topbar');
      const mobileNav = document.querySelector('.notion-topbar-mobile');
      if (nav && nav.firstChild && nav.firstChild.firstChild || mobileNav && mobileNav.firstChild) {
        redirected = true;
        updateSlug();
        const onpopstate = window.onpopstate;
        window.onpopstate = function() {
          if (slugs.includes(getSlug())) {
            const page = SLUG_TO_PAGE[getSlug()];
            if (page) {
              history.replaceState(history.state, 'bypass', '/' + page);
            }
          }
          onpopstate.apply(this, [].slice.call(arguments));
          updateSlug();
        };
      }
    });
    observer.observe(document.querySelector('#notion-app'), {
      childList: true,
      subtree: true,
    });
    const replaceState = window.history.replaceState;
    window.history.replaceState = function(state) {
      if (arguments[1] !== 'bypass' && slugs.includes(getSlug())) {
        return;
      }
      return replaceState.apply(window.history, arguments);
    };
    const pushState = window.history.pushState;
    window.history.pushState = function(state) {
      const dest = new URL(location.protocol + location.host + arguments[2]);
      const id = dest.pathname.slice(-32);
      if (pages.includes(id)) {
        arguments[2] = '/' + PAGE_TO_SLUG[id];
      }
      return pushState.apply(window.history, arguments);
    };
    const open = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function() {
      arguments[1] = arguments[1].replace('${protocol}://${this.domain}', 'www.notion.so');
      return open.apply(this, [].slice.call(arguments));
    };
    <!-- required for comments identification -->
    document.notionPageID = getPage();
  </script>${this.customScript}`
  }

  parseNotionUrl(htmlStr) {
    return htmlStr.toString().replace(/www.notion.so/g, this.domain).replace(/notion.so/g, this.domain);
  }

  parse(responseBodyStr) {
    const dom = new JSDOM(responseBodyStr, { includeNodeLocations: true })
    const document = dom.window.document;
    let title = document.querySelector('title')
    if (title) {
      this.parseMeta(title)
    }

    let metas = document.querySelectorAll('meta')
    for (let m = 0; m < metas.length; m++) {
      this.parseMeta(metas[m])
    }

    let head = document.querySelector('head')
    if (head) {
      this.parseHead(head)
    }

    let tagBody = document.querySelector('body')
    if (tagBody) {
      this.parseBody(tagBody)
    }

    this.parseShortCutIcon(document);

    let parsedHtmlStr = dom.serialize();
    parsedHtmlStr = this.replaceMetaImageWithoutDom(parsedHtmlStr);
    parsedHtmlStr = this.replaceLinkIconWithoutDom(parsedHtmlStr);
    return parsedHtmlStr;
  }
}

module.exports = HtmlParser;
