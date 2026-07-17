import http from "http";
import dotenv from "dotenv";
import liveWorkspaceService from "../services/liveWorkspaceService.js";

dotenv.config();

const PORT = 5993;

const TEST_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Mock Web Page Article</title>
  <meta name="description" content="This is a mock description for testing crawling.">
  <meta name="keywords" content="mock, test, crawler">
</head>
<body>
  <main>
    <h1>Introduction to AI Workspace</h1>
    <p>This is a paragraph explaining how artificial intelligence workspace pipelines run live inside Node servers.</p>
    <p>We extract content, clean code elements, and build customized recommendations seamlessly.</p>
  </main>
</body>
</html>
`;

async function runWorkspaceLiveCrawlTest() {
  console.log("=========================================");
  console.log("🧪 Running Workspace Live Crawl Unit Test");
  console.log("=========================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Start a local HTTP server
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(TEST_HTML);
  });

  server.listen(PORT, async () => {
    console.log(`📡 Temporary test server listening on http://localhost:${PORT}`);

    try {
      // 2. Perform live website crawl on mock server
      const data = await liveWorkspaceService.crawlWebsite(`http://localhost:${PORT}`);

      console.log(`\nCrawl Details:`);
      console.log(`- Title: "${data.title}"`);
      console.log(`- Description: "${data.description}"`);
      console.log(`- Content Length: ${data.content.length} characters`);

      // Assertions
      assert(
        data.title === "Mock Web Page Article",
        "Website Crawler extracts the title tag value correctly"
      );

      assert(
        data.description === "This is a mock description for testing crawling.",
        "Website Crawler extracts the meta description tag value correctly"
      );

      assert(
        data.content.includes("artificial intelligence workspace pipelines"),
        "Website Crawler parses main body text paragraphs correctly and structures context"
      );

      server.close();
      console.log("📡 Test server shut down.");

      console.log("=========================================");
      console.log(`🏁 Workspace Ingestion Test: ${passed} Passed, ${failed} Failed.`);
      console.log("=========================================");

      if (failed > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    } catch (err) {
      console.error("❌ Test crashed:", err);
      server.close();
      process.exit(1);
    }
  });
}

runWorkspaceLiveCrawlTest();
