const Utility = require("../lib/utility");
const Redirect = require("../lib/redirect");
const HtmlParser = require("../lib/htmlParser");
const AutoOgpExtractor = require("../lib/autoOgpExtractor");
const ContentCache = require("./contentCache");
const mime = require("mime-types");
const {fetchUrl: fetch} = require("fetch");

class NotionProxy {

  /**
   * Constructor.
   *
   * @param config ProxyConfig class
   */
  constructor(config) {
    this.initialize(config);
  }

  /**
   * Init field variable.
   *
   * @param config ProxyConfig class
   * @param isReloadedVariable Reloaded variable for automatic set OGP
   */
  initialize(config, isReloadedVariable = false) {
    this.proxyConfig = config;
    this.cacheStore = new ContentCache(config.contentCacheSec);
    this.autoOgpExtractor = new AutoOgpExtractor(
        config.notionPageId,
        config.domain,
        config.isTls
    );
    this.htmlParser = new HtmlParser(
        config.ogTag.title,
        config.ogTag.desc,
        config.ogTag.image,
        config.ogTag.url,
        config.ogTag.type,
        config.twitterTag.card,
        config.googleFont,
        config.domain,
        config.customScript,
        config.isTls,
        config.slugToPage
    );

    if (config.autoSetOgp && isReloadedVariable) {
      this.readyz = true;
      this.livez = true;
    } else if (config.autoSetOgp && !isReloadedVariable) {
      this.readyz = false;
      this.livez = true;
    } else {
      this.readyz = true;
      this.livez = true;
    }
  }

  /**
   * Reload proxy config if AUTO_SET_OGP enabled.
   *
   * @returns {Promise<void>}
   */
  async reloadProxyConfig() {
    if (!this.proxyConfig.autoSetOgp) {
      return;
    }
    const html = await this.autoOgpExtractor.fetchHtmlAfterExecutedJs();
    const title = this.autoOgpExtractor.extractOgTitle(html);
    const image = this.autoOgpExtractor.extractOgImage(html);
    if (title !== null) {
      this.proxyConfig.ogTag.replaceTitle(title)
      this.proxyConfig.twitterTag.replaceTitle(title)
    }
    if (image !== null) {
      this.proxyConfig.ogTag.replaceImage(image)
      this.proxyConfig.twitterTag.replaceImage(image)
    }
    if (title === null && image === null) {
      console.log('[WARN] Failed to fetch OGP tag automatically');
    } else {
      console.log(`Successful automatic fetched of OGP tag. Title: ${title}, Image: ${image.substring(0, 30)}...`);
    }
    this.initialize(this.proxyConfig, true);
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
    return res.send(Utility.generateSitemap(this.proxyConfig.domain, this.proxyConfig.slugToPage))
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
   * GET readyz
   * When the automatic OGP tag extraction process is complete, the proxy will be set to Ready regardless of success or failure.
   * The extract process is dependent on the Chrome environment, so NotionProxy is set to Ready regardless.
   *
   * @param req Request of express
   * @param res Response of express
   * @returns {*}
   */
  getReadyZ(req, res) {
    if (!this.readyz) {
      return res.status(503).send('Not ready yet because server is extracting ogp tag automatically');
    }
    return res.status(200).send('OK');
  }

  /**
   * GET livez
   *
   * @param req Request of express
   * @param res Response of express
   * @returns {*}
   */
  getLiveZ(req, res) {
    return res.status(200).send('OK');
  }

  /**
   * GET *
   *
   * @param req Request of express
   * @param res Response of express
   * @returns {*|void}
   */
  async get(req, res) {
    let url;
    try {
      url = Utility.generateNotionUrl(req, this.proxyConfig.slugToPage);
    } catch (e) {
      if (e instanceof Redirect) {
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
    contentType = Utility.getMineTypeIfAwsUrl(req.originalUrl, contentType);
    res.set('Content-Type', contentType)
    res.removeHeader('Content-Security-Policy')
    res.removeHeader('X-Content-Security-Policy')

    const cachedData = await this.cacheStore.getData(req.originalUrl);
    if (cachedData !== null) {
      return res.send(cachedData);
    }

    if (Utility.isContent(req.originalUrl)) {
      // Set it to If-Modified-Since now to accommodate 304
      requestHeader['If-Modified-Since'] = new Date().toString();
    }

    return fetch(url, {
      headers: requestHeader,
      method: 'GET',
    }, (error, header, body) => {

      let newBody = body;

      // See https://github.com/stephenou/fruitionsite
      if (req.originalUrl.startsWith('/app') && req.originalUrl.endsWith('js')) {
        res.set('Content-Type', 'application/x-javascript')
        newBody = this.htmlParser.parseNotionUrl(newBody.toString());
      } else if (req.originalUrl.endsWith('css') || req.originalUrl.endsWith('js')) {
        newBody = newBody.toString()
      } else if (Utility.isContent(req.originalUrl)) {
        // Nothing
      } else if (header !== undefined) {
        newBody = this.htmlParser.parse(newBody.toString());
      }

      this.cacheStore.setData(req.originalUrl, newBody);
      return res.send(newBody);
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
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.set('Vary', 'Access-Control-Request-Headers');
    res.status(204).send();
  }
}

module.exports = NotionProxy;
