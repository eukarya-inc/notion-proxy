const ContentCache = require("./contentCache");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

test('Cache set and get', () => {
  const cache = new ContentCache('2');

  const targetUrl = '/test';
  cache.setData(targetUrl, 'xxxxx');

  let fetchedData = cache.getData(targetUrl)
  expect(fetchedData).toBe('xxxxx');

  fetchedData = cache.getData('NOT_FOUND')
  expect(fetchedData).toBe(null);
});

test('Cache already expired data', async () => {
  const cache = new ContentCache('2');

  const targetUrl = '/test';
  cache.setData(targetUrl, 'xxxxx');

  // Wait 3 sec
  await sleep(3000);

  // Data is expired so data is removed
  const fetchedData = cache.getData(targetUrl)
  expect(fetchedData).toBe(null);
});
