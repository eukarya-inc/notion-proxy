const mime = require("mime-types");

function generateSitemap(domain, slugToPage) {
  let sitemap = '<?xml version="1.0" encoding="utf-8"?>'
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
      + ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
      + ' xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9'
      + ' http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">'

  for (const slug in slugToPage) {
    sitemap += '<url><loc>https://' + domain + '/' + slug + '</loc></url>'
  }
  sitemap += '</urlset>'
  return sitemap
}

function generateNotionUrl(req, slugToPage) {
  let url = 'https://www.notion.so'
  let uri = req.originalUrl.substring(1)
  let isRedirect = false;

  if (slugToPage.hasOwnProperty(uri)) {
    url = slugToPage[uri].split('/').pop();
    isRedirect = true;

  } else if (req.originalUrl.startsWith('/image/https')) {
    let uri = req.originalUrl.replace('https:/s3','https://s3')
    const subUrl = uri.substring(7)
    const p1 = subUrl.split('?')[0]
    const p2 = subUrl.split('?')[1]
    url += '/image/' + encodeURIComponent(p1) + '?' + p2

  } else {
    url += req.originalUrl
  }
  return { url: url, isRedirect: isRedirect };
}

const AMAZON_NAWS_FLG = 'amazonaws.com';
function getMineTypeIfAwsUrl(url, currentContentType) {
  if (url.includes(AMAZON_NAWS_FLG) && url.includes('.png')) {
    return 'image/png';
  } else if (url.includes(AMAZON_NAWS_FLG) && url.includes('.jpg')) {
    return 'image/jpg';
  } else if (url.includes(AMAZON_NAWS_FLG) && url.includes('.jpeg')) {
    return 'image/jpeg';
  } else if (url.includes(AMAZON_NAWS_FLG) && url.includes('.gif')) {
    return 'image/gif';
  } else if (url.includes(AMAZON_NAWS_FLG) && url.includes('.tiff')) {
    return 'image/tiff';
  } else if (url.includes(AMAZON_NAWS_FLG) && url.includes('.svg')) {
    return 'image/svg+xml'
  } else if (url.startsWith('/icons')) {
    return 'image/svg+xml'
  }
  return currentContentType;
}

function getContentType(originalUrl) {
  let contentType = mime.lookup(originalUrl)
  if (!contentType) {
    contentType = 'text/html'
  }
  return getMineTypeIfAwsUrl(originalUrl, contentType);
}

function isContent(originalUrl) {
  if (originalUrl.startsWith('/image') || originalUrl.startsWith('/icons') || originalUrl.endsWith('.wasm')) {
    return true
  }
  return false;
}

function isCrawlerRequest(userAgent) {
  if (userAgent && userAgent.toLowerCase().includes('slack') || userAgent.toLowerCase().includes('bot')) {
    return true;
  }
  return false;
}

module.exports = {
  generateSitemap: generateSitemap,
  generateNotionUrl: generateNotionUrl,
  getMineTypeIfAwsUrl: getMineTypeIfAwsUrl,
  getContentType: getContentType,
  isContent: isContent,
  isCrawlerRequest: isCrawlerRequest,
};
