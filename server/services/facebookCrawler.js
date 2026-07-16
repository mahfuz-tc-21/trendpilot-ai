import { chromium } from "playwright";
import path from "path";
import fs from "fs/promises";

/**
 * Playwright-based crawler to extract post details and metrics from public Facebook Pages.
 */
class FacebookCrawler {
  /**
   * Main scraper logic.
   * @param {string} pageUrl - Public Facebook Page URL
   * @param {number} maxPosts - Maximum posts to scrape
   * @returns {Promise<Array>} List of extracted posts
   */
  async scrapeFacebookPage(pageUrl, maxPosts = 5) {
    console.log(`🤖 Launching Playwright Chromium for: ${pageUrl}`);
    const browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process"
      ]
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      locale: "en-US"
    });

    const page = await context.newPage();

    try {
      // 1. Open the page
      await page.goto(pageUrl, { waitUntil: "networkidle", timeout: 45000 });

      // Check for redirect login/checkpoints
      const currentUrl = page.url();
      if (currentUrl.includes("facebook.com/login") || currentUrl.includes("checkpoint")) {
        throw new Error("Scraping blocked: Redirected to Facebook login/checkpoint gate");
      }

      // Close login modal if present
      try {
        const closeSelectors = [
          'div[role="dialog"] div[aria-label="Close"]',
          'div[role="dialog"] div[aria-label="close"]',
          'div[aria-label="Close"]',
          'div[role="dialog"] i.x1b0y5df',
          'div[role="dialog"] div.x92yi7g'
        ];
        for (const selector of closeSelectors) {
          const btn = page.locator(selector).first();
          if (await btn.isVisible()) {
            await btn.click();
            console.log("❌ Closed Facebook login dialog banner");
            break;
          }
        }
      } catch {
        // ignore banner closing failures
      }

      // 2. Scroll automatically to load dynamic feeds
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
      }

      // 3. Extract posts
      const postLocators = page.locator('div[role="feed"] div[role="article"], div[role="article"]');
      const count = await postLocators.count();
      console.log(`🤖 Found ${count} article locator candidates on page`);

      const posts = [];
      for (let i = 0; i < count; i++) {
        if (posts.length >= maxPosts) break;
        const postLocator = postLocators.nth(i);

        try {
          // Check for expand button inside this specific post
          const expandSelectors = [
            'div[role="button"]:has-text("See more")',
            'div[role="button"]:has-text("See More")',
            'span:has-text("See more")',
            'span:has-text("See More")',
            'span:has-text("Continue Reading")',
            'div:has-text("Continue Reading")',
            'a:has-text("See more")',
            'a:has-text("See More")',
            'a:has-text("Continue Reading")'
          ];
          
          let expandButton = null;
          for (const sel of expandSelectors) {
            const loc = postLocator.locator(sel).first();
            if (await loc.isVisible()) {
              const text = await loc.innerText();
              const lowerText = text.toLowerCase();
              // Ignore translations or other items containing button selectors
              if (
                (lowerText.includes("see more") || lowerText.includes("continue reading")) &&
                !lowerText.includes("translation")
              ) {
                expandButton = loc;
                break;
              }
            }
          }

          let expansionSuccessful = false;
          if (expandButton) {
            console.log(`☝️ Clicking expand text button in post #${i}`);
            try {
              const checkCaptionText = async () => {
                const messageLocators = [
                  postLocator.locator('div[data-ad-preview="message"]'),
                  postLocator.locator('div[data-ad-comet-preview="message"]'),
                  postLocator.locator('div[dir="auto"]').first()
                ];
                for (const loc of messageLocators) {
                  if (await loc.isVisible()) {
                    return (await loc.innerText()).trim();
                  }
                }
                return "";
              };

              const initialLen = (await checkCaptionText()).length;
              await expandButton.click({ timeout: 3000 });
              await page.waitForTimeout(500); // Base delay for DOM calculation

              // Poll to wait until expanded text is rendered
              let currentText = await checkCaptionText();
              let attempts = 0;
              while (currentText.length <= initialLen && attempts < 5) {
                await page.waitForTimeout(100);
                currentText = await checkCaptionText();
                attempts++;
              }
              
              if (currentText.length > initialLen) {
                expansionSuccessful = true;
                console.log(`📈 Expanded post text length went from ${initialLen} to ${currentText.length}`);
              }
            } catch (clickErr) {
              console.warn(`⚠️ Warning: Failed to expand post text: ${clickErr.message}`);
            }
          }

          // Extract caption
          const messageLocators = [
            postLocator.locator('div[data-ad-preview="message"]'),
            postLocator.locator('div[data-ad-comet-preview="message"]'),
            postLocator.locator('div[dir="auto"]').first()
          ];
          let caption = "";
          for (const loc of messageLocators) {
            if (await loc.isVisible()) {
              caption = (await loc.innerText()).trim();
              if (caption) break;
            }
          }

          if (!caption) {
            continue; // Skip posts without text contents
          }

          // Clean caption text from trailing expand button labels if they are extracted as part of innerText
          // Ignore "See translation" and clean button variations
          caption = caption
            .replace(/\s*See\s+translation\s*$/i, "")
            .replace(/\s*See\s+more\s*\.\.\.\s*$/i, "")
            .replace(/\s*See\s+More\s*\.\.\.\s*$/i, "")
            .replace(/\s*See\s+more\s*$/i, "")
            .replace(/\s*See\s+More\s*$/i, "")
            .replace(/\s*Continue\s+Reading\s*$/i, "")
            .trim();

          // Log warning if expansion failed but we keep partial caption
          if (expandButton && !expansionSuccessful) {
            console.warn(`⚠️ Warning: Post #${i} expansion failed or did not yield longer text.`);
          }

          // Extract link & post ID
          const linkLocators = postLocator.locator('a[href*="/posts/"], a[href*="/permalink/"], a[href*="/photos/"], a[href*="/videos/"], a[href*="/story.php"]');
          let postUrl = "";
          let postId = "";
          const linkCount = await linkLocators.count();
          for (let j = 0; j < linkCount; j++) {
            const href = await linkLocators.nth(j).getAttribute("href");
            if (href) {
              const absoluteUrl = new URL(href, pageUrl).href;
              const cleanedUrl = absoluteUrl.split("?")[0];
              postUrl = cleanedUrl;

              const idMatch = cleanedUrl.match(/(?:\/posts\/|\/permalink\/|\/photos\/\w+\.|\/videos\/|fbid=)([a-zA-Z0-9_]+)/);
              if (idMatch) {
                postId = idMatch[1];
                break;
              }
            }
          }

          if (!postId) {
            postId = Buffer.from(caption.substring(0, 30)).toString("hex");
          }

          if (!postUrl) {
            postUrl = `${pageUrl}/posts/${postId}`;
          }

          // Extract image URLs
          const imgLocators = postLocator.locator("img");
          const imgCount = await imgLocators.count();
          const images = [];
          for (let j = 0; j < imgCount; j++) {
            const src = await imgLocators.nth(j).getAttribute("src");
            if (src && src.startsWith("http") && !src.includes("rsrc.php") && !src.includes("emoji.php")) {
              images.push(src);
            }
          }

          // Extract video URLs
          const videoLocator = postLocator.locator("video");
          const videoCount = await videoLocator.count();
          const videos = [];
          for (let j = 0; j < videoCount; j++) {
            const src = await videoLocator.nth(j).getAttribute("src");
            if (src) {
              videos.push(src);
            }
          }

          // Extract metrics: Likes, Comments, Shares
          const postText = await postLocator.innerText();
          
          let reactionCount = 0;
          let commentCount = 0;
          let shareCount = 0;

          const reactionMatch = postText.match(/(\d+(?:\.\d+)?\s*[KkMm]?)\s*(?:Reactions|Likes|likes|reactions)/) || postText.match(/(?:Reactions|Likes):\s*(\d+(?:\.\d+)?\s*[KkMm]?)/);
          if (reactionMatch) {
            reactionCount = this.parseMetricValue(reactionMatch[1]);
          } else {
            const firstNumMatch = postText.match(/^(\d+(?:\.\d+)?\s*[KkMm]?)$/m);
            if (firstNumMatch) reactionCount = this.parseMetricValue(firstNumMatch[1]);
          }

          const commentMatch = postText.match(/(\d+(?:\.\d+)?\s*[KkMm]?)\s*(?:Comments|comments|Comment|comment|মন্তব্য)/);
          if (commentMatch) {
            commentCount = this.parseMetricValue(commentMatch[1]);
          }

          const shareMatch = postText.match(/(\d+(?:\.\d+)?\s*[KkMm]?)\s*(?:Shares|shares|Share|share|শেয়ার)/);
          if (shareMatch) {
            shareCount = this.parseMetricValue(shareMatch[1]);
          }

          // Published Date
          let postedDate = new Date();
          const timeLocator = postLocator.locator("time[datetime]");
          if (await timeLocator.isVisible()) {
            const datetimeAttr = await timeLocator.getAttribute("datetime");
            if (datetimeAttr) {
              postedDate = new Date(datetimeAttr);
            }
          } else {
            const abbrLocator = postLocator.locator("abbr");
            if (await abbrLocator.isVisible()) {
              const abbrText = await abbrLocator.first().innerText();
              postedDate = this.parseRelativeDate(abbrText);
            }
          }

          posts.push({
            postId,
            caption,
            postedDate,
            imageUrls: images,
            videoUrls: videos,
            reactionCount,
            commentCount,
            shareCount,
            postUrl
          });
        } catch (postErr) {
          console.error("⚠️ Failed to parse individual post element:", postErr.message);
        }
      }

      if (posts.length === 0) {
        throw new Error("Scraping failed: No post elements could be extracted. Web layout changed or blocked.");
      }

      return posts;
    } catch (err) {
      try {
        const screenshotDir = path.join(process.cwd(), "screenshots");
        await fs.mkdir(screenshotDir, { recursive: true });
        const filename = `failure_${Date.now()}.png`;
        const screenshotPath = path.join(screenshotDir, filename);
        await page.screenshot({ path: screenshotPath });
        console.error(`📸 Saved failure screenshot to: ${screenshotPath}`);
      } catch (screenshotErr) {
        console.error(`⚠️ Failed to take error screenshot: ${screenshotErr.message}`);
      }
      throw err;
    } finally {
      await browser.close();
    }
  }

  /**
   * Parse numerical metric notations (e.g. 1.2K -> 1200)
   */
  parseMetricValue(str) {
    if (!str) return 0;
    const clean = str.toUpperCase().trim();
    if (clean.endsWith("K")) {
      return Math.round(parseFloat(clean.replace("K", "")) * 1000);
    }
    if (clean.endsWith("M")) {
      return Math.round(parseFloat(clean.replace("M", "")) * 1000000);
    }
    const val = parseInt(clean.replace(/[^0-9]/g, ""), 10);
    return isNaN(val) ? 0 : val;
  }

  /**
   * Parse relative facebook posted strings
   */
  parseRelativeDate(str) {
    if (!str) return new Date();
    const clean = str.toLowerCase().trim();
    const now = new Date();

    if (clean.includes("hr") || clean.includes("hour")) {
      const match = clean.match(/(\d+)/);
      if (match) {
        return new Date(now.getTime() - parseInt(match[1], 10) * 60 * 60 * 1000);
      }
    }
    if (clean.includes("min") || clean.includes("minute")) {
      const match = clean.match(/(\d+)/);
      if (match) {
        return new Date(now.getTime() - parseInt(match[1], 10) * 60 * 1000);
      }
    }
    if (clean.includes("yesterday")) {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return date;
    }
    if (clean.includes("day")) {
      const match = clean.match(/(\d+)/);
      if (match) {
        const date = new Date();
        date.setDate(date.getDate() - parseInt(match[1], 10));
        return date;
      }
    }
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? now : parsed;
  }

  /**
   * Scrape with exponential backoff retries if blocked
   */
  async scrapeFacebookPageWithRetry(pageUrl, maxPosts = 5, retries = 3, baseDelay = 5000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const posts = await this.scrapeFacebookPage(pageUrl, maxPosts);
        return posts;
      } catch (err) {
        console.error(`❌ Attempt ${attempt} failed to scrape Facebook Page [${pageUrl}]: ${err.message}`);
        if (attempt === retries) {
          throw err;
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏰ Retrying Facebook scrape in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}

export default new FacebookCrawler();
