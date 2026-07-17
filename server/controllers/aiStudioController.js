import ContentItem from "../models/ContentItem.js";
import Summary from "../models/Summary.js";
import User from "../models/User.js";
import StudioOutput from "../models/StudioOutput.js";
import { getAIClient, getLanguageInstruction } from "../services/aiService.js";
import liveWorkspaceService from "../services/liveWorkspaceService.js";

class AIStudioController {
  /**
   * Generates custom platform-specific social posts or articles from multiple input sources.
   */
  async generatePost(req, res, next) {
    try {
      const { 
        inputType = "crawled_content",
        contentId, 
        customTopic, 
        pastedContent, 
        url, 
        facebookSelection = "latest",
        format, 
        instructions 
      } = req.body;

      if (!format) {
        const error = new Error("Format is required (e.g. LinkedIn, Twitter, Blog, YouTube, Newsletter)");
        error.status = 400;
        throw error;
      }

      const userId = req.user.userId;
      let contentInfoText = "";

      // Handle 7 different input source types
      if (inputType === "crawled_content") {
        if (!contentId) {
          const error = new Error("Content ID is required for Crawled Content source");
          error.status = 400;
          throw error;
        }
        const contentItem = await ContentItem.findById(contentId).populate("sourceId");
        if (!contentItem) {
          const error = new Error("Content item not found");
          error.status = 404;
          throw error;
        }

        const summary = await Summary.findOne({ contentId, userId });
        contentInfoText = `
Source Title: ${contentItem.title}
Source Description: ${contentItem.description}
Source Author: ${contentItem.author || "Unknown"}
Source Category: ${contentItem.sourceId?.category || "general"}
AI Summary: ${summary?.summary || ""}
Key Takeaways: ${summary?.keyPoints?.join("\n- ") || ""}
Keywords: ${summary?.keywords?.join(", ") || ""}
`;
      } else if (inputType === "custom_topic") {
        if (!customTopic || !customTopic.topic) {
          const error = new Error("Topic name is required for Custom Topic");
          error.status = 400;
          throw error;
        }
        contentInfoText = `
INPUT TYPE: Custom Topic
Topic Title: ${customTopic.topic}
Target Audience Profile: ${customTopic.audience || "General Audience"}
Preferred Tone: ${customTopic.tone || "Professional"}
Preferred Language: ${customTopic.language || "Auto Detect"}
Target Keywords: ${customTopic.keywords || "None"}
Reference URLs: ${customTopic.referenceUrls || "None"}
Additional Instructions: ${customTopic.instructions || "None"}
`;
      } else if (inputType === "paste_content") {
        if (!pastedContent) {
          const error = new Error("Pasted content context is required");
          error.status = 400;
          throw error;
        }
        contentInfoText = `
INPUT TYPE: Pasted Raw Content Context
Pasted Text Context:
\"\"\"
${pastedContent}
\"\"\"
`;
      } else if (inputType === "website_url") {
        if (!url) {
          const error = new Error("Website URL is required");
          error.status = 400;
          throw error;
        }
        const webData = await liveWorkspaceService.crawlWebsite(url);
        contentInfoText = `
INPUT TYPE: Ingested Website URL
Page Title: ${webData.title}
Page Description: ${webData.description}
Keywords: ${webData.keywords}
Main Content:
\"\"\"
${webData.content}
\"\"\"
`;
      } else if (inputType === "facebook_url") {
        if (!url) {
          const error = new Error("Facebook Page URL is required");
          error.status = 400;
          throw error;
        }
        const fbData = await liveWorkspaceService.crawlFacebookPage(url, facebookSelection);
        contentInfoText = `
INPUT TYPE: Ingested Facebook Page Feed
Facebook Page: ${url}
Post Selection Strategy: ${facebookSelection}
Crawled Post Captions Context:
\"\"\"
${fbData.content}
\"\"\"
`;
      } else if (inputType === "youtube_url") {
        if (!url) {
          const error = new Error("YouTube Video URL is required");
          error.status = 400;
          throw error;
        }
        const ytData = await liveWorkspaceService.crawlYouTubeVideo(url);
        contentInfoText = `
INPUT TYPE: Ingested YouTube Video
Video Title: ${ytData.title}
Video Duration: ${ytData.duration}
Video Description: ${ytData.description}
Video Outline & Transcript Context:
\"\"\"
${ytData.content}
\"\"\"
`;
      } else if (inputType === "blog_url") {
        if (!url) {
          const error = new Error("Blog URL is required");
          error.status = 400;
          throw error;
        }
        const blogData = await liveWorkspaceService.crawlBlog(url);
        contentInfoText = `
INPUT TYPE: Ingested Blog Article
Blog Title: ${blogData.title}
Blog Description: ${blogData.description}
Blog Content:
\"\"\"
${blogData.content}
\"\"\"
`;
      } else {
        const error = new Error(`Unsupported input source type: ${inputType}`);
        error.status = 400;
        throw error;
      }

      const prompt = `You are a world-class creator, SEO copywriter, and growth marketer. 
Write a highly engaging, viral, and polished piece of content in the format of: ${format}.

Content Source Information:
${contentInfoText}

Format Specific Instructions:
- For "LinkedIn": Write a structured, professional post with spaced paragraphs, bullet points, a hook, and a relevant call to action.
- For "Twitter": Write an engaging Twitter/X thread. Separate each tweet in the thread using a clean "---" line delimiter on its own line. Make sure it has a hook thread-starter tweet.
- For "Facebook": Write a community-friendly, highly engaging post with a personal feel.
- For "Instagram": Write an engaging Instagram caption with a strong hook, custom emojis, spaced lines, and a clean tag group.
- For "Hashtags": Generate a list of 30 highly optimized hashtags grouped by popularity (broad, niche, branded).
- For "YT_Titles": Generate 5 highly viral, click-worthy YouTube titles utilizing psychological triggers.
- For "YT_Thumbnail": Generate 5 options of bold, high-contrast, 2-4 word thumbnail text overlays.
- For "YT_Desc": Write an SEO-optimized video description containing a summary, chapters placeholder, links, resources, and hashtags.
- For "YT_Timestamps": Generate a series of smart timestamps/chapters (e.g. 00:00 Intro...) based on the content sections.
- For "YT_Tags": Generate a comma-separated list of 20 video tags for YouTube search.
- For "YT_Community": Write an engaging YouTube Community post update for subscribers.
- For "YT_Script": Write a high-retention video script, containing visual scene descriptions in brackets like [Visual: show chart] and spoken voiceover text.
- For "Blog": Write a comprehensive, SEO-optimized long-form article. Include an H1 Title, Meta Description, URL Slug, Introduction, Section Headings (H2/H3), detailed paragraphs, bullet points, and an ending conclusion with Call to Action.
- For "Meta": Generate an SEO Meta Title, Meta Description (max 160 chars), and clean URL Slug.
- For "FAQ": Generate a list of 5 Frequently Asked Questions (FAQs) with detailed answers about this topic.
- For "Newsletter": Write a compelling, friendly value-packed email newsletter.
- For "Email_Campaign": Write a 3-part email nurture sequence (Welcome, Core Value, Soft Call-To-Action).
- For "CTA": Generate 10 variations of high-conversion Call-To-Action (CTA) buttons/phrases.
- For "Image_Prompt": Write 3 detailed text-to-image prompts describing custom conceptual graphics (e.g. for Midjourney).
- For "Carousel": Write slide-by-slide copy (10 slides) for a carousel post (Slide title, body text, graphic description).
- For "Rewrite": Rewrite the provided content to improve clarity, flow, tone, and overall engagement, while strictly adhering to the selected language.
- For "Translate": Translate the provided content accurately into the selected language, maintaining original tone, formatting, and keeping technical/programming terms in English where appropriate.
- For "Generate_Everything": Generate all the following assets compiled into a single master document separated by clear markdown headers:
  - Viral Titles (5 options)
  - Thumbnail Text (5 options)
  - Video Description & Tags
  - Chapters/Timestamps (based on the summary/transcript)
  - Facebook Post
  - LinkedIn Post
  - Twitter Thread (tweets separated by '---')
  - Blog Article (SEO optimized)
  - Newsletter
  - AI Image Prompt (3 options)

Custom Creator Directives:
"${instructions || "None"}"

Respond with ONLY the generated markdown content. Do not include markdown code block ticks (\`\`\`markdown) or any other conversational preambles/introductory comments. Return only the raw formatted text.`;

      const user = await User.findById(userId);
      let userLanguage = user?.language || "bn";
      let toneInstruction = "";
      let audienceInstruction = "";

      if (inputType === "custom_topic" && customTopic) {
        if (customTopic.tone) {
          toneInstruction = `\n- Tone of Voice: Strictly write in a ${customTopic.tone} tone.`;
        }
        if (customTopic.audience) {
          audienceInstruction = `\n- Target Audience: Write content targeted specifically to ${customTopic.audience}.`;
        }
        if (customTopic.language && customTopic.language !== "Auto Detect") {
          userLanguage = customTopic.language === "Bangla" ? "bn" : "en";
        }
      }

      const finalPrompt = prompt + toneInstruction + audienceInstruction + getLanguageInstruction(userLanguage);

      console.log(`🤖 AI Studio generating ${format} draft...`);
      const ai = await getAIClient(userId);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: finalPrompt,
        config: {
          temperature: 0.7
        }
      });

