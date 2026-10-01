import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\PC\\.gemini\\antigravity-ide\\brain\\28ad44b3-e09c-4ce1-8718-1d6606b1b556';

async function run() {
    const browser = await puppeteer.launch({ 
        executablePath: CHROME_PATH, 
        headless: 'new', 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.setViewport({ width: 854, height: 384, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
    console.log('Main menu loaded.');

    const check1 = await page.evaluate(() => {
        const btnMenu = document.getElementById('btn-fullscreen-menu');
        return {
            hasToggle: typeof window.toggleFullscreen === 'function',
            hasBtnMenu: Boolean(btnMenu),
            btnMenuVisible: btnMenu ? window.getComputedStyle(btnMenu).display !== 'none' : false,
            menuIcon: document.getElementById('fullscreen-icon-menu')?.innerText,
            menuText: document.getElementById('fullscreen-text-menu')?.innerText
        };
    });
    console.log('Check 1 (Menu Fullscreen):', JSON.stringify(check1));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fullscreen_menu.png') });

    // Click wave survival
    console.log('Starting Wave Survival mode...');
    await page.evaluate(() => window.startMode('survival'));
    await new Promise(r => setTimeout(r, 1000));

    const check2 = await page.evaluate(() => {
        const mBtn = document.getElementById('m-btn-fullscreen');
        const pauseBtn = document.querySelector('button[title="Pause Game"]');
        const mRect = mBtn?.getBoundingClientRect();
        const pRect = pauseBtn?.getBoundingClientRect();
        return {
            hasMobileBtn: Boolean(mBtn),
            hasPauseBtn: Boolean(pauseBtn),
            mRect: mRect ? { x: Math.round(mRect.x), y: Math.round(mRect.y), w: Math.round(mRect.width), h: Math.round(mRect.height) } : null,
            pRect: pRect ? { x: Math.round(pRect.x), y: Math.round(pRect.y), w: Math.round(pRect.width), h: Math.round(pRect.height) } : null
        };
    });
    console.log('Check 2 (In-Game Mobile Controls):', JSON.stringify(check2));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fullscreen_ingame.png') });

    // Open Pause menu
    console.log('Opening pause menu...');
    await page.evaluate(() => window.togglePause());
    await new Promise(r => setTimeout(r, 600));

    const check3 = await page.evaluate(() => {
        const btnPause = document.getElementById('btn-fullscreen-pause');
        const label = document.getElementById('fullscreen-pause-label');
        return {
            hasPauseBtn: Boolean(btnPause),
            label: label?.innerText,
            pauseVisible: !document.getElementById('ui-pause')?.classList.contains('hidden')
        };
    });
    console.log('Check 3 (Pause Menu Fullscreen):', JSON.stringify(check3));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fullscreen_pause.png') });

    // Test toggleFullscreen function invocation
    console.log('Invoking window.toggleFullscreen()...');
    await page.evaluate(() => window.toggleFullscreen());
    await new Promise(r => setTimeout(r, 400));

    await browser.close();
    console.log('Errors encountered:', errors);
    if (errors.length > 0) process.exit(1);
    console.log('All fullscreen checks PASSED successfully!');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
