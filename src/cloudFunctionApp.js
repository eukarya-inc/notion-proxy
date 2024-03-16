const functions = require('@google-cloud/functions-framework');
const EnvConfig = require("./config/env");
const NotionProxy = require("./proxy/notionProxy");

let finishInitialize = false

/**
 * NOTE:
 * Currently Notion rendering is not as expected on local @google-cloud/functions-framework server
 * Please use expressApp.js
 */
functions.http('notion-proxy', (req, res) => {
  let proxy;

  // For automatic restart spot VM on GCP
  if (!finishInitialize) {
    const envConfig = new EnvConfig();
    const PAGE_TO_SLUG = {};
    Object.keys(envConfig.slugToPage).forEach(slug => {
      let page = envConfig.slugToPage[slug];
      PAGE_TO_SLUG[page] = slug;
    })

    proxy = new NotionProxy(envConfig);
    finishInitialize = true;
  }

  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET,POST,OPTION');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send();
    return;
  }

  if (req.path.startsWith('/sitemap.xml')) {
    return proxy.getSitemap(req, res);
  }
  if (req.path.startsWith('/robots.txt')) {
    return proxy.getSitemap(req, res);
  }
  if (req.method === "GET") {
    return proxy.get(req, res);
  }
  if (req.method === "POST") {
    return proxy.post(req, res);
  }
  res.status(204).send();
});
