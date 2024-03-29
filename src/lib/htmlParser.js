const {JSDOM} = require("jsdom");

class HtmlParser {

  /**
   * Constructor.
   *
   * @param pageTitle ProxyConfig.ogTag.title
   * @param pageDesc ProxyConfig.ogTag.desc
   * @param pageImage ProxyConfig.ogTag.image
   * @param pageUrl ProxyConfig.ogTag.url
   * @param pageType ProxyConfig.ogTag.pageType
   * @param twitterCard ProxyConfig.twitterTag.twitterCard
   * @param googleFont ProxyConfig.googleFont
   * @param domain ProxyConfig.domain
   * @param customScript ProxyConfig.customScript
   * @param isTls ProxyConfig.isTls
   * @param stp slug to page record
   */
  constructor(pageTitle, pageDesc, pageImage, pageUrl, pageType, twitterCard, googleFont, domain, customScript, isTls, stp) {
    this.pageTitle = pageTitle;
    this.pageDescription = pageDesc;
    this.pageImage = pageImage;
    this.pageUrl = pageUrl;
    this.pageType = pageType;
    this.twitterCard = twitterCard;
    this.googleFont = googleFont;
    this.domain = domain;
    this.customScript = customScript;
    this.isTls = isTls;
    this.slugToPage = stp;
  }

  parseMetaImageWithoutDom(htmlStr) {
    if (this.pageImage !== '') {
      htmlStr = htmlStr.replace(/(<meta property="og:image" content=")([^"]*)("[^>]*>)/g, `$1${this.pageImage}$3`);
      htmlStr = htmlStr.replace(/(<meta name="twitter:image" content=")([^"]*)("[^>]*>)/g, `$1${this.pageImage}$3`);
    }
    return htmlStr;
  }

  parseMeta(element) {
    try {
      if (this.pageTitle !== '') {
        if (element.getAttribute('property') === 'og:title' || element.getAttribute('name') === 'twitter:title') {
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
    const observer = new MutationObserver(function() {
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

    let parsedHtmlStr = dom.serialize();
    parsedHtmlStr = this.parseMetaImageWithoutDom(parsedHtmlStr);
    return parsedHtmlStr;
  }
}

module.exports = HtmlParser;
