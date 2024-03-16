class ContentCache {
  constructor(expiresSec) {
    this.cache = {};
    this.expiresSec = parseInt(expiresSec);
  }

  setData(originUrl, content) {
    if (this.expiresSec === 0) {
      return;
    }

    this.cache[originUrl] = new CacheData(this.toSec(Date.now()) + this.expiresSec, content);
  }

  getData(originUrl) {
    if (this.expiresSec === 0) {
      return null;
    }

    const data = this.cache[originUrl];
    if (data === undefined) {
      return null;
    }
    const now = this.toSec(Date.now());
    if (now > data.timestamp) {
      this.delData(originUrl);
      return null;
    }
    return data.contentData;
  }

  delData(originUrl) {
    delete this.cache[originUrl];
  }

  toSec(unixTimeMilliseconds) {
    return Math.floor(unixTimeMilliseconds / 1000)
  }
}

class CacheData {
  constructor(timestamp, contentData) {
    this.timestamp = timestamp;
    this.contentData = contentData;
  }
}

module.exports = ContentCache;
