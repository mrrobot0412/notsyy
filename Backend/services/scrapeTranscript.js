const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;

// Using the stealth plugin to avoid being detected during scraping
puppeteer.use(StealthPlugin());

// Function to scrape the transcript
const scrapeTranscript = async (url) => {
    const browser = await puppeteer.launch({
        headless: true,
        ignoreDefaultArgs: ['--enable-automation'],
    });

    const page = await browser.newPage();
    let result = null;

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded',timeout:60000 });
        await page.evaluate(() => {
            document.querySelector('button[aria-label*=cookies]')?.click(); // Closing the cookie banner
        });
        await page.waitForSelector("ytd-video-description-transcript-section-renderer button", {
            timeout: 10000,
        });
        await page.evaluate(() => {
            document.querySelector('ytd-video-description-transcript-section-renderer button').click();
        });
        result = await parseTranscript(page); // Parsing the transcript
    } catch (error) {
        console.error('Error during execution:', error);
    } finally {
        await page.close();
        await browser.close();
    }

    return result;
};

// This function will parse the transcript
const parseTranscript = async (page) => {
    await page.waitForSelector('#segments-container', {
        timeout: 100000,
    });
    return page.evaluate(() => {
        return Array.from(document.querySelectorAll('#segments-container yt-formatted-string')).map(
            (element) => element.textContent?.trim()
        ).join("\n");
    });
};

module.exports = scrapeTranscript; // Export the function