      let generatedText = response.text;
      if (!generatedText) {
        throw new Error("Gemini returned an empty text response.");
      }

      generatedText = generatedText
        .replace(/^```markdown/, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();

      // Persist output
      const studioOutput = new StudioOutput({
        userId,
        contentId: contentId || null,
        format,
        instructions: instructions || "",
        content: generatedText
      });
      await studioOutput.save();

      return res.status(200).json({
        success: true,
        message: `${format} content generated successfully`,
        data: {
          content: generatedText
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Interactively refines generated drafts using natural chat instructions with history support.
   */
  async refinePost(req, res, next) {
    try {
      const { currentContent, chatPrompt, format, history = [] } = req.body;

      if (!currentContent) {
        const error = new Error("Current content draft is required to perform refinement");
        error.status = 400;
        throw error;
      }
      if (!chatPrompt) {
        const error = new Error("Chat instruction prompt is required");
        error.status = 400;
        throw error;
      }

      const systemInstruction = `You are an elite copy editor and content strategist. 
Your task is to iteratively refine the current draft copy based on the user's chat feedback/instructions.
Always modify and edit the previous draft. Preserve the target format (${format || "general"}) and main subject unless requested otherwise.
Always respond with ONLY the updated draft content. Do not include markdown block ticks or chat introductions.`;

      const formattedHistory = history.map(h => ({
        role: h.role === "assistant" || h.role === "model" ? "model" : "user",
        parts: [{ text: h.text }]
      }));

      // Add a fallback current content context if history is empty
      if (formattedHistory.length === 0) {
        formattedHistory.push(
          { role: "user", parts: [{ text: `Here is the current draft: \n"""\n${currentContent}\n"""` }] },
          { role: "model", parts: [{ text: "Got it. I will refine this draft copy based on your upcoming instructions." }] }
        );
      }

      console.log("🤖 AI Studio refining draft via multi-turn chat...");
      const ai = await getAIClient(req.user?.userId);
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        history: formattedHistory,
        config: {
          systemInstruction,
          temperature: 0.6
        }
      });

      const response = await chat.sendMessage({
        message: chatPrompt
      });

      let refinedText = response.text;
      if (!refinedText) {
        throw new Error("Gemini returned an empty text response.");
      }

      refinedText = refinedText
        .replace(/^```markdown/, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();

      // Persist refined output
      const studioOutput = new StudioOutput({
        userId: req.user.userId,
        contentId: null,
        format: format || "general",
        instructions: chatPrompt,
        content: refinedText
      });
      await studioOutput.save();

      return res.status(200).json({
        success: true,
        message: "Content refined successfully",
        data: {
          content: refinedText
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AIStudioController();
