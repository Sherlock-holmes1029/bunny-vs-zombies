import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\PC\\.gemini\\antigravity-ide\\brain\\28ad44b3-e09c-4ce1-8718-1d6606b1b556';

async function run() {
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1000,600'
        ]
    });

    const page = await browser.newPage();
    
    // Samsung Galaxy A13 Landscape Viewport
    await page.setViewport({
        width: 854,
        height: 384,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });

    console.log('Navigating to http://localhost:5174/ ...');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // 1. Main Menu Landscape
    console.log('Capturing Main Menu Landscape...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a13_landscape_main_menu.png') });

    // 2. Click Play Wave Survival
    console.log('Starting Wave Survival...');
    await page.evaluate(() => {
        window.startMode('survival');
    });
    await new Promise(r => setTimeout(r, 1200));

    // In-game HUD
    console.log('Capturing In-Game HUD Landscape...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a13_landscape_ingame_hud.png') });

    // Measure HUD positions and potential collisions
    const hudMetrics = await page.evaluate(() => {
        const stats = document.getElementById('hud-left-stats')?.getBoundingClientRect();
        const joystick = document.getElementById('joystick-zone')?.getBoundingClientRect();
        const joystickBase = document.getElementById('joystick-base')?.getBoundingClientRect();
        const weapons = document.getElementById('hud-weapons')?.getBoundingClientRect();
        const pauseBtn = document.querySelector('button[title="Pause Game"]')?.getBoundingClientRect();
        const ammo = document.getElementById('hud-ammo-container')?.getBoundingClientRect();
        const combatCluster = document.querySelector('#mobile-ui .absolute.bottom-6.right-6')?.getBoundingClientRect();
        const ultBtn = document.getElementById('m-ultimate')?.getBoundingClientRect();
        const interactBtn = document.getElementById('m-interact')?.getBoundingClientRect();
        const deployDrawer = document.getElementById('m-deploy-drawer')?.getBoundingClientRect();

        return {
            window: { width: window.innerWidth, height: window.innerHeight },
            stats,
            joystick,
            joystickBase,
            weapons,
            pauseBtn,
            ammo,
            combatCluster,
            ultBtn,
            interactBtn,
            deployDrawer
        };
    });
    console.log('HUD Metrics:', JSON.stringify(hudMetrics, null, 2));

    // 3. Open Build Drawer
    console.log('Opening Build Drawer...');
    await page.evaluate(() => {
        window.toggleDeployDrawer();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a13_landscape_build_drawer.png') });

    // Measure drawer position when active
    const drawerMetrics = await page.evaluate(() => {
        const drawer = document.getElementById('m-deploy-drawer')?.getBoundingClientRect();
        const combatCluster = document.querySelector('#mobile-ui .absolute.bottom-6.right-6')?.getBoundingClientRect();
        const ult = document.getElementById('m-ultimate')?.getBoundingClientRect();
        const weapons = document.getElementById('hud-weapons')?.getBoundingClientRect();
        return { drawer, combatCluster, ult, weapons };
    });
    console.log('Drawer Metrics:', JSON.stringify(drawerMetrics, null, 2));

    // 4. Open Armory Shop
    console.log('Opening Armory Shop...');
    await page.evaluate(() => {
        window.openSandboxShop();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a13_landscape_shop_all.png') });

    // Click tabs
    console.log('Testing Shop Tabs...');
    await page.evaluate(() => window.setShopTab('weapons'));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a13_landscape_shop_weapons.png') });

    await page.evaluate(() => window.setShopTab('defenses'));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a13_landscape_shop_defenses.png') });

    await page.evaluate(() => window.setShopTab('loadout'));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a13_landscape_shop_loadout.png') });

    // Check shop scrolling and footer
    const shopMetrics = await page.evaluate(() => {
        const header = document.querySelector('#ui-shop > div:first-child')?.getBoundingClientRect();
        const scrollArea = document.querySelector('#ui-shop > div:nth-child(2)')?.getBoundingClientRect();
        const footer = document.querySelector('#ui-shop > div:last-child')?.getBoundingClientRect();
        const items = document.querySelectorAll('.shop-card');
        const firstItem = items[0]?.getBoundingClientRect();
        const lastItem = items[items.length - 1]?.getBoundingClientRect();
        return { header, scrollArea, footer, itemCount: items.length, firstItem, lastItem };
    });
    console.log('Shop Metrics:', JSON.stringify(shopMetrics, null, 2));

    // 5. Resume and open Pause Menu
    console.log('Testing Pause Menu...');
    await page.evaluate(() => {
        window.onShopActionClick(); // Closes shop or resumes
        window.togglePause();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a13_landscape_pause_menu.png') });

    // 6. Test with Android Chrome Address Bar (854 x 348)
    console.log('Testing tighter Android Chrome Landscape (854x348)...');
    await page.setViewport({
        width: 854,
        height: 348,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
        if (window.isPaused) window.togglePause(); // resume game
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a13_landscape_348_ingame.png') });

    // Open shop in 854x348
    await page.evaluate(() => {
        window.openSandboxShop();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a13_landscape_348_shop.png') });

    // 7. Test Perk Selection in landscape
    console.log('Testing Perk Selection modal in landscape...');
    await page.evaluate(() => {
        window.onShopActionClick();
        window.showPerks();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a13_landscape_perks.png') });

    // 8. Test Game Over modal in landscape
    console.log('Testing Game Over modal in landscape...');
    await page.evaluate(() => {
        document.getElementById('ui-perks')?.classList.add('hidden');
        window.showGameOver();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a13_landscape_gameover.png') });

    console.log('All tests completed successfully!');
    await browser.close();
}

run().catch(err => {
    console.error('Error running audit:', err);
    process.exit(1);
});
