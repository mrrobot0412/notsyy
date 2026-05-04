const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { YoutubeTranscript } = require('youtube-transcript');

puppeteer.use(StealthPlugin());

const WATCH_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
};

const tryYoutubeTranscript = async (url) => {
    try {
        console.log(`[YoutubeTranscript] Attempting extraction for: ${url}`);
        const transcript = await YoutubeTranscript.fetchTranscript(url);
        
        if (transcript && transcript.length > 0) {
            const text = transcript.map(t => t.text).join(' ').replace(/\n/g, ' ');
            console.log(`[YoutubeTranscript] Successfully extracted ${text.length} chars`);
            return text;
        }
        
        console.log('[YoutubeTranscript] Transcript array empty');
        return null;
    } catch (error) {
        console.log(`[YoutubeTranscript] Failed: ${error.message}`);
        return null;
    }
};

const tryPuppeteerTranscript = async (url) => {
    console.log(`[Puppeteer] Attempting fallback for: ${url}`);
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--lang=en-US'],
        });
        const page = await browser.newPage();
        await page.setUserAgent(WATCH_HEADERS['User-Agent']);
        await page.setViewport({ width: 1280, height: 1000 });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Scroll a bit to trigger lazy loads
        await page.evaluate(() => window.scrollBy(0, 500));
        await new Promise(r => setTimeout(r, 1000));

        // Step 1: Expand description
        const expandSelectors = ['tp-yt-paper-button#expand', 'button#expand', 'ytd-text-inline-expander button', '#description-inline-expander'];
        for (const sel of expandSelectors) {
            try {
                const btn = await page.$(sel);
                if (btn) {
                    await btn.click();
                    console.log(`[Puppeteer] Expanded description using ${sel}`);
                    await new Promise(r => setTimeout(r, 2000));
                    break;
                }
            } catch (e) {}
        }

        // Step 2: Find and click 'Show transcript'
        const transcriptSelectors = [
            'button[aria-label*="Show transcript"]',
            'ytd-video-description-transcript-section-renderer button',
            'ytd-button-renderer[aria-label*="Transcript"]',
            '#primary-button ytd-button-renderer',
            '#description-inline-expander ytd-button-renderer'
        ];

        let clicked = false;
        for (const selector of transcriptSelectors) {
            try {
                const btn = await page.$(selector);
                if (btn) {
                    await page.evaluate((el) => el.scrollIntoView(), btn);
                    await btn.click();
                    console.log(`[Puppeteer] Clicked transcript button using: ${selector}`);
                    clicked = true;
                    break;
                }
            } catch (e) {}
        }

        if (clicked) {
            // Step 3: Wait for segments to appear
            const segmentSelectors = [
                'ytd-transcript-segment-renderer .segment-text',
                'ytd-transcript-segment-renderer yt-formatted-string',
                '.segment-text',
                '#segments-container yt-formatted-string'
            ];

            let segments = [];
            for (const sel of segmentSelectors) {
                try {
                    console.log(`[Puppeteer] Waiting for selector: ${sel}`);
                    await page.waitForSelector(sel, { timeout: 10000 });
                    segments = await page.evaluate((s) => {
                        return Array.from(document.querySelectorAll(s))
                            .map(el => el.textContent.trim())
                            .filter(Boolean);
                    }, sel);
                    if (segments.length > 0) {
                        console.log(`[Puppeteer] Successfully extracted ${segments.length} segments using: ${sel}`);
                        break;
                    }
                } catch (e) {}
            }

            if (segments.length > 0) {
                return segments.join(' ');
            }
        }

        console.log('[Puppeteer] Could not find transcript text on page');
        return null;
    } catch (error) {
        console.error(`[Puppeteer] Extraction failed: ${error.message}`);
        return null;
    } finally {
        if (browser) await browser.close();
    }
};

const scrapeTranscript = async (url) => {
    if (!url) return null;
    const fastResult = await tryYoutubeTranscript(url);
    if (fastResult) return fastResult;
    return await tryPuppeteerTranscript(url);
};

module.exports = scrapeTranscript;
