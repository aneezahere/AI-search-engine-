import { Groq } from "groq-sdk";
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!
});

async function scrapeUrl(url: string): Promise<string> {
  try {
    const browser = await puppeteer.launch({
      headless: true
    });
    const page = await browser.newPage();
    await page.goto(url);
    const content = await page.content();
    await browser.close();

    const $ = cheerio.load(content);
    // Remove scripts, styles, and other non-content elements
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('footer').remove();
    
    // Get the main content
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return text;
  } catch (error) {
    console.error('Error scraping URL:', error);
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Check if message contains URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.match(urlRegex) || [];
    
    let context = '';
    if (urls.length > 0) {
      // Scrape content from all URLs
      const contents = await Promise.all(urls.map(scrapeUrl));
      context = contents.join('\n\n');
    }

    // Create prompt with context if available
    const prompt = context 
      ? `Context from provided URLs:\n${context}\n\nUser question: ${message}\nPlease answer based on the context provided and format your response with clear sections and bullet points for readability.`
      : message;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant that answers questions accurately. Structure your responses as follows:

1. Use clear section breaks with newlines between sections
2. Format main headings as: # Heading
3. Format subheadings as: ## Subheading
4. Use proper bullet points with actual bullet characters:
   • Use a bullet point for each new item
   • Include spacing between bullet points
5. Use proper numbered lists when appropriate:
   1. First item
   2. Second item
6. Include a "Sources:" section at the end

Make sure to include empty lines between sections for readability.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.5,
      max_tokens: 1024,
    });

    return Response.json({
      message: completion.choices[0].message.content
    });

  } catch (error) {
    console.error('Error in chat route:', error);
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}