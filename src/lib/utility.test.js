const {generateNotionUrl, getMineTypeIfAwsUrl, isContent, isCrawlerRequest} = require("./utility");
const slugToPage = {'': 'f1db0cfbe246475784c67f279289abea'}

test('generateNotionUrl redirect when /', () => {
  const req = {'originalUrl': '/'};
  const info = generateNotionUrl(req, slugToPage)
  expect(info.url).toBe('f1db0cfbe246475784c67f279289abea');
});

test('generateNotionUrl redirect when start with /image/http', () => {
  const req = {'originalUrl': '/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2Fe1be82b6-a721-49ac-b288-ac00c5338122%2F6cd5e21a-b464-475e-80ed-dce106d2e523%2FFrame_3485.png?id=2333c362-2b31-4961-851e-3813333a9f0f&table=block&spaceId=e1be82b6-a721-49ac-b288-ac00c5338122&width=360&userId=&cache=v2'};
  const info = generateNotionUrl(req, slugToPage);
  expect(info.url).toBe('https://www.notion.so/image/https%253A%252F%252Fprod-files-secure.s3.us-west-2.amazonaws.com%252Fe1be82b6-a721-49ac-b288-ac00c5338122%252F6cd5e21a-b464-475e-80ed-dce106d2e523%252FFrame_3485.png?id=2333c362-2b31-4961-851e-3813333a9f0f&table=block&spaceId=e1be82b6-a721-49ac-b288-ac00c5338122&width=360&userId=&cache=v2');
});

test('generateNotionUrl redirect when standard', () => {
  const req = {'originalUrl': '/_assets/4885-9e7235d9e7aa4eec.js'};
  const info = generateNotionUrl(req, slugToPage);
  expect(info.url).toBe('https://www.notion.so/_assets/4885-9e7235d9e7aa4eec.js');
});

test('getMineType if image data defines on url', () => {
  const contentType = 'text/html';

  // png
  let url = 'https://www.notion.so/image/https%253A%252F%252Fprod-files-secure.s3.us-west-2.amazonaws.com%252Fe1be82b6-a721-49ac-b288-ac00c5338122%252F6cd5e21a-b464-475e-80ed-dce106d2e523%252FFrame_3485.png?id=2333c362-2b31-4961-851e-3813333a9f0f&table=block&spaceId=e1be82b6-a721-49ac-b288-ac00c5338122&width=360&userId=&cache=v2';
  let newContentTypeFromUrl = getMineTypeIfAwsUrl(url, contentType);
  expect(newContentTypeFromUrl).toBe('image/png');

  // jpg
  url = 'https://www.notion.so/image/https%253A%252F%252Fprod-files-secure.s3.us-west-2.amazonaws.com%252Fe1be82b6-a721-49ac-b288-ac00c5338122%252F6cd5e21a-b464-475e-80ed-dce106d2e523%252FFrame_3485.jpg?id=2333c362-2b31-4961-851e-3813333a9f0f&table=block&spaceId=e1be82b6-a721-49ac-b288-ac00c5338122&width=360&userId=&cache=v2';
  newContentTypeFromUrl = getMineTypeIfAwsUrl(url, contentType);
  expect(newContentTypeFromUrl).toBe('image/jpg');

  // jpeg
  url = 'https://www.notion.so/image/https%253A%252F%252Fprod-files-secure.s3.us-west-2.amazonaws.com%252Fe1be82b6-a721-49ac-b288-ac00c5338122%252F6cd5e21a-b464-475e-80ed-dce106d2e523%252FFrame_3485.jpeg?id=2333c362-2b31-4961-851e-3813333a9f0f&table=block&spaceId=e1be82b6-a721-49ac-b288-ac00c5338122&width=360&userId=&cache=v2';
  newContentTypeFromUrl = getMineTypeIfAwsUrl(url, contentType);
  expect(newContentTypeFromUrl).toBe('image/jpeg');

  // gif
  url = 'https://www.notion.so/image/https%253A%252F%252Fprod-files-secure.s3.us-west-2.amazonaws.com%252Fe1be82b6-a721-49ac-b288-ac00c5338122%252F6cd5e21a-b464-475e-80ed-dce106d2e523%252FFrame_3485.gif?id=2333c362-2b31-4961-851e-3813333a9f0f&table=block&spaceId=e1be82b6-a721-49ac-b288-ac00c5338122&width=360&userId=&cache=v2';
  newContentTypeFromUrl = getMineTypeIfAwsUrl(url, contentType);
  expect(newContentTypeFromUrl).toBe('image/gif');

  // tiff
  url = 'https://www.notion.so/image/https%253A%252F%252Fprod-files-secure.s3.us-west-2.amazonaws.com%252Fe1be82b6-a721-49ac-b288-ac00c5338122%252F6cd5e21a-b464-475e-80ed-dce106d2e523%252FFrame_3485.tiff?id=2333c362-2b31-4961-851e-3813333a9f0f&table=block&spaceId=e1be82b6-a721-49ac-b288-ac00c5338122&width=360&userId=&cache=v2';
  newContentTypeFromUrl = getMineTypeIfAwsUrl(url, contentType);
  expect(newContentTypeFromUrl).toBe('image/tiff');

  // svg
  url = 'https://www.notion.so/image/https%253A%252F%252Fprod-files-secure.s3.us-west-2.amazonaws.com%252Fe1be82b6-a721-49ac-b288-ac00c5338122%252F6cd5e21a-b464-475e-80ed-dce106d2e523%252FFrame_3485.svg?id=2333c362-2b31-4961-851e-3813333a9f0f&table=block&spaceId=e1be82b6-a721-49ac-b288-ac00c5338122&width=360&userId=&cache=v2';
  newContentTypeFromUrl = getMineTypeIfAwsUrl(url, contentType);
  expect(newContentTypeFromUrl).toBe('image/svg+xml');
});

test('isContent', () => {
  let path = '/image';
  expect(isContent(path)).toBe(true);

  path = '/icons';
  expect(isContent(path)).toBe(true);

  path = '/image/test.wasm';
  expect(isContent(path)).toBe(true);

  path = '/api/v1'
  expect(isContent(path)).toBe(false);
});

test('isCrawler', () => {
  let userAgent = "slackBot";
  expect(isCrawlerRequest(userAgent)).toBe(true);

  userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36";
  expect(isCrawlerRequest(userAgent)).toBe(false);
});
