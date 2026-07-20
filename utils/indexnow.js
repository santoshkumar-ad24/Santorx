const axios = require("axios");


const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const HOST = process.env.SITE_HOST;

async function submitIndexNow(urls) {
    try {
        await axios.post("https://api.indexnow.org/indexnow", {
            host: HOST,
            key: INDEXNOW_KEY,
            keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
            urlList: Array.isArray(urls) ? urls : [urls],
        });

        console.log("✅ Submitted to IndexNow");
    } catch (err) {
        console.error("IndexNow Error:", err.response?.data || err.message);
    }
}

module.exports = submitIndexNow;