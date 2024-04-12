const puppeteer = require("puppeteer");
const {JSDOM} = require("jsdom");

/**
 * AutoOgpExtractor.
 *
 * Automatic extract OGP tag via headless chrome.
 * The data extraction will essentially be null if chrome does not installed on execution OS.
 * So This class is failure safe.
 * The image has Chrome installed if the notion proxy is running on a container. See Dockerfile.
 */
class AutoOgpExtractor {
  constructor(notionId, domain, isTls, proxyPort) {
    this.notionId = notionId;
    this.domain = domain;
    this.isTls = isTls;
    this.proxyPort = proxyPort;
  }

  async fetchHtmlAfterExecutedJs() {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        timeout: 120000,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      const page = await browser.newPage();
      await page.goto(`http://localhost:${this.proxyPort}/${this.notionId}`);
      await page.waitForSelector('.notion-topbar');
      const html = await page.content();
      await browser.close();
      return html;
    } catch (err) {
      return null;
    }
  }

  extractOgTitle(htmlStr) {
    if (htmlStr === '' || htmlStr === null) {
      return null;
    }
    const dom = new JSDOM(htmlStr);
    const titleElement = dom.window.document.querySelector('title');
    let pageTitle = null;
    if (titleElement) {
      pageTitle = titleElement.textContent;
    }
    return pageTitle;
  }

  extractOgImage(htmlStr) {
    if (htmlStr === '' || htmlStr === null) {
      return null;
    }
    const dom = new JSDOM(htmlStr);
    const layoutFullImages = dom.window.document.querySelectorAll('.layout-full img');
    const images = Array.from(layoutFullImages).map(img => ({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt')
    }));

    if (!images || images.length === 0) {
      return null;
    }
    const protocol = this.isTls ? 'https' : 'http';
    let uri = images[0].src.substring(1);
    return `${protocol}://${this.domain}/${uri}`;
  }

  extractIcon(htmlStr) {
    if (htmlStr === '' || htmlStr === null) {
      return null;
    }
    const dom = new JSDOM(htmlStr);
    const imgElements = dom.window.document.querySelectorAll('img[alt="Page icon"]');
    const srcValues = Array.from(imgElements).map(img => img.getAttribute('src'));
    if (!srcValues || srcValues.length === 0) {
      return null;
    }

    const protocol = this.isTls ? 'https' : 'http';
    let uri = srcValues[0].substring(1);
    return `${protocol}://${this.domain}/${uri}`;
  }

  extractOgDesc(htmlStr) {
    if (htmlStr === '' || htmlStr === null) {
      return null;
    }
    return '';
  }
}

module.exports = AutoOgpExtractor;
