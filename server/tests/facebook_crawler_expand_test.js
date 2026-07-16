import http from "http";
import dotenv from "dotenv";
import facebookCrawler from "../services/facebookCrawler.js";

dotenv.config();

const PORT = 5991;

// Simulated HTML containing collapsed Facebook posts
const TEST_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Mock Facebook Page</title>
  <style>
    .post { margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; }
    .see-more, .see-translation { cursor: pointer; color: blue; text-decoration: underline; margin-left: 5px; }
  </style>
</head>
<body>
  <div role="feed">
    <!-- Post 1: See More Variant -->
    <div role="article" class="post" id="post1">
      <div dir="auto" id="msg1">
        This is a very long post content about coding in JavaScript...
        <span class="see-more" id="btn1" role="button">See More</span>
      </div>
      <a href="https://www.facebook.com/mockpage/posts/101">10 mins ago</a>
    </div>

    <!-- Post 2: Continue Reading Variant -->
    <div role="article" class="post" id="post2">
      <div dir="auto" id="msg2">
        We are launching an exciting new AI tool today...
        <span class="see-more" id="btn2" role="button">Continue Reading</span>
      </div>
      <a href="https://www.facebook.com/mockpage/posts/102">1 hour ago</a>
    </div>

    <!-- Post 3: See translation (to be ignored) -->
    <div role="article" class="post" id="post3">
      <div dir="auto" id="msg3">
        Bonjour tout le monde! Ceci est un message en français.
        <span class="see-translation" id="btn3" role="button">See translation</span>
      </div>
      <a href="https://www.facebook.com/mockpage/posts/103">2 hours ago</a>
    </div>
  </div>

  <script>
    // Simulate expanding text when clicked
    document.getElementById('btn1').addEventListener('click', function() {
      document.getElementById('msg1').innerHTML = 'This is a very long post content about coding in JavaScript. We are teaching developers how to build dynamic applications using Node.js, Express, and React with absolute confidence.';
    });

    document.getElementById('btn2').addEventListener('click', function() {
      document.getElementById('msg2').innerHTML = 'We are launching an exciting new AI tool today. It automates repetitive content flows, generates outlines, and produces natural transcripts for creators instantly.';
    });

    document.getElementById('btn3').addEventListener('click', function() {
      // Translation button does NOT expand text, just changes translation display
      document.getElementById('msg3').innerHTML = 'Hello everyone! This is a message in French. See translation';
    });
  </script>
</body>
</html>
`;

async function runCrawlerExpandTest() {
  console.log("=========================================");
  console.log("🧪 Running Facebook Crawler Expander Unit Test");
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

  // 1. Start a local HTTP server to serve mock page
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(TEST_HTML);
  });

  server.listen(PORT, async () => {
    console.log(`📡 Temporary test server listening on http://localhost:${PORT}`);

    try {
      // 2. Trigger crawler on local test server
      const posts = await facebookCrawler.scrapeFacebookPage(`http://localhost:${PORT}`, 3);

      console.log(`ℹ️ Scraper extracted ${posts.length} posts from local mock page.`);

      // Find individual posts
      const post1 = posts.find(p => p.postUrl.includes("/posts/101"));
      const post2 = posts.find(p => p.postUrl.includes("/posts/102"));
      const post3 = posts.find(p => p.postUrl.includes("/posts/103"));

      // Asserts
      assert(!!post1, "Post 1 (See More) extracted successfully");
      if (post1) {
        assert(
          post1.caption.includes("We are teaching developers") && !post1.caption.includes("See More"),
          "Post 1 successfully expanded and cleaned trailing button label words"
        );
      }

      assert(!!post2, "Post 2 (Continue Reading) extracted successfully");
      if (post2) {
        assert(
          post2.caption.includes("repetitive content flows") && !post2.caption.includes("Continue Reading"),
          "Post 2 successfully expanded and cleaned trailing button label words"
        );
      }

      assert(!!post3, "Post 3 (See translation) extracted successfully");
      if (post3) {
        assert(
          post3.caption.includes("Bonjour tout le monde") && !post3.caption.includes("Hello everyone"),
          "Post 3 translation button was correctly ignored (French text remains untranslated)"
        );
      }

      server.close();
      console.log("📡 Test server shut down.");

      console.log("=========================================");
      console.log(`🏁 Expander Test Finished: ${passed} Passed, ${failed} Failed.`);
      console.log("=========================================");

      if (failed > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    } catch (err) {
      console.error("❌ Crawler expand test crashed:", err);
      server.close();
      process.exit(1);
    }
  });
}

runCrawlerExpandTest();
