process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');
const jsdom = require('jsdom');
const mongoose = require('mongoose');
const { JSDOM } = jsdom;
const { URL } = require('url'); // for URL normalization

// ------------------- MongoDB Setup -------------------
mongoose.connect('mongodb://127.0.0.1:27017/crawlixDB')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const pageSchema = new mongoose.Schema({
    url: { type: String, unique: true },
    title: String,
    content: String,
    date: { type: Date, default: Date.now }
});

const Page = mongoose.model('Page', pageSchema);

// ------------------- Crawler -------------------
const visitedUrls = new Set();
const baseDomain = 'techcrunch.com'; // Domain to crawl
const maxPages = 20; // Limit to avoid infinite crawling

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Normalize URL to absolute
function normalizeUrl(link, base) {
    try {
        // if link starts with //, add https:
        if (link.startsWith('//')) return 'https:' + link;
        // if link starts with http/https, leave it
        if (link.startsWith('http')) return link;
        // relative path
        return new URL(link, base).href;
    } catch (err) {
        return null;
    }
}

async function crawl(url) {
    if (visitedUrls.has(url) || visitedUrls.size >= maxPages) return;
    visitedUrls.add(url);

    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
            }
        });

        const dom = new JSDOM(res.data);
        const title = dom.window.document.querySelector('title')?.textContent || 'No Title';

        // Save page to MongoDB
        const existing = await Page.findOne({ url });
        if (existing) {
            console.log('Already saved:', url);
        } else {
            const page = new Page({
                url,
                title,
                content: res.data
            });
            await page.save();
            console.log('Page saved:', title, 'with _id:', page._id);
        }

        // Crawl internal links
        const links = Array.from(dom.window.document.querySelectorAll('a'))
            .map(a => normalizeUrl(a.href, url))
            .filter(link => link && link.includes(baseDomain)); // only same domain links

        for (const link of links) {
            if (!visitedUrls.has(link)) {
                await sleep(500); // small delay to avoid blocking
                await crawl(link);
            }
        }

    } catch (err) {
        if (err.response) {
            console.log(`Error crawling ${url}: Request failed with status code ${err.response.status}`);
        } else {
            console.log(`Error crawling ${url}:`, err.message);
        }
    }
}

// ------------------- Start Crawling -------------------
(async () => {
    await crawl(`https://${baseDomain}`);
    console.log('Crawling finished');
    mongoose.connection.close();
})();