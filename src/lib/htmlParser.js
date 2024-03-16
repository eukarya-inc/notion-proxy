class HtmlParser {

  /**
   * Constructor.
   *
   * @param pageTitle Env.pageTitle
   * @param pageDesc Env.pageDesc
   * @param googleFont Env.googleFont
   * @param domain Env.domain
   * @param customScript Env.customScript
   * @param isTls Env.isTls
   * @param stp slug to page record
   */
  constructor(pageTitle, pageDesc,googleFont, domain, customScript, isTls, stp) {
    this.PAGE_TITLE = pageTitle;
    this.PAGE_DESCRIPTION = pageDesc;
    this.GOOGLE_FONT = googleFont;
    this.DOMAIN = domain;
    this.CUSTOM_SCRIPT = customScript;
    this.IS_TLS = isTls === 'true';
    this.SLUG_TO_PAGE = stp;
  }

  parseMeta(element) {
    try {
      if (this.PAGE_TITLE !== '') {
        if (element.getAttribute('property') === 'og:title' || element.getAttribute('name') === 'twitter:title') {
          element.setAttribute('content', this.PAGE_TITLE);
        }
      }
      if (this.PAGE_DESCRIPTION !== '') {
        if (element.getAttribute('name') === 'description' || element.getAttribute('property') === 'og:description' || element.getAttribute('name') === 'twitter:description') {
          element.setAttribute('content', this.PAGE_DESCRIPTION);
        }
      }
      if (element.getAttribute('property') === 'og:url' || element.getAttribute('name') === 'twitter:url') {
        element.setAttribute('content', this.DOMAIN);
      }
      if (element.getAttribute('name') === 'apple-itunes-app') {
        element.remove();
      }
    } catch (e) {
      console.log(e)
    }
  }

  parseHead(element) {
    if (this.GOOGLE_FONT !== '') {
      element.innerHTML += `<link href="https://fonts.googleapis.com/css?family=
      ${this.GOOGLE_FONT.replace(' ', '+')}:
      Regular,Bold,Italic&display=swap" rel="stylesheet">
      <style>* { font-family: "${this.GOOGLE_FONT}" !important; }
      .notion-topbar { display: none; }
      .notion-selectable.notion-collection_view-block > div > div > div > a { display: none!important; }
      </style>`;
    }
  }

  parseBody(element) {
    const protocol = this.IS_TLS ? 'https' : 'http';
    element.innerHTML += `
    <script>
    window.CONFIG.domainBaseUrl = '${protocol}://${this.DOMAIN}';
    const SLUG_TO_PAGE =  ${JSON.stringify(this.SLUG_TO_PAGE)};
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
      arguments[1] = arguments[1].replace('${protocol}://${this.DOMAIN}', 'www.notion.so');
      return open.apply(this, [].slice.call(arguments));
    };
    <!-- required for comments identification -->
    document.notionPageID = getPage();
  </script>${this.CUSTOM_SCRIPT}`
  }

  parse(document) {
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
  }
}

module.exports = HtmlParser;
