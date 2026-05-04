const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');

// Using the stealth plugin to avoid being detected during scraping
puppeteer.use(StealthPlugin());

const WATCH_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
};

const extractJsonAssignment = (html, assignmentName) => {
    const assignmentIndex = html.indexOf(assignmentName);
    if (assignmentIndex === -1) {
        return null;
    }

    const startIndex = html.indexOf('{', assignmentIndex);
    if (startIndex === -1) {
        return null;
    }

    let depth = 0;
    let inString = false;
    let isEscaped = false;

    for (let index = startIndex; index < html.length; index += 1) {
        const char = html[index];

        if (inString) {
            if (isEscaped) {
                isEscaped = false;
                continue;
            }

            if (char === '\\') {
                isEscaped = true;
                continue;
            }

            if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === '{') {
            depth += 1;
        } else if (char === '}') {
            depth -= 1;
            if (depth === 0) {
                return html.slice(startIndex, index + 1);
            }
        }
    }

    return null;
};

const decodeHtml = (text) => {
    if (!text) return '';

    return text
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
};

const extractVideoId = (url) => {
    const parsed = new URL(url);
    return parsed.searchParams.get('v');
};

const tryTimedTextTranscript = async (url) => {
    const { data: html } = await axios.get(url, {
        headers: WATCH_HEADERS,
        timeout: 60000,
    });

    const playerResponseJson = extractJsonAssignment(html, 'ytInitialPlayerResponse =');
    if (!playerResponseJson) {
        return null;
    }

    let playerResponse;
    try {
        playerResponse = JSON.parse(playerResponseJson);
    } catch (error) {
        return null;
    }

    const captionTracks =
        playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

    if (!captionTracks.length) {
        return null;
    }

    const preferredTrack =
        captionTracks.find((track) => track.languageCode === 'en') ||
        captionTracks.find((track) => track.kind !== 'asr') ||
        captionTracks[0];

    if (!preferredTrack?.baseUrl) {
        return null;
    }

    const transcriptUrl = preferredTrack.baseUrl.includes('fmt=')
        ? preferredTrack.baseUrl
        : `${preferredTrack.baseUrl}&fmt=srv3`;

    const { data: transcriptXml } = await axios.get(transcriptUrl, {
        headers: WATCH_HEADERS,
        timeout: 60000,
    });

    const segments = Array.from(
        transcriptXml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g),
        (match) => decodeHtml(match[1]).replace(/\s+/g, ' ').trim()
    ).filter(Boolean);

    return segments.length ? segments.join('\n') : null;
};

const tryPuppeteerTranscript = async (url) => {
    const browser = await puppeteer.launch({
        headless: true,
        ignoreDefaultArgs: ['--enable-automation'],
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.evaluate(() => {
            document.querySelector('button[aria-label*=cookies]')?.click();
        });

        const transcriptButtonSelectors = [
            'button[aria-label*="Show transcript"]',
            'ytd-video-description-transcript-section-renderer button',
            'tp-yt-paper-button[aria-label*="transcript"]',
        ];

        let clicked = false;
        for (const selector of transcriptButtonSelectors) {
            const button = await page.$(selector);
            if (button) {
                await button.click();
                clicked = true;
                break;
            }
        }

        if (!clicked) {
            return null;
        }

        return await parseTranscript(page);
    } finally {
        await page.close();
        await browser.close();
    }
};

// Function to scrape transcript
const scrapeTranscript = async (url) => {
    try {
        const videoId = extractVideoId(url);
        if (!videoId) {
            return null;
        }

        const timedTextTranscript = await tryTimedTextTranscript(url);
        if (timedTextTranscript) {
            return timedTextTranscript;
        }

        return await tryPuppeteerTranscript(url);
    } catch (error) {
        console.error('Error during execution:', error);
        return null;
    }
};

// This function parses transcript when fallback browser path used
const parseTranscript = async (page) => {
    await page.waitForSelector('#segments-container, ytd-transcript-segment-list-renderer', {
        timeout: 30000,
    });

    return page.evaluate(() => {
        const selectors = [
            '#segments-container yt-formatted-string',
            'ytd-transcript-segment-renderer yt-formatted-string.segment-text',
        ];

        for (const selector of selectors) {
            const elements = Array.from(document.querySelectorAll(selector))
                .map((element) => element.textContent?.trim())
                .filter(Boolean);

            if (elements.length) {
                return elements.join('\n');
            }
        }

        return null;
    });
};

module.exports = scrapeTranscript;
