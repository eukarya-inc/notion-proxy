const utility = require("../lib/utility");
const Redirect = require("../lib/redirect");
const HtmlParser = require("../lib/htmlParser");
const ContentCache = require("./contentCache");
const mime = require("mime-types");
const {fetchUrl: fetch} = require("fetch");
const {JSDOM} = require("jsdom");

class NotionProxy {

  /**
   * Constructor.
   *
   * @param env Env class
   */
  constructor(env) {
    this.DOMAIN = env.domain;
    this.SLUG_TO_PAGE = env.slugToPage;
    this.PERMA_TO_PAGE = {};
    this.CACHE_STORE = new ContentCache(env.contentCacheSec);
    this.PARSER = new HtmlParser(
        env.pageTitle,
        env.pageDesc,
        env.googleFont,
        env.domain,
        env.customScript,
        env.isTls,
        this.SLUG_TO_PAGE);
  }

  /**
   * GET sitemap.xml
   *
   * @param req Request of express
   * @param res Response of express
   * @returns {*}
   */
  getSitemap(req, res) {
    res.set('Content-Type', 'application/xml; charset=utf-8')
    return res.send(utility.generateSitemap(this.DOMAIN, this.SLUG_TO_PAGE))
  }

  /**
   * GET robots.txt
   *
   * @param req Request of express
   * @param res Response of express
   * @returns {*}
   */
  getRobotsTxt(req, res) {
    const body = 'user-agent: *\nallow: *';
    res.set('Content-Type', 'text/plain')
    return res.send(body)
  }

  /**
   * GET *
   *
   * @param req Request of express
   * @param res Response of express
   * @returns {*|void}
   */
  get(req, res) {
    let url;
    try {
      url = utility.generateNotionUrl(req, res, this.PERMA_TO_PAGE, this.SLUG_TO_PAGE);
      // console.log('[DEBUG] PROXY_TO    ' + url)
    } catch (e) {
      if (e instanceof Redirect) {
        // console.log('[DEBUG] REDIRECT_TO ' + e.message);
        return res.redirect(301, '/' + e.message);
      } else {
        console.error(e)
        res.status(500).send(e);
        return;
      }
    }

    const requestHeader = req.headers
    delete requestHeader['host']
    delete requestHeader['referer']
    res.headers = requestHeader

    let contentType = mime.lookup(req.originalUrl)
    if (!contentType) {
      contentType = 'text/html'
    }
    contentType = utility.getMineType(req.originalUrl, contentType);
    res.set('Content-Type', contentType)
    res.removeHeader('Content-Security-Policy')
    res.removeHeader('X-Content-Security-Policy')

    const cachedData = this.CACHE_STORE.getData(req.originalUrl);
    if (cachedData !== null) {
      return res.send(cachedData);
    }

    if (utility.isContent(req.originalUrl)) {
      // Set it to If-Modified-Since now to accommodate 304
      requestHeader['If-Modified-Since'] = new Date().toString();
    }

    return fetch(url, {
      headers: requestHeader,
      method: 'GET',
    }, (error, header, body) => {

      // See https://github.com/stephenou/fruitionsite
      if (req.originalUrl.startsWith('/app') && req.originalUrl.endsWith('js')) {
        res.set('Content-Type', 'application/x-javascript')
        body = body.toString().replace(/www.notion.so/g, this.DOMAIN).replace(/notion.so/g, this.DOMAIN)
      } else if (req.originalUrl.endsWith('css') || req.originalUrl.endsWith('js')) {
        body = body.toString()
      } else if (utility.isContent(req.originalUrl)) {
        // Nothing
      } else if (header !== undefined) {
        const dom = new JSDOM(body.toString(), { includeNodeLocations: true })
        this.PARSER.parse(dom.window.document);
        body = dom.serialize();
      }

      this.CACHE_STORE.setData(req.originalUrl, body);
      return res.send(body);
    })
  }

  /**
   * POST *
   *
   * @param req Request of express
   * @param res Response of express
   */
  post(req, res) {
    const url = 'https://notion.so' + req.originalUrl

    // See https://github.com/stephenou/fruitionsite
    const requestBody = req.originalUrl.startsWith('/api/v3/getPublicPageData') ? null : req.body.toString();

    if (req.originalUrl.startsWith('/api')) {
      fetch(url, {
        payload: requestBody,
        headers: {
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36'
        },
        method: 'POST',
      },(error, header, body) => {
        let resBody = "";
        if (body !== undefined) {
          resBody = body.toString()
        }
        return res.send(resBody);
      })
    }
  }

  /**
   * OPTIONS
   *
   * @param req Request of express
   * @param res Response of express
   */
  options(req, res) {
    res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send();
  }
}

module.exports = NotionProxy;
