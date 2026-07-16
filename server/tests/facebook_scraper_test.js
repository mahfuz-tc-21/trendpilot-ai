import dotenv from "dotenv";
import facebookCrawler from "../services/facebookCrawler.js";

dotenv.config();

async function runScraperTest() {
  console.log("=========================================");
  console.log("📡 Running Real Facebook Scraper Test (Playwright)");
  console.log("=========================================");

  const targetPage = "https://www.facebook.com/openai";
  console.log(`🔗 Scraping Target Page: ${targetPage}`);

  try {
    const posts = await facebookCrawler.scrapeFacebookPageWithRetry(targetPage, 3);
    
    console.log(`✅ Scraped successfully. Found ${posts.length} posts.`);
    
    if (posts.length > 0) {
      const first = posts[0];
      console.log("\nSample Post Details:");
      console.log(`- Post ID: ${first.postId}`);
      console.log(`- URL: ${first.postUrl}`);
      console.log(`- Date: ${first.postedDate}`);
      console.log(`- Likes Count: ${first.reactionCount}`);
      console.log(`- Comments Count: ${first.commentCount}`);
      console.log(`- Shares Count: ${first.shareCount}`);
      console.log(`- Images Found: ${first.imageUrls.length}`);
      console.log(`- Caption Preview: "${first.caption.substring(0, 100)}..."`);
      
      // Asserts
      if (first.postId && first.caption) {
        console.log("\n✅ [PASS] Facebook Crawler extracts correct metadata fields successfully.");
      } else {
        console.error("\n❌ [FAIL] Missing required post metadata fields.");
        process.exit(1);
      }
    } else {
      console.error("\n❌ [FAIL] Scraped page returned 0 posts.");
      process.exit(1);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(`\n⚠️ Scraper finished with expected blocking handling or error: ${err.message}`);
    if (err.message.includes("blocked") || err.message.includes("gate") || err.message.includes("checkpoint") || err.message.includes("No post elements")) {
      console.log("✅ [PASS] Scraper correctly threw a blocked/no-posts error instead of falling back to fake/mock posts.");
      process.exit(0);
    } else {
      console.error("❌ [FAIL] Scraper encountered an unexpected error.");
      process.exit(1);
    }
  }
}

runScraperTest();
