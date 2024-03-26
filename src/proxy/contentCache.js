class ContentCache {
  constructor(expiresSec) {
    this.cache = {};
    this.locks = {};
    this.expiresSec = parseInt(expiresSec);
  }

  setData(originUrl, content) {
    if (this.expiresSec === 0) {
      return;
    }

    const now = this.toSec(Date.now());
    this.cache[originUrl] = new CacheData(now + this.expiresSec, content);
  }

  async getData(originUrl) {
    if (this.expiresSec === 0) {
      return null;
    }

    if (!this.locks[originUrl]) {
      this.locks[originUrl] = new Promise(resolve => resolve());
    }

    await this.locks[originUrl];

    const data = this.cache[originUrl];
    if (data === undefined) {
      this.releaseLock(originUrl);
      return null;
    }

    const now = this.toSec(Date.now());
    if (now > data.timestamp) {
      this.delData(originUrl);
      this.releaseLock(originUrl);
      return null;
    }

    this.releaseLock(originUrl);
    return data.contentData;
  }

  delData(originUrl) {
    delete this.cache[originUrl];
  }

  releaseLock(originUrl) {
    delete this.locks[originUrl];
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
