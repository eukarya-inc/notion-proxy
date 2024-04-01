const ProxyConfig = require("./proxyConfig");

test('New instance', () => {
  process.env.PROXY_PORT = 'STRING';
  expect(() =>  new ProxyConfig()).toThrow('Invalid PROXY_PORT environment. Allow number');

  process.env.PROXY_PORT = '3456';
  process.env.CONTENT_CACHE_SEC = 'STRING';
  expect(() =>  new ProxyConfig()).toThrow('Invalid CONTENT_CACHE_SEC environment. Allow number');

  process.env.PROXY_PORT = '3456';
  process.env.CONTENT_CACHE_SEC = '300';
  const c = new ProxyConfig();
  expect(c.proxyPort).toBe('3456');
  expect(c.ogTag.title).toBe('');
  expect(c.ogTag.type).toBe('website');
});