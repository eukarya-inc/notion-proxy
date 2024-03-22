const HtmlParser = require("./htmlParser");
const slugToPage = {'': 'f1db0cfbe246475784c67f279289abea'}
const {JSDOM} = require("jsdom");

test('Parse html for Notion', () => {

  const title = 'Test Title';
  const desc = 'Test Desc';
  const googleFont = '';
  const domain = 'eukarya.io';
  const customScript = '<script>console.log("hello world custom script")</script>';
  const isTls = 'true';

  const parser = new HtmlParser(
      title,
      desc,
      googleFont,
      domain,
      customScript,
      isTls,
      slugToPage);

  const element = new JSDOM(
      `
<html class="notion-html">
<head lang="en">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,height=device-height,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <title>Notion – The all-in-one workspace for your notes, tasks, wikis, and databases.</title>
  <meta name="description" content="A new tool that blends your everyday work apps into one. It's the all-in-one workspace for you and your team">
</head>
<body>
  <p>Hello</p>
</body>
</html>`);

  parser.parse(element.window.document);

  expect(element.window.document.documentElement.outerHTML).toBe(
`<html class="notion-html"><head lang="en">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,height=device-height,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <title>Notion – The all-in-one workspace for your notes, tasks, wikis, and databases.</title>
  <meta name="description" content="Test Desc">
</head>
<body>
  <p>Hello</p>


    <script>
    window.CONFIG.domainBaseUrl = 'https://eukarya.io';
    const SLUG_TO_PAGE =  {"":"f1db0cfbe246475784c67f279289abea"};
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
      arguments[1] = arguments[1].replace('https://eukarya.io', 'www.notion.so');
      return open.apply(this, [].slice.call(arguments));
    };
    <!-- required for comments identification -->
    document.notionPageID = getPage();
  </script><script>console.log("hello world custom script")</script></body></html>`);
});