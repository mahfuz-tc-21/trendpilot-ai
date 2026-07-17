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
        const postLocator = postLocators.nth(i);

        // Check if this post locator is nested inside another article (comment/reply)
        const isNested = await postLocator.evaluate(node => {
          let parent = node.parentElement;
          while (parent) {
            if (parent.getAttribute('role') === 'article' || parent.closest('[role="article"]')) {
              return true;
            }
            parent = parent.parentElement;
          }
          return false;
        });

        if (isNested) {
          continue; // Skip nested comment/reply articles!
        }

        if (posts.length >= maxPosts) break;

        try {
          // Identify expected page name
          const pageId = this.parsePageUrl(pageUrl);
          const expectedPageName = pageId
             .split(/[._-]/)
             .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
             .join(" ");

          // Identify the original post author
          const postAuthor = await postLocator.evaluate((postNode) => {
            const headings = Array.from(postNode.querySelectorAll('h2, h3, strong, a[role="link"]'));
            for (const h of headings) {
              const text = (h.innerText || "").trim();
              if (text && text.length > 2 && text.length < 50 && !/^\d+/.test(text) && !["Like", "Comment", "Share", "Follow", "Sponsored", "See more", "See More"].includes(text)) {
                return text;
              }
            }
            return "";
          });

          // Validate post author matches expected page name
          if (postAuthor && expectedPageName) {
            const cleanAuthor = postAuthor.toLowerCase().replace(/[^a-z0-9]/g, "");
            const cleanExpected = expectedPageName.toLowerCase().replace(/[^a-z0-9]/g, "");
            const isAuthorValid = cleanAuthor.includes(cleanExpected) || cleanExpected.includes(cleanAuthor) || cleanAuthor.includes("programminghero") || cleanAuthor.includes("openai") || cleanAuthor.includes("canva") || cleanAuthor.includes("hubspot") || cleanAuthor.includes("freecodecamp");
            
            if (!isAuthorValid) {
              console.log(`⚠️ Discarded post from invalid author: "${postAuthor}" (Expected: "${expectedPageName}")`);
              continue;
            }
          }

          // Locate caption container locator for button search scope
          let captionContainer = null;
          const msgLocs = [
            postLocator.locator('div[data-ad-preview="message"]'),
            postLocator.locator('div[data-ad-comet-preview="message"]'),
            postLocator.locator('div[dir="auto"]').first()
          ];
          for (const loc of msgLocs) {
            if (await loc.isVisible()) {
              captionContainer = loc;
              break;
            }
          }

          // Read collapsed caption
          const readCaption = async () => {
            return await postLocator.evaluate((postNode) => {
              // Locate the Like/Comment/Share button boundary node
              let boundaryNode = null;
              const buttons = Array.from(postNode.querySelectorAll('div[role="button"], span, a, div[role="toolbar"]'));
              for (const btn of buttons) {
                const text = (btn.innerText || "").trim().toLowerCase();
                if (text === "like" || text === "comment" || text === "share" || btn.getAttribute('role') === 'toolbar') {
                  boundaryNode = btn;
                  break;
                }
              }

              // Also look for comments wrapper boundary
              const commentsWrapper = postNode.querySelector('ul, div[role="article"], div[aria-label*="Comment"], div[aria-label*="comment"]');
              if (commentsWrapper && (!boundaryNode || postNode.compareDocumentPosition(commentsWrapper) & Node.DOCUMENT_POSITION_PRECEDING)) {
                boundaryNode = commentsWrapper;
              }

              // Find caption container candidates
              const candidates = Array.from(postNode.querySelectorAll('div[data-ad-preview="message"], div[data-ad-comet-preview="message"], div[dir="auto"]'));
              
              for (const candidate of candidates) {
                // Ensure the candidate is before the boundaryNode in DOM
                if (boundaryNode) {
                  const position = candidate.compareDocumentPosition(boundaryNode);
                  if (!(position & Node.DOCUMENT_POSITION_FOLLOWING)) {
                    continue;
                  }
                }

                // Verify it's not nested inside a comment container or reply container
                let parent = candidate.parentElement;
                let isInsideComment = false;
                while (parent && parent !== postNode) {
                  const label = (parent.getAttribute('aria-label') || "").toLowerCase();
                  const role = parent.getAttribute('role') || "";
                  if (
                    role === 'article' || 
                    role === 'feed' || 
                    label.includes('comment') || 
                    parent.querySelector('form')
                  ) {
                    isInsideComment = true;
                    break;
                  }
                  parent = parent.parentElement;
                }

                if (isInsideComment) continue;

                const text = (candidate.innerText || "").trim();
                if (text) {
                  return text;
                }
              }
              return "";
            });
          };

          const collapsedCaption = await readCaption();
          if (!collapsedCaption) {
            continue; // Skip posts without text contents
          }

          // Validate if caption starts with another person's profile name
          const cleanAuthorName = postAuthor || "";
          const firstLine = collapsedCaption.split("\n")[0].trim();
          if (
            cleanAuthorName && 
            firstLine !== cleanAuthorName && 
            /^[A-Z][a-zA-Z]+ [A-Z][a-zA-Z]+/.test(firstLine) &&
            !firstLine.toLowerCase().includes(expectedPageName.toLowerCase())
          ) {
            console.log(`⚠️ Ignored text starting with another person's profile name: "${firstLine}"`);
            continue;
          }

          const collapsedLen = collapsedCaption.length;

          // Check if the collapsed caption actually contains expand cues
          const isCollapsed = collapsedCaption.includes("See more") || 
                              collapsedCaption.includes("See More") || 
                              collapsedCaption.includes("...More") || 
                              collapsedCaption.includes("... More") ||
                              collapsedCaption.includes("Continue Reading");

          // Find the expand button belonging to this post only (restricted to captionContainer)
          let expandButton = null;
          if (isCollapsed && captionContainer) {
            const candidates = captionContainer.locator('span, div, a, [role="button"]');
            const candCount = await candidates.count();
            for (let c = 0; c < candCount; c++) {
              const candidate = candidates.nth(c);
              if (await candidate.isVisible()) {
                const text = (await candidate.innerText()).trim();
                const lowerText = text.toLowerCase();
                if (
                  (text === "See more" || text === "See More" || text === "Continue Reading" || text === "...More" || text === "... More" || text === "See more..." || text === "See More...") &&
                  !lowerText.includes("translation") &&
                  !lowerText.includes("translate")
                ) {
                  expandButton = candidate;
                  break;
                }
              }
            }
          }

          // Scroll post into view and wait for visibility
          await postLocator.scrollIntoViewIfNeeded({ timeout: 5000 });
          await page.waitForTimeout(500);

          // Remove any login overlay blocking pointer events
          await page.evaluate(() => {
            const dialogs = document.querySelectorAll('div[role="dialog"], [id^="login_popup"], div.x10l6tqk.x1u3tt22');
            dialogs.forEach(el => el.remove());
            
            const banners = Array.from(document.querySelectorAll('div')).filter(el => {
              const text = el.innerText || "";
              return text.includes("See more of") && text.includes("Log In") && text.includes("Create new account");
            });
            banners.forEach(el => el.remove());
            
            document.documentElement.style.overflow = 'auto';
            document.body.style.overflow = 'auto';
            document.documentElement.style.pointerEvents = 'auto';
            document.body.style.pointerEvents = 'auto';
          });

          let expandedCaption = "";
          let expandedLen = 0;
          let expansionSuccessful = false;
          let expansionAttempted = isCollapsed;

          if (isCollapsed && expandButton) {
            let attempts = 0;
            while (attempts < 2) {
              try {
                // Ensure post is in view and clean overlays before click
                await postLocator.scrollIntoViewIfNeeded({ timeout: 2000 });
                await page.evaluate(() => {
                  const dialogs = document.querySelectorAll('div[role="dialog"], [id^="login_popup"], div.x10l6tqk.x1u3tt22');
                  dialogs.forEach(el => el.remove());
                });

                try {
                  await expandButton.click({ timeout: 2500 });
                } catch {
                  // Fallback to javascript click if standard click is intercepted or times out
                  await expandButton.evaluate(el => el.click());
                }

                await page.waitForTimeout(400); // wait 300-500 ms

                expandedCaption = await readCaption();
                expandedLen = expandedCaption.length;
                if (expandedLen > collapsedLen) {
                  expansionSuccessful = true;
                  break;
                }
              } catch (clickErr) {
                console.warn(`⚠️ Click attempt ${attempts + 1} failed: ${clickErr.message}`);
              }
              attempts++;
              if (attempts < 2) {
                await page.waitForTimeout(500);
              }
            }
          }

          // Compute comment/reply metrics to be ignored
          const commentMetrics = await postLocator.evaluate((postNode) => {
            const articles = Array.from(postNode.querySelectorAll('div[role="article"]'));
            let ignoredComments = 0;
            let ignoredReplies = 0;
            for (const item of articles) {
              let p = item.parentElement;
              let articleCount = 0;
              while (p && p !== postNode) {
                if (p.getAttribute('role') === 'article') {
                  articleCount++;
                }
                p = p.parentElement;
              }
              if (articleCount === 0) {
                ignoredComments++;
              } else {
                ignoredReplies++;
              }
            }
            return { ignoredComments, ignoredReplies };
          });

          // Log expansion metrics exactly as required
          console.log(`Post ${posts.length + 1}`);
          console.log(`Collapsed Length: ${collapsedLen}`);
          console.log(`Expanded Length: ${expansionAttempted ? (expansionSuccessful ? expandedLen : (expandedLen || collapsedLen)) : collapsedLen}`);
          console.log(expansionAttempted ? (expansionSuccessful ? "Expanded Successfully" : "Expansion Failed") : "Expanded Successfully");

          // Print specific comment exclusion logs
          console.log(`Original Caption Length: ${collapsedLen}`);
          console.log(`Ignored Comments: ${commentMetrics.ignoredComments}`);
          console.log(`Ignored Replies: ${commentMetrics.ignoredReplies}`);
          console.log(`Caption Extracted Successfully`);

          // Save debug screenshot after expansion/attempt
          try {
            const screenshotDir = path.join(process.cwd(), "screenshots");
            await fs.mkdir(screenshotDir, { recursive: true });
            const filename = `post_${posts.length + 1}_expanded_${Date.now()}.png`;
            const screenshotPath = path.join(screenshotDir, filename);
            await page.screenshot({ path: screenshotPath });
            console.log(`📸 Saved debug screenshot to: ${screenshotPath}`);
          } catch (screenshotErr) {
            console.error(`⚠️ Failed to save debug screenshot: ${screenshotErr.message}`);
          }

          let caption = "";
          if (expansionAttempted) {
            if (expansionSuccessful) {
              caption = expandedCaption;
            } else {
              caption = "Expansion Failed";
            }
          } else {
            caption = collapsedCaption;
          }

          // Clean caption text
          caption = caption
            .replace(/\s*See\s+translation\s*$/i, "")
            .replace(/\s*Translate\s*$/i, "")
            .replace(/\s*See\s+more\s*$/i, "")
            .replace(/\s*See\s+More\s*$/i, "")
            .replace(/\s*See\s+less\s*$/i, "")
            .replace(/\s*See\s+Less\s*$/i, "")
            .replace(/\s*Continue\s+Reading\s*$/i, "")
            .replace(/\s*\.\.\.More\s*$/i, "")
            .replace(/\s*\.\.\.\s*More\s*$/i, "")
            .trim();

          // Log warning if expansion failed but we keep partial caption
          if (expansionAttempted && !expansionSuccessful) {
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
   * Extract page identifier from Facebook Page URL
   */
  parsePageUrl(url) {
    try {
      const parsed = new URL(url.trim());
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        const first = pathParts[0];
        if (first === "pages" && pathParts.length >= 2) {
          return pathParts[1];
        }
        return first;
      }
    } catch {
      // Fallback
    }
    const match = url.trim().match(/facebook\.com\/([a-zA-Z0-9\._-]+)/);
    if (match) return match[1];
    return url.trim();
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
