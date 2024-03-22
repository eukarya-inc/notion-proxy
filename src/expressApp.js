const EnvConfig = require("./config/env");
const NotionProxy = require("./proxy/notionProxy");
const compression = require('compression')
const express = require('express')

function main() {
  const envConfig = new EnvConfig();
  const proxy = new NotionProxy(envConfig);
  const app = express()
  app.use(compression())
  app.use(express.raw({ type: "application/json" }))

  app.get('/sitemap.xml', (req, res) => {
    return proxy.getSitemap(req, res);
  });
  app.get('/robots.txt', (req, res) => {
    return proxy.getRobotsTxt(req, res);
  });
  app.get('*', (req, res) => {
    return proxy.get(req, res);
  })
  app.post('*', (req, res) => {
    return proxy.post(req, res)
  })
  app.options('*', (req, res) => {
    return proxy.options(req, res)
  })
  app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Unexpected error occurred')
  })
  app.listen(Number(envConfig.proxyPort), () => {
    console.log(`NotionProxy listening at localhost:${envConfig.proxyPort}, NotionId: ${envConfig.notionPageId}`)
  })
}

main();