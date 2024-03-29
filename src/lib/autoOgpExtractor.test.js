const AutoOgpExtractor = require("./autoOgpExtractor");

const testHtmlStr =  `
<html class="notion-html">
<head lang="en">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,height=device-height,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <title>Notion – The all-in-one workspace for your notes, tasks, wikis, and databases.</title>
  <meta name="description" content="A new tool that blends your everyday work apps into one. It's the all-in-one workspace for you and your team">
  <meta property="og:site_name" content="Notion">
  <meta property="og:type" content="website">
  <meta property="og:url" content="http://localhost:3456">
  <meta property="og:title" content="Notion – The all-in-one workspace for your notes, tasks, wikis, and databases.">
  <meta property="og:description" content="A new tool that blends your everyday work apps into one. It's the all-in-one workspace for you and your team">
  <meta property="og:image" content="https://www.notion.so/images/meta/default.png">
  <meta property="og:locale" content="en_US">
</head>
<body>
  <p>Hello</p>
  <div class="layout-full">
    <img src="/image/hello.png" referrerpolicy="same-origin" style="display: block; object-fit: cover; border-radius: 0px; width: 100%; height: 30vh; opacity: 1; object-position: center 50%;">
  </div>
</body>
</html>`


function getAutoOgpExtractor() {
  const notionId = 'f1db0cfbe246475784c67f279289abea';
  const domain = 'eukarya.io';
  const isTls = true;
  return new AutoOgpExtractor(notionId, domain, isTls);
}

test('Extract og title', () => {
  const extractor = getAutoOgpExtractor();
  const title = extractor.extractOgTitle(testHtmlStr);

  expect(title).toBe('Notion – The all-in-one workspace for your notes, tasks, wikis, and databases.');
});

test('Extract og image', () => {
  const extractor = getAutoOgpExtractor();
  const imgage = extractor.extractOgImage(testHtmlStr);

  expect(imgage).toBe('https://eukarya.io/image/hello.png');
});