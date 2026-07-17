import http from "http";
import dotenv from "dotenv";
import facebookCrawler from "../services/facebookCrawler.js";

dotenv.config();

const PORT = 5992;

// Simulated HTML containing a Facebook post with nested comments and replies
const TEST_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Mock Facebook Page with Comments</title>
</head>
<body>
  <div role="feed">
    <!-- Main Post Container -->
    <div role="article" class="post" id="post1">
      <!-- Author header -->
      <h2>Programming Hero</h2>
      
      <!-- Caption container -->
      <div dir="auto" id="msg1">
        This is the original post caption about Node.js and Playwright. 
        It is written by the page author and should be extracted!
      </div>
      
      <!-- Post Links -->
      <a href="https://www.facebook.com/mockpage/posts/101">10 mins ago</a>

      <!-- Like / Comment / Share reaction bar (Boundary) -->
      <div role="toolbar">
        <button role="button">Like</button>
        <button role="button">Comment</button>
        <button role="button">Share</button>
      </div>

      <!-- Comments list section -->
      <div class="comments-section" aria-label="Comments list">
        <!-- Comment 1 (nested article) -->
        <div role="article" class="comment">
          <strong>Shorif Ahmed</strong>
          <div dir="auto">This is a user comment that must be completely ignored!</div>
          
          <!-- Nested reply (nested inside comment) -->
          <div role="article" class="reply">
            <strong>Programming Hero</strong>
            <div dir="auto">This is a nested reply that must also be ignored.</div>
          </div>
        </div>

        <!-- Comment 2 -->
        <div role="article" class="comment">
          <strong>Abir Hossain</strong>
          <div dir="auto">React is awesome but Next.js is better! Ignore this comment text too.</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

async function runCommentExclusionTest() {
  console.log("=========================================");
  console.log("🧪 Running Facebook Crawler Comment Exclusion Test");
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

  // 1. Start a local HTTP server to serve the mock page
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(TEST_HTML);
  });

  server.listen(PORT, async () => {
    console.log(`📡 Temporary test server listening on http://localhost:${PORT}`);

    try {
      // 2. Trigger crawler on local test server (targets Programming Hero mock url)
      const posts = await facebookCrawler.scrapeFacebookPage(`http://localhost:${PORT}/programmingHero`, 1);

      console.log(`\nℹ️ Scraper extracted ${posts.length} posts from local mock page.`);

      if (posts.length > 0) {
        const post = posts[0];
        console.log(`\nExtracted Caption: "${post.caption}"`);

        // Assertions
        assert(
          post.caption.includes("original post caption about Node.js"),
          "Crawler extracted the page owner's original post caption successfully"
        );

        assert(
          !post.caption.includes("Shorif Ahmed") && 
          !post.caption.includes("user comment that must be completely ignored") &&
          !post.caption.includes("nested reply that must also be ignored") &&
          !post.caption.includes("React is awesome"),
          "Crawler successfully excluded all nested comments and replies from the caption"
        );
      } else {
        assert(false, "Scraper returned 0 posts");
      }

      server.close();
      console.log("📡 Test server shut down.");

      console.log("=========================================");
      console.log(`🏁 Test Finished: ${passed} Passed, ${failed} Failed.`);
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

runCommentExclusionTest();
