const Utility = require("../lib/utility");
const HtmlParser = require("../lib/htmlParser");
const AutoOgpExtractor = require("../lib/autoOgpExtractor");
const ContentCache = require("./contentCache");
const {fetchUrl: fetch} = require("fetch");
const {isCrawlerRequest} = require("../lib/utility");

class Proxy {

  /**
   * Constructor.
   *
   * @param config ProxyConfig class
   */
  constructor(config) {
    let isReady = !config.autoSetOgTag;
    this.initVariable(config, isReady);
  }

  /**
   * Init field variable.
   *
   * @param config ProxyConfig class
   * @param isReady Whether automatic OGP extraction is successful or not
   */
  initVariable(config, isReady) {
    this.proxyConfig = config;
    this.cacheStore = new ContentCache(config.contentCacheSec);
    this.autoOgpExtractor = new AutoOgpExtractor(
        config.notionPageId,
        config.domain,
        config.isTls,
        config.proxyPort
    );
    this.htmlParser = new HtmlParser(
        config.ogTag.title,
        config.ogTag.desc,
        config.ogTag.image,
        config.ogTag.url,
        config.ogTag.type,
        config.twitterTag.card,
        config.iconUrl,
        config.googleFont,
        config.domain,
        config.customScript,
        config.isTls,
        config.slugToPage
    );

    this.readyz = isReady;
    this.livez = true;
  }

  /**
   * Reload proxy config if AUTO_SET_OGP enabled.
   * Failure safe processing
   *
   * @returns {Promise<void>}
   */
  async reloadProxyConfig() {
    if (!this.proxyConfig.autoSetOgTag) {
      return;
    }

    const html = await this.autoOgpExtractor.fetchHtmlAfterExecutedJs();
    const fetchedTitle = this.autoOgpExtractor.extractOgTitle(html);
    const fetchedImage = this.autoOgpExtractor.extractOgImage(html);
    const fetchedIcon = this.autoOgpExtractor.extractIcon(html);

    if (fetchedTitle !== null && this.proxyConfig.ogTag.title === '') {
      this.proxyConfig.ogTag.replaceTitle(fetchedTitle);
      this.proxyConfig.twitterTag.replaceTitle(fetchedTitle);
    }
    if (fetchedImage !== null && this.proxyConfig.ogTag.image === '') {
      this.proxyConfig.ogTag.replaceImage(fetchedImage);
      this.proxyConfig.twitterTag.replaceImage(fetchedImage);
    }
    if (fetchedIcon !== null && this.proxyConfig.iconUrl === '') {
      this.proxyConfig.replaceIconUrl(fetchedIcon);
    }

    let isReady;
    if (fetchedTitle === null && fetchedImage === null && fetchedIcon === null) {
      console.log('[WARN] Failed to fetch OGP tag automatically');
      isReady = false;
    } else {
      const imgMsg = this.proxyConfig.ogTag.image.length > 30 ?
          `${this.proxyConfig.ogTag.image.substring(0, 30)}...` : this.proxyConfig.ogTag.image;

      const iconMsg = this.proxyConfig.iconUrl.length > 30 ?
          `${this.proxyConfig.iconUrl.substring(0, 30)}...` : this.proxyConfig.iconUrl;

      console.log('Successful automatic fetched of OGP tag.' +
          ` Title: ${this.proxyConfig.ogTag.title},` +
          ` Image: ${imgMsg},` +
          ` Icon: ${iconMsg}` );
      isReady = true;
    }
    this.initVariable(this.proxyConfig, isReady);
  }

  /**
   * GET favicon.ico for web crawler and slack crawler
   *
   * @param req Request of express
   * @param res Response of express
   * @returns {*}
   */
  getFavicon(req, res) {
    if (this.proxyConfig.iconUrl !== '') {
      return res.redirect(301, this.proxyConfig.iconUrl);
    }
    this.get(req, res);
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
   * When the automatic OGP tag extraction process is successful, the proxy will be set to Ready.
   * If failure to fetch OGP tag, Server return 503.
   *
   * @param req Request of express
   * @param res Response of express
   * @returns {*}
   */
  getReadyZ(req, res) {
    if (!this.readyz) {
      return res.status(503).send('Not ready yet');
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
    const info = Utility.generateNotionUrl(req, this.proxyConfig.slugToPage);
    if (info.isRedirect) {
      return res.redirect(301, `/${info.url}`);
    }

    const requestHeader = req.headers
    const userAgent = requestHeader['user-agent']

    delete requestHeader['host']
    delete requestHeader['referer']

    const contentType = Utility.getContentType(req.originalUrl)
    res.headers = requestHeader
    res.set('Content-Type', contentType)
    res.removeHeader('Content-Security-Policy')
    res.removeHeader('X-Content-Security-Policy')

    // Read cache if requested from not bot and cache is not expired
    const cachedData = await this.cacheStore.getData(req.originalUrl);
    if (!isCrawlerRequest(userAgent) && cachedData !== null) {
      return res.send(cachedData);
    }

    // Set it to If-Modified-Since now to accommodate 304
    if (Utility.isContent(req.originalUrl)) {
      requestHeader['If-Modified-Since'] = new Date().toString();
    }

    return fetch(info.url, {
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

      if (!isCrawlerRequest(userAgent)) {
        this.cacheStore.setData(req.originalUrl, newBody);
      }
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

module.exports = Proxy;
