const fs = require('fs');
const path = require('path');

const INDEX_URL = "https://googlefonts.github.io/noto-emoji-animation/data/api.json";
const BASE_ASSET_URL = "https://fonts.gstatic.com/s/e/notoemoji/latest/{codepoint}/lottie.json";
const OUTPUT_DIR = path.join(__dirname, 'animated_emojis_lottie');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadLottieEmojis() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log("Fetching the official emoji list from Google...");
    try {
        // High-compatibility request headers explicitly asking for JSON formats
        const response = await fetch(INDEX_URL, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        // Peek at raw content to prevent crash loops if HTML still breaches
        const rawText = await response.text();
        if (rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html')) {
            throw new Error("Server returned HTML block page instead of raw JSON data.");
        }

        const data = JSON.parse(rawText);
        const icons = data.icons || [];
        const totalEmojis = icons.length;
        
        console.log(`Found ${totalEmojis} animated emojis.\n`);

        for (let i = 0; i < totalEmojis; i++) {
            const icon = icons[i];
            const codepoint = icon.codepoint;
            
            let fileName = codepoint;
            if (icon.tags) {
                const tagString = Array.isArray(icon.tags) ? icon.tags[0] : String(icon.tags);
                fileName = tagString.replace(/:/g, '').trim().replace(/\s+/g, '_');
            }
            if (!fileName) fileName = codepoint;

            const assetUrl = BASE_ASSET_URL.replace('{codepoint}', codepoint);
            const filePath = path.join(OUTPUT_DIR, `${fileName}.json`);

            console.log(`[${i + 1}/${totalEmojis}] Downloading ${fileName}...`);

            try {
                const assetResponse = await fetch(assetUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
                    }
                });
                
                if (assetResponse.ok) {
                    const jsonContent = await assetResponse.json();
                    fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2));
                } else {
                    console.warn(`   ⚠️ Not available for ${fileName} (Status: ${assetResponse.status})`);
                }
            } catch (err) {
                console.error(`   ❌ Error downloading ${fileName}:`, err.message);
            }

            // Pacing delay to bypass aggressive concurrent rate limits
            await sleep(100);
        }

        console.log(`\n🎉 All done! Check your files inside: ${OUTPUT_DIR}`);

    } catch (error) {
        console.error("❌ Process failed:", error.message);
    }
}

downloadLottieEmojis();
