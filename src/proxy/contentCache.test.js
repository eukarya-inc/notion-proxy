const ContentCache = require("./contentCache");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

test('Cache set and get', async () => {
  const cache = new ContentCache('2');

  const targetUrl = '/test';
  cache.setData(targetUrl, 'xxxxx');

  let fetchedData = await cache.getData(targetUrl)
  expect(fetchedData).toBe('xxxxx');

  fetchedData = await cache.getData('NOT_FOUND')
  expect(fetchedData).toBe(null);
});

test('Cache already expired data', async () => {
  const cache = new ContentCache('2');

  const targetUrl = '/test';
  cache.setData(targetUrl, 'xxxxx');

  // Wait 3 sec
  await sleep(3000);

  // Data is expired so data is removed
  const fetchedData = await cache.getData(targetUrl)
  expect(fetchedData).toBe(null);
});

test('Access multiple thread', async () => {
  const cache = new ContentCache(60);
  const getDataSpy = jest.spyOn(cache, 'getData');
  const releaseLockSpy = jest.spyOn(cache, 'releaseLock');

  const targetUrl = '/test';
  const valueData = "XXXXXXXXXXXXXXX"
  cache.setData(targetUrl, valueData);

  // Define getData tasks
  const asyncTaskCnt = 100000;
  const tasks = [];
  for (let i = 0; i < asyncTaskCnt; i++) {
    tasks.push(cache.getData(targetUrl));
  }

  // Execute getData tasks concurrently
  const results = await Promise.all(tasks);
  results.forEach(result => {
    expect(result).toBe(valueData);
  });

  expect(getDataSpy).toHaveBeenCalledTimes(asyncTaskCnt);
  expect(releaseLockSpy).toHaveBeenCalledTimes(asyncTaskCnt);
});
