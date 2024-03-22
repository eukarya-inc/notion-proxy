const Env = require("./env");

test('Invalid type', () => {
  process.env.PROXY_PORT = 'STRING';
  expect(() =>  new Env()).toThrow('Invalid PROXY_PORT environment. Allow number');

  process.env.PROXY_PORT = '3456';
  process.env.CONTENT_CACHE_SEC = 'STRING';
  expect(() =>  new Env()).toThrow('Invalid CONTENT_CACHE_SEC environment. Allow number');
});