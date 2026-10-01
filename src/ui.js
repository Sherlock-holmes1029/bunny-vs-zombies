import { gameState, isMobileCheck } from './state.js';
import { GameState, MAX_ACTIVE_TURRETS } from './constants.js';
import { platforms } from './physics.js';
import { Turret } from './entities/Turret.js';
import { Companion } from './entities/Companion.js';

export const ALL_PERKS = [
    { name: "Vampire", desc: "+2 HP Life-steal per kill", apply: () => gameState.player.perks.lifesteal += 2, color: "text-red-500" },
    { name: "Juiced", desc: "+50 Max HP & Full Heal", apply: () => { gameState.player.maxHp += 50; gameState.player.hp = gameState.player.maxHp; }, color: "text-green-500" },
    { name: "Haste", desc: "+20% Move Speed", apply: () => gameState.player.perks.speedMult += 0.2, color: "text-blue-400" },
    { name: "Fast Hands", desc: "+35% Reload Speed", apply: () => gameState.player.perks.reloadMult *= 0.65, color: "text-yellow-400" },
    { name: "FMJ", desc: "+20% Flat Damage", apply: () => gameState.player.perks.dmgMult += 0.2, color: "text-gray-300" },
    { name: "Pet Bot", desc: "A drone that auto-shoots", apply: () => { gameState.companions.push(new Companion(gameState.player, gameState.companions.length)); }, color: "text-cyan-400" },
    { name: "Bot: Overclock", desc: "+100% Drone Fire Rate", apply: () => gameState.player.perks.droneRate *= 0.5, color: "text-cyan-300" },
    { name: "Bot: Cannon", desc: "+150% Drone Damage", apply: () => gameState.player.perks.droneDmg += 1.5, color: "text-cyan-500" },
    { name: "Bot: Split-Shot", desc: "Drone fires an extra bullet", apply: () => gameState.player.perks.droneMulti += 1, color: "text-blue-300" }
];

export const SHOP_ITEMS = [
    { id: 'pistol', name: 'Tactical Pistol', slot: 0, baseCost: 0, type: 'semi', dmg: 40, rate: 0.12, ammo: 30, reload: 0.8, color: '#9ca3af', desc: 'Starting sidearm. Highly agile with quick reload.' },
    { id: 'm16', name: 'M16 Assault', slot: 0, baseCost: 500, type: 'auto', dmg: 22, rate: 0.12, ammo: 30, reload: 1.5, color: '#f87171', desc: 'Balanced military rifle with continuous automatic fire.' },
    { id: 'ak47', name: 'AK-47', slot: 0, baseCost: 750, type: 'auto', dmg: 35, rate: 0.09, ammo: 30, reload: 1.6, color: '#ef4444', desc: 'High-caliber heavy assault rifle with exceptional punch.' },
    { id: 'shotgun', name: 'Combat Shotgun', slot: 1, baseCost: 800, type: 'semi', dmg: 18, rate: 0.8, ammo: 6, reload: 2.0, color: '#fb923c', desc: 'Devastating spread of 6 buckshot pellets for close-quarters.' },
    { id: 'sniper', name: 'Sniper Rifle', slot: 1, baseCost: 1100, type: 'semi', dmg: 180, rate: 1.5, ammo: 5, reload: 2.2, color: '#a855f7', desc: 'Ultra high-velocity round. 2x headshot damage obliterates elites.' },
    { id: 'minigun', name: 'Vulcan Minigun', slot: 1, baseCost: 1600, type: 'auto', dmg: 26, rate: 0.05, ammo: 200, reload: 3.5, color: '#f59e0b', desc: 'Rotary multi-barrel machine gun. Accelerates up to 22 rds/sec with reverse recoil thrust.' },
    { id: 'railgun', name: 'Plasma Railgun', slot: 1, baseCost: 1800, type: 'semi', dmg: 350, rate: 1.8, ammo: 4, reload: 2.8, color: '#22d3ee', desc: 'Electromagnetic accelerator beam. Instantly pierces through all enemies and platforms.' },
    { id: 'cluster_launcher', name: 'Cluster Launcher', slot: 1, baseCost: 1400, type: 'semi', dmg: 140, rate: 1.4, ammo: 5, reload: 2.5, color: '#f97316', desc: 'Lobs heavy explosive shells that detonate and disperse 4 bouncing cluster bomblets.' },
    { id: 'cryo_ray', name: 'Cryo Freeze Ray', slot: 2, baseCost: 1300, type: 'auto', dmg: 18, rate: 0.05, ammo: 100, reload: 2.5, color: '#38bdf8', range: 0.6, desc: 'Streams liquid nitrogen to freeze hordes solid. Frozen enemies shatter into lethal shrapnel.' },
    { id: 'rpg', name: 'RPG-7 Rocket', slot: 1, baseCost: 1500, type: 'semi', dmg: 150, rate: 1.5, ammo: 1, reload: 2.5, color: '#4ade80', desc: 'Fires explosive warhead causing massive area-of-effect detonations.' },
    { id: 'katana', name: 'Energy Katana', slot: 2, baseCost: 1000, type: 'melee', dmg: 80, rate: 0.5, ammo: 1, reload: 0, color: '#38bdf8', range: 120, desc: 'Sharp blade that deflects enemy projectiles back at 1.5x speed.' },
    { id: 'flamethrower', name: 'Flamethrower', slot: 1, baseCost: 1200, type: 'auto', dmg: 24, rate: 0.05, ammo: 100, reload: 3.0, color: '#fbbf24', range: 0.5, desc: 'Streams piercing fire applying burning damage over time.' },
    { id: 'turret', name: 'Sentry Gun', slot: 'item', baseCost: 300, isItem: true, desc: "Automatic rapid-fire turret defending nearby perimeter. Deploy unlimited sentries." },
    { id: 'turret_frost', name: 'Frost Turret', slot: 'item', baseCost: 450, isItem: true, desc: "Fires cryo-beams that freeze and slow groups of zombies by 50%." },
    { id: 'turret_tesla', name: 'Tesla Coil', slot: 'item', baseCost: 600, isItem: true, desc: "Discharges high-voltage chain-lightning arcing between 5+ targets." },
    { id: 'landmine', name: 'Proximity Landmine', slot: 'item', baseCost: 100, isItem: true, isLandmine: true, desc: 'Deployable explosive plate [C]. Detonates with devastating vertical force when stepped on.' },
    { id: 'beacon', name: 'Nano-Repair Beacon', slot: 'item', baseCost: 550, isItem: true, isBeacon: true, desc: 'Deployable support pylon. Regenerates player vitality and shields while auto-repairing turrets.' },
    { id: 'barricade', name: 'Wood Barricade', slot: 'item', baseCost: 120, isItem: true, isBarricade: true, desc: "Deployable fortification [F]. Absorbs zombie attacks and protects turrets." }
];

// Reference update variables to adjust loop updates
export let lastTimeRef = { value: performance.now() };

export function updateDeviceUI() {
    const isMobile = navigator.maxTouchPoints > 0 || window.innerWidth <= 768;
    const mUI = document.getElementById('mobile-ui');
    if (isMobile && (gameState.currentState === GameState.PLAYING || gameState.currentState === GameState.PAUSED)) {
        mUI.classList.remove('hidden');
    } else {
        mUI.classList.add('hidden');
    }
}

export function togglePause() {
    if (gameState.gameMode === 'sandbox') {
        if (gameState.currentState === GameState.PLAYING) {
            showShop();
            return;
        } else if (gameState.currentState === GameState.SHOP) {
            resumeFromShop();
            return;
        }
    }

    if(gameState.currentState === GameState.PLAYING) {
        gameState.currentState = GameState.PAUSED;
        document.getElementById('ui-pause').classList.remove('hidden');
        if (gameState.player) gameState.player.reloading = false;
        mouseDownReset();
    } else if(gameState.currentState === GameState.PAUSED) {
        gameState.currentState = GameState.PLAYING;
        document.getElementById('ui-pause').classList.add('hidden');
        lastTimeRef.value = performance.now(); 
    }
    updateDeviceUI();
}

function mouseDownReset() {
    // Used to clean input bindings when entering menus
    import('./input.js').then(m => {
        m.mouse.down = false;
        m.mobileState.isMobileShooting = false;
        for(let k in m.keys) m.keys[k] = false;
    });
}

export function updateHUD() {
    const player = gameState.player;
    if(!player) return;
    document.getElementById('hud-hp').innerText = `${Math.floor(player.hp)}/${player.maxHp}`;
    document.getElementById('hud-hp-bar').style.width = `${Math.max(0, (player.hp/player.maxHp)*100)}%`;
    document.getElementById('hud-score').innerText = gameState.score;
    
    // Mode-specific top left stats
    let isSandbox = gameState.gameMode === 'sandbox';
    let missionTitleEl = document.getElementById('hud-mission-title');
    let wavePrefixEl = document.getElementById('hud-wave-prefix');
    let waveEl = document.getElementById('hud-wave');
    let moneyEl = document.getElementById('hud-money');
    let shopBtn = document.getElementById('hud-sandbox-shop-btn');

    if (isSandbox) {
        if (missionTitleEl) missionTitleEl.innerText = "Sandbox Mayhem";
        if (wavePrefixEl) wavePrefixEl.innerText = "TIME";
        let totalSec = Math.floor(gameState.sandboxTime || 0);
        let mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
        let secs = String(totalSec % 60).padStart(2, '0');
        if (waveEl) waveEl.innerText = `${mins}:${secs}`;
        if (moneyEl) moneyEl.innerText = '∞';
        if (shopBtn) shopBtn.classList.remove('hidden');
    } else {
        if (missionTitleEl) missionTitleEl.innerText = "Survival Mission";
        if (wavePrefixEl) wavePrefixEl.innerText = "WAVE";
        if (waveEl) waveEl.innerText = gameState.currentWave;
        if (moneyEl) moneyEl.innerText = gameState.money;
        if (shopBtn) shopBtn.classList.add('hidden');
    }
    
    // Format turrets to show inventory and active deployment on map
    let activeTurrets = gameState.turrets.length;
    let turretInv = player.turretInventory || 0;
    let turretEl = document.getElementById('hud-turrets');
    if (turretEl) {
        let activeLabel = Number.isFinite(MAX_ACTIVE_TURRETS) ? `(${activeTurrets}/${MAX_ACTIVE_TURRETS})` : `(${activeTurrets} active)`;
        turretEl.innerHTML = `${turretInv} <span class="text-[10px] text-gray-400 font-normal">${activeLabel}</span>`;
    }

    let landmineEl = document.getElementById('hud-landmines');
    if (landmineEl) landmineEl.innerText = player.landmineInventory || 0;

    updateBossBar();

    document.getElementById('hud-barricades').innerText = player.barricadeInventory || 0;
    document.getElementById('hud-shield').innerText = `${Math.floor(player.shield)}/${player.maxShield}`;
    document.getElementById('hud-shield-bar').style.width = `${Math.max(0, (player.shield/player.maxShield)*100)}%`;

    const isMobile = isMobileCheck();
    let adrPercent = (player.adrenaline / player.adrenalineMax) * 100;
    if (gameState.adrenalineActive) {
        document.getElementById('hud-adrenaline').innerText = `${Math.ceil(gameState.adrenalineTimer)}s`;
        document.getElementById('hud-adrenaline-bar').style.width = `${(gameState.adrenalineTimer / 8.0) * 100}%`;
        document.getElementById('adrenaline-label').innerText = "RAGE ACTIVE!";
        document.getElementById('adrenaline-label').className = "text-fuchsia-400 animate-pulse font-black";
        document.getElementById('adrenaline-bullet').className = "w-2 h-2 rounded-full bg-fuchsia-400 animate-ping";
    } else {
        document.getElementById('hud-adrenaline').innerText = `${Math.floor(adrPercent)}%`;
        document.getElementById('hud-adrenaline-bar').style.width = `${adrPercent}%`;
        if (adrPercent >= 100) {
            document.getElementById('adrenaline-label').innerText = isMobile ? "RUSH READY" : "RUSH READY (Q)";
            document.getElementById('adrenaline-label').className = "text-amber-400 animate-bounce font-black";
            document.getElementById('adrenaline-bullet').className = "w-2 h-2 rounded-full bg-amber-400 animate-pulse";
        } else {
            document.getElementById('adrenaline-label').innerText = isMobile ? "Adrenaline" : "Adrenaline (Q)";
            document.getElementById('adrenaline-label').className = "";
            document.getElementById('adrenaline-bullet').className = "w-2 h-2 rounded-full bg-purple-500 animate-pulse";
        }
    }

    // Update Mobile Deployable Drawer Badges
    const updateBadge = (id, count) => {
        let el = document.getElementById(id);
        if (el) el.innerText = count;
    };
    updateBadge('m-badge-turret', turretInv);
    updateBadge('m-badge-barricade', player.barricadeInventory || 0);
    updateBadge('m-badge-mine', player.landmineInventory || 0);
    updateBadge('m-badge-beacon', player.beaconInventory || 0);

    // Update Mobile Ultimate Button
    const mUltBtn = document.getElementById('m-ultimate');
    const mUltPct = document.getElementById('m-ultimate-pct');
    if (mUltBtn) {
        if (gameState.adrenalineActive) {
            mUltBtn.classList.add('ult-ready');
            if (mUltPct) mUltPct.innerText = `${Math.ceil(gameState.adrenalineTimer)}s`;
        } else if (adrPercent >= 100) {
            mUltBtn.classList.add('ult-ready');
            if (mUltPct) mUltPct.innerText = "READY";
        } else {
            mUltBtn.classList.remove('ult-ready');
            if (mUltPct) mUltPct.innerText = `${Math.floor(adrPercent)}%`;
        }
    }

    // Update Mobile Grapple Button State
    const mGrappleBtn = document.getElementById('m-grapple');
    if (mGrappleBtn) {
        if (player.grapple && player.grapple.active) {
            mGrappleBtn.classList.add('bg-cyan-500', 'text-gray-950', 'border-white', 'shadow-[0_0_15px_rgba(34,211,238,0.8)]');
            mGrappleBtn.classList.remove('bg-cyan-950/60', 'text-cyan-300');
        } else {
            mGrappleBtn.classList.remove('bg-cyan-500', 'text-gray-950', 'border-white', 'shadow-[0_0_15px_rgba(34,211,238,0.8)]');
            mGrappleBtn.classList.add('bg-cyan-950/60', 'text-cyan-300');
        }
    }

    // Update Mobile Contextual Interact Button
    const mInteractBtn = document.getElementById('m-interact');
    const mInteractLabel = document.getElementById('m-interact-label');
    if (mInteractBtn && mInteractLabel) {
        let nearbyObj = null;
        let hintRange = 70;
        let px = player.x + player.width/2;
        let py = player.y + player.height/2;

        for (let b of gameState.barricades) {
            let d = Math.hypot((b.x + 20) - px, (b.y + 20) - py);
            if (d < hintRange) {
                nearbyObj = b;
                break;
            }
        }
        if (!nearbyObj) {
            for (let t of gameState.turrets) {
                let d = Math.hypot((t.x + 10) - px, (t.y + 15) - py);
                if (d < hintRange) {
                    nearbyObj = t;
                    break;
                }
            }
        }

        if (nearbyObj) {
            mInteractBtn.classList.remove('opacity-0', 'scale-75', 'pointer-events-none');
            mInteractBtn.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
            mInteractLabel.innerText = nearbyObj.isBarricade ? 'REPAIR' : 'UPGRADE';
        } else {
            mInteractBtn.classList.add('opacity-0', 'scale-75', 'pointer-events-none');
            mInteractBtn.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
        }
    }

    let w = player.getWeapon();
    let ammoCurrEl = document.getElementById('hud-ammo-current');
    let ammoMaxEl = document.getElementById('hud-ammo-max');
    if(w) {
        if(w.id === 'katana') {
            if (ammoCurrEl) ammoCurrEl.innerText = 'INF';
            if (ammoMaxEl) ammoMaxEl.innerText = '';
        } else {
            let safeAmmo = (w.ammo === undefined || isNaN(w.ammo)) ? (w.maxAmmo || 30) : w.ammo;
            if (ammoCurrEl) {
                ammoCurrEl.innerText = safeAmmo;
                ammoCurrEl.className = w.reloading ? 'text-red-500 animate-pulse' : 'text-yellow-400';
            }
            if (ammoMaxEl) ammoMaxEl.innerText = w.maxAmmo || 30;
        }
    } else {
        if (ammoCurrEl) ammoCurrEl.innerText = '0';
        if (ammoMaxEl) ammoMaxEl.innerText = '0';
    }

    const wContainer = document.getElementById('hud-weapons');
    wContainer.innerHTML = '';
    for(let i=0; i<4; i++) {
        let slotW = player.weapons[i];
        let active = player.currentWeaponIndex === i;
        let slotClasses = isMobile
            ? 'w-10 h-10 rounded-xl text-[9px]'
            : 'w-14 h-14 md:w-16 md:h-16 rounded-2xl text-[10px] md:text-[12px]';
        let html = `<div onclick="window.setWeaponIndex(${i})" class="weapon-slot ${slotClasses} border flex items-center justify-center font-bold flex-col transition-all duration-200 ${active ? 'bg-green-500/20 border-green-400 text-green-300 scale-105 shadow-[0_0_16px_rgba(34,197,94,0.4)] z-10' : 'bg-gray-900/70 border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'}">
            <div class="${isMobile ? 'text-[8px]' : 'text-[9px] md:text-[10px]'} uppercase tracking-wider mb-0.5 opacity-60">S${i+1}</div>`;
        if(slotW) html += `<div class="${isMobile ? 'text-[9px]' : 'text-xs md:text-sm'} font-black truncate max-w-[90%]">${slotW.name.substring(0, 5)}</div>`;
        else html += `<div class="${isMobile ? 'text-xs' : 'text-sm'} font-light opacity-30">-</div>`;
        html += `</div>`;
        wContainer.innerHTML += html;
    }

    const comboPanel = document.getElementById('hud-combo-panel');
    if (comboPanel) {
        if (gameState.comboCount > 0) {
            comboPanel.classList.remove('opacity-0');
            document.getElementById('hud-combo-count').innerText = gameState.comboCount;
            document.getElementById('hud-combo-bar').style.width = `${(gameState.comboTimer / 4.0) * 100}%`;
        } else {
            comboPanel.classList.add('opacity-0');
        }
}
}

export function updateBossBar() {
    const bossContainer = document.getElementById('hud-boss-bar-container');
    if (!bossContainer) return;

    let activeBoss = gameState.enemies.find(e => e.isBoss && !e.dead);
    if (!activeBoss) {
        bossContainer.classList.add('hidden');
        return;
    }

    bossContainer.classList.remove('hidden');
    const bossNameEl = document.getElementById('boss-name');
    const bossTitleEl = document.getElementById('boss-title');
    const bossHpBarEl = document.getElementById('boss-hp-bar');
    const bossShieldBarEl = document.getElementById('boss-shield-bar');

    if (bossNameEl) bossNameEl.innerText = activeBoss.bossName || "COLOSSAL HORROR";
    if (bossTitleEl) bossTitleEl.innerText = activeBoss.bossTitle || "ELITE MUTANT";

    let hpPct = Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100);
    if (bossHpBarEl) bossHpBarEl.style.width = `${hpPct}%`;

    if (activeBoss.mutator === 'Shielded' && activeBoss.bossShield > 0) {
        let shPct = Math.max(0, (activeBoss.bossShield / activeBoss.maxBossShield) * 100);
        if (bossShieldBarEl) {
            bossShieldBarEl.style.width = `${shPct}%`;
            bossShieldBarEl.style.display = 'block';
        }
    } else {
        if (bossShieldBarEl) bossShieldBarEl.style.display = 'none';
    }
}

export function triggerGameOver() {
    gameState.currentState = GameState.GAMEOVER;
    document.getElementById('ui-hud').classList.add('hidden');
    updateDeviceUI();
    document.getElementById('ui-gameover').classList.remove('hidden');

    let isSandbox = gameState.gameMode === 'sandbox';
    let modeTextEl = document.getElementById('go-mode-text');
    if (modeTextEl) modeTextEl.innerText = isSandbox ? "Mode: Sandbox Mayhem" : "Mode: Wave Survival";

    let statLabelEl = document.getElementById('go-stat-label');
    let waveValEl = document.getElementById('go-wave');
    if (isSandbox) {
        if (statLabelEl) statLabelEl.innerText = "Time Survived:";
        let totalSec = Math.floor(gameState.sandboxTime || 0);
        let mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
        let secs = String(totalSec % 60).padStart(2, '0');
        let threatLvl = 1 + Math.floor(totalSec / 20);
        if (waveValEl) waveValEl.innerText = `${mins}:${secs} (Lvl ${threatLvl})`;
    } else {
        if (statLabelEl) statLabelEl.innerText = "Survived until Wave:";
        if (waveValEl) waveValEl.innerText = gameState.currentWave;
    }

    let killsEl = document.getElementById('go-kills');
    if (killsEl) killsEl.innerText = gameState.totalKills || 0;

    let scoreEl = document.getElementById('go-score');
    if (scoreEl) scoreEl.innerText = gameState.score;
}

export function showPerks() {
    gameState.currentState = GameState.PERKS;
    mouseDownReset();
    updateDeviceUI();

    // Wave completion bonus gold!
    let waveBonus = 150 + gameState.currentWave * 50;
    gameState.money += waveBonus;
    document.getElementById('perk-bonus-text').innerText = `+ $${waveBonus} Wave Clearance Bonus!`;

    document.getElementById('ui-perks').classList.remove('hidden');
    
    let shuffled = [...ALL_PERKS].sort(() => 0.5 - Math.random());
    let choices = shuffled.slice(0, 3);
    
    let container = document.getElementById('perk-container');
    container.innerHTML = '';
    choices.forEach(p => {
        let card = document.createElement('div');
        card.className = "perk-card p-4 md:p-8 rounded-2xl cursor-pointer text-center flex-1 transform flex flex-col justify-between items-center transition-all hover:scale-[1.02] active:scale-95 shadow-xl border border-white/10";
        card.innerHTML = `
            <div class="flex flex-col items-center">
                <h3 class="text-xl md:text-3xl font-black ${p.color} mb-2 md:mb-4 tracking-tight">${p.name}</h3>
                <p class="text-xs md:text-base text-gray-300 mb-3 md:mb-6 font-medium leading-relaxed">${p.desc}</p>
            </div>
            <span class="px-4 py-2 md:px-5 md:py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-black border border-emerald-500/30 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm">Select Buff</span>`;
        card.onclick = () => { p.apply(); updateHUD(); document.getElementById('ui-perks').classList.add('hidden'); showShop(); };
        container.appendChild(card);
    });
}

export let shopCurrentTab = 'all';

export function setShopTab(tab) {
    shopCurrentTab = tab;
    const tabs = ['all', 'weapons', 'defenses', 'loadout'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (!btn) return;
        if (t === tab) {
            btn.className = "flex-shrink-0 whitespace-nowrap px-4 py-2 text-xs font-black rounded-xl transition-all bg-emerald-500 text-white shadow-lg shadow-emerald-500/25";
        } else {
            btn.className = "flex-shrink-0 whitespace-nowrap px-4 py-2 text-xs font-black rounded-xl transition-all bg-white/5 hover:bg-white/10 text-gray-400";
        }
    });
    renderShop();
}

export function showShop() {
    gameState.currentState = GameState.SHOP;
    mouseDownReset();
    updateDeviceUI();
    setShopTab('all');

    let actionBtn = document.getElementById('shop-action-btn');
    if (actionBtn) {
        if (gameState.gameMode === 'sandbox') {
            actionBtn.innerHTML = "RESUME SANDBOX (ESC) &rarr;";
        } else {
            actionBtn.innerHTML = "LAUNCH NEXT WAVE &rarr;";
        }
    }
}

export function resumeFromShop() {
    document.getElementById('ui-shop').classList.add('hidden');
    gameState.currentState = GameState.PLAYING;
    updateDeviceUI();
    updateHUD();
    import('./main.js').then(m => m.onGameResumed());
}

export function onShopActionClick() {
    if (gameState.gameMode === 'sandbox') {
        resumeFromShop();
    } else {
        nextWave();
    }
}

export function openSandboxShop() {
    if (gameState.currentState === GameState.PLAYING) {
        showShop();
    }
}

export function quitToMenu() {
    gameState.currentState = GameState.MENU;
    document.getElementById('ui-hud').classList.add('hidden');
    document.getElementById('ui-pause').classList.add('hidden');
    document.getElementById('ui-gameover').classList.add('hidden');
    document.getElementById('ui-shop').classList.add('hidden');
    document.getElementById('ui-perks').classList.add('hidden');
    document.getElementById('ui-menu').classList.remove('hidden');
    updateDeviceUI();
}

export function renderShop() {
    document.getElementById('ui-shop').classList.remove('hidden');
    const container = document.querySelector('#ui-shop .grid');
    if (!container) return;
    container.innerHTML = '';
    
    let isSandbox = gameState.gameMode === 'sandbox';
    document.getElementById('shop-money').innerText = isSandbox ? '∞' : gameState.money;

    const player = gameState.player;
    if (!player) return;

    let itemsToRender = [];
    if (shopCurrentTab === 'weapons') {
        itemsToRender = SHOP_ITEMS.filter(i => !i.isItem);
    } else if (shopCurrentTab === 'defenses') {
        itemsToRender = SHOP_ITEMS.filter(i => i.isItem);
    } else if (shopCurrentTab === 'loadout') {
        itemsToRender = SHOP_ITEMS.filter(i => !i.isItem && player.weapons.some(w => w && w.id === i.id));
    } else {
        itemsToRender = SHOP_ITEMS;
    }

    if (itemsToRender.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center text-gray-400">
                <p class="text-xl font-bold">No items found in this section.</p>
                <p class="text-sm mt-1 text-gray-500">Select another tab to browse your arsenal.</p>
            </div>
        `;
        return;
    }

    itemsToRender.forEach(item => {
        let w = null;
        if (!item.isItem) {
            w = player.weapons.find(wp => wp && wp.id === item.id);
        }

        let card = document.createElement('div');
        card.className = "bg-gray-900/80 backdrop-blur-md p-3 md:p-5 rounded-2xl border border-white/10 flex flex-col justify-between shadow-xl hover:border-emerald-500/30 transition-all min-h-[210px] md:min-h-[290px]";

        if (item.isItem) {
            // Defensive structures & deployables
            let buyCall = item.isBarricade 
                ? `buyBarricade(${item.baseCost})`
                : (item.isLandmine 
                    ? `buyLandmine(${item.baseCost})` 
                    : (item.isBeacon 
                        ? `buyBeacon(${item.baseCost})` 
                        : `buyTurret(${item.baseCost}, '${item.id}')`));
            let isTurret = !item.isBarricade && !item.isLandmine && !item.isBeacon;
            let currentInv = item.isBarricade 
                ? (player.barricadeInventory || 0) 
                : (item.isLandmine 
                    ? (player.landmineInventory || 0) 
                    : (item.isBeacon 
                        ? (player.beaconInventory || 0) 
                        : (player.turretInventory || 0)));
            let activeCount = item.isBarricade 
                ? gameState.barricades.length 
                : (item.isLandmine 
                    ? gameState.landmines.length 
                    : (item.isBeacon 
                        ? gameState.beacons.length 
                        : gameState.turrets.length));
            let badgeText = item.isBarricade 
                ? 'Wood Fortification' 
                : (item.isLandmine 
                    ? 'Proximity Mine' 
                    : (item.isBeacon 
                        ? 'Support Totem' 
                        : (item.id === 'turret_tesla' ? 'Tesla Coil' : (item.id === 'turret_frost' ? 'Cryo Sentry' : 'Auto Sentry'))));
            let badgeColor = item.isBarricade 
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                : (item.isLandmine 
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
                    : (item.isBeacon 
                        ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' 
                        : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'));
            let canAfford = isSandbox || (gameState.money >= item.baseCost);
            let priceLabel = isSandbox ? 'FREE' : `$${item.baseCost}`;

            card.innerHTML = `
                <div class="flex flex-col flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-[10px] uppercase font-bold tracking-widest ${badgeColor} px-2.5 py-0.5 border rounded-full">${badgeText}</span>
                        <span class="text-sm font-black text-yellow-400">${priceLabel}</span>
                    </div>
                    <h3 class="text-xl font-black text-white mb-2">${item.name}</h3>
                    <p class="text-gray-400 text-xs leading-relaxed mb-4 flex-1">${item.desc}</p>
                    
                    <!-- Status row -->
                    <div class="bg-black/40 border border-white/5 rounded-xl p-3 mb-4 grid grid-cols-2 gap-2 text-center">
                        <div>
                            <span class="text-[9px] uppercase tracking-wider text-gray-500 block font-bold">In Backpack</span>
                            <span class="text-sm font-black text-white">${currentInv}</span>
                        </div>
                        <div>
                            <span class="text-[9px] uppercase tracking-wider text-gray-500 block font-bold">${isTurret ? (Number.isFinite(MAX_ACTIVE_TURRETS) ? 'Active / Limit' : 'Active on Map') : 'Deployed'}</span>
                            <span class="text-sm font-black ${isTurret && Number.isFinite(MAX_ACTIVE_TURRETS) && activeCount >= MAX_ACTIVE_TURRETS ? 'text-amber-400' : 'text-emerald-400'}">${isTurret ? (Number.isFinite(MAX_ACTIVE_TURRETS) ? `${activeCount} / ${MAX_ACTIVE_TURRETS}` : `${activeCount}`) : `${activeCount}`}</span>
                        </div>
                    </div>
                </div>

                <button onclick="${buyCall}" class="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${canAfford ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-950 shadow-[0_4px_15px_rgba(234,179,8,0.25)] hover:scale-[1.01] active:scale-[0.99]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}">
                    ${canAfford ? (isSandbox ? 'ADD TO BACKPACK (FREE)' : `BUY DEPLOYABLE ($${item.baseCost})`) : `INSUFFICIENT FUNDS ($${item.baseCost})`}
                </button>
            `;
        } else if (!w) {
            // Unowned firearm
            let canAfford = isSandbox || (gameState.money >= item.baseCost);
            let priceLabel = isSandbox ? 'FREE' : `$${item.baseCost}`;
            card.innerHTML = `
                <div class="flex flex-col flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 border border-emerald-500/20 rounded-full">${item.type.toUpperCase()}</span>
                        <span class="text-sm font-black text-yellow-400">${priceLabel}</span>
                    </div>
                    <h3 class="text-xl font-black text-white mb-1" style="color:${item.color}">${item.name}</h3>
                    <p class="text-gray-400 text-xs leading-relaxed mb-4 flex-1">${item.desc}</p>
                    
                    <!-- Stats Grid -->
                    <div class="bg-black/40 border border-white/5 rounded-xl p-3 mb-4 grid grid-cols-3 gap-2 text-center">
                        <div>
                            <span class="text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Damage</span>
                            <span class="text-sm font-black text-white">${item.dmg}</span>
                        </div>
                        <div>
                            <span class="text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Fire Rate</span>
                            <span class="text-sm font-black text-white">${item.rate}s</span>
                        </div>
                        <div>
                            <span class="text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Capacity</span>
                            <span class="text-sm font-black text-white">${item.id === 'katana' ? 'INF' : item.ammo}</span>
                        </div>
                    </div>
                </div>

                <button onclick="buyWeapon('${item.id}')" class="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${canAfford ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:scale-[1.01] active:scale-[0.99]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}">
                    ${canAfford ? (isSandbox ? 'ACQUIRE WEAPON (FREE)' : `PURCHASE ($${item.baseCost})`) : `NEED $${item.baseCost}`}
                </button>
            `;
        } else {
            // Owned firearm - Upgrade and Customize
            let isKatana = w.id === 'katana';
            let isFlamethrower = w.id === 'flamethrower';
            let slotNum = player.weapons.indexOf(w) + 1;
            
            let baseC = item.baseCost > 0 ? item.baseCost : 300;
            let upDmgCost = Math.floor(baseC * 0.5 * (1 + (w.lvlDmg || 0) * 0.5));
            let upRateCost = Math.floor(baseC * 0.4 * (1 + (w.lvlRate || 0) * 0.5));
            let upAmmoCost = Math.floor(baseC * 0.3 * (1 + (w.lvlAmmo || 0) * 0.5));

            let canAffordDmg = isSandbox || (gameState.money >= upDmgCost);
            let canAffordRate = isSandbox || (gameState.money >= upRateCost);
            let canAffordAmmo = isSandbox || (gameState.money >= upAmmoCost);

            if (!w.attachments) {
                w.attachments = { laser: false, extMags: false, suppressor: false };
            }
            let hasLaser = w.attachments.laser;
            let hasMags = w.attachments.extMags;
            let hasSuppressor = w.attachments.suppressor;

            let laserCost = 400;
            let magsCost = 350;
            let suppressorCost = 450;

            let canAffordLaser = isSandbox || (gameState.money >= laserCost);
            let canAffordMags = isSandbox || (gameState.money >= magsCost);
            let canAffordSuppressor = isSandbox || (gameState.money >= suppressorCost);

            let statLabelAmmo = isFlamethrower ? 'Flame Reach' : (isKatana ? 'Blade Range' : 'Mag Size');

            card.innerHTML = `
                <div class="flex flex-col flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 border border-emerald-500/20 rounded-full flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> SLOT ${slotNum}
                        </span>
                        <span class="text-[10px] uppercase font-black text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">OWNED</span>
                    </div>
                    <h3 class="text-xl font-black mb-2" style="color:${item.color}">${item.name}</h3>

                    <!-- Upgrade Buttons Section -->
                    <div class="space-y-1.5 mb-3">
                        <!-- Damage upgrade -->
                        <button onclick="upgrade('${w.id}', 'dmg', ${upDmgCost})" class="w-full px-3 py-2 text-xs font-bold rounded-xl flex justify-between items-center transition-all ${w.lvlDmg >= 6 ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 cursor-default' : (canAffordDmg ? 'bg-gray-800 hover:bg-gray-700 text-white border border-white/5 hover:scale-[1.01]' : 'bg-gray-950 text-gray-600 border border-transparent cursor-not-allowed')}">
                            <span>${isKatana ? 'Sharpness' : 'Damage'} <span class="text-[10px] text-gray-400 font-mono font-normal">(${w.lvlDmg || 0}/6)</span></span>
                            <span class="font-black ${w.lvlDmg >= 6 ? 'text-emerald-400' : 'text-yellow-400'}">${w.lvlDmg >= 6 ? 'MAX' : (isSandbox ? 'FREE' : '$' + upDmgCost)}</span>
                        </button>

                        <!-- Fire rate upgrade -->
                        <button onclick="upgrade('${w.id}', 'rate', ${upRateCost})" class="w-full px-3 py-2 text-xs font-bold rounded-xl flex justify-between items-center transition-all ${w.lvlRate >= 6 ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 cursor-default' : (canAffordRate ? 'bg-gray-800 hover:bg-gray-700 text-white border border-white/5 hover:scale-[1.01]' : 'bg-gray-950 text-gray-600 border border-transparent cursor-not-allowed')}">
                            <span>${isKatana ? 'Swing Rate' : 'Fire Rate'} <span class="text-[10px] text-gray-400 font-mono font-normal">(${w.lvlRate || 0}/6)</span></span>
                            <span class="font-black ${w.lvlRate >= 6 ? 'text-emerald-400' : 'text-yellow-400'}">${w.lvlRate >= 6 ? 'MAX' : (isSandbox ? 'FREE' : '$' + upRateCost)}</span>
                        </button>

                        <!-- Ammo / Range upgrade -->
                        <button onclick="upgrade('${w.id}', '${isKatana || isFlamethrower ? 'range' : 'ammo'}', ${upAmmoCost})" class="w-full px-3 py-2 text-xs font-bold rounded-xl flex justify-between items-center transition-all ${w.lvlAmmo >= 6 ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 cursor-default' : (canAffordAmmo ? 'bg-gray-800 hover:bg-gray-700 text-white border border-white/5 hover:scale-[1.01]' : 'bg-gray-950 text-gray-600 border border-transparent cursor-not-allowed')}">
                            <span>${statLabelAmmo} <span class="text-[10px] text-gray-400 font-mono font-normal">(${w.lvlAmmo || 0}/6)</span></span>
                            <span class="font-black ${w.lvlAmmo >= 6 ? 'text-emerald-400' : 'text-yellow-400'}">${w.lvlAmmo >= 6 ? 'MAX' : (isSandbox ? 'FREE' : '$' + upAmmoCost)}</span>
                        </button>
                    </div>

                    <!-- Attachments -->
                    ${!isKatana && !isFlamethrower ? `
                    <div class="pt-2 border-t border-white/5">
                        <span class="text-[9px] uppercase font-black tracking-widest text-indigo-400 block mb-1.5">Weapon Mods</span>
                        <div class="grid grid-cols-3 gap-1">
                            <button onclick="buyAttachment('${w.id}', 'laser', ${laserCost})" class="p-1.5 text-[9px] leading-tight font-black rounded-lg text-center transition-all ${hasLaser ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-500/30' : (canAffordLaser ? 'bg-gray-800 hover:bg-gray-700 text-white border border-white/5' : 'bg-gray-950 text-gray-600 border border-transparent')}">
                                Laser<br><span class="${hasLaser ? 'text-indigo-400' : 'text-yellow-400'}">${hasLaser ? '✓ ON' : (isSandbox ? 'FREE' : '$' + laserCost)}</span>
                            </button>
                            <button onclick="buyAttachment('${w.id}', 'extMags', ${magsCost})" class="p-1.5 text-[9px] leading-tight font-black rounded-lg text-center transition-all ${hasMags ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-500/30' : (canAffordMags ? 'bg-gray-800 hover:bg-gray-700 text-white border border-white/5' : 'bg-gray-950 text-gray-600 border border-transparent')}">
                                Ext Mag<br><span class="${hasMags ? 'text-indigo-400' : 'text-yellow-400'}">${hasMags ? '✓ ON' : (isSandbox ? 'FREE' : '$' + magsCost)}</span>
                            </button>
                            <button onclick="buyAttachment('${w.id}', 'suppressor', ${suppressorCost})" class="p-1.5 text-[9px] leading-tight font-black rounded-lg text-center transition-all ${hasSuppressor ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-500/30' : (canAffordSuppressor ? 'bg-gray-800 hover:bg-gray-700 text-white border border-white/5' : 'bg-gray-950 text-gray-600 border border-transparent')}">
                                Silencer<br><span class="${hasSuppressor ? 'text-indigo-400' : 'text-yellow-400'}">${hasSuppressor ? '✓ ON' : (isSandbox ? 'FREE' : '$' + suppressorCost)}</span>
                            </button>
                        </div>
                    </div>` : ''}
                </div>
            `;
        }

        container.appendChild(card);
    });
}

export function buyWeapon(id) {
    let item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;
    let isSandbox = gameState.gameMode === 'sandbox';
    if (isSandbox || gameState.money >= item.baseCost) {
        if (!isSandbox) gameState.money -= item.baseCost;
        let emptySlot = gameState.player.weapons.findIndex(w => w === null);
        let finalSlot = emptySlot !== -1 ? emptySlot : item.slot;

        let spreadVal = item.id === 'sniper' ? 0.005 : 0.05;
        let newWep = {
            id: item.id, name: item.name, slot: finalSlot, dmg: item.dmg, fireRate: item.rate, maxAmmo: item.ammo,
            reloadTime: item.reload, ammo: item.ammo, cd: 0, reloading: false, reloadTimer: 0, spread: spreadVal,
            color: item.color, type: item.type, range: item.range || 0, lvlDmg: 0, lvlRate: 0, lvlAmmo: 0,
            attachments: { laser: false, extMags: false, suppressor: false }
        };
        gameState.player.weapons[finalSlot] = newWep;
        gameState.player.currentWeaponIndex = finalSlot;
        updateHUD();
        renderShop();
    }
}

export function buyTurret(cost, turretId) {
    let isSandbox = gameState.gameMode === 'sandbox';
    if (isSandbox || gameState.money >= cost) {
        if (!isSandbox) gameState.money -= cost;
        if (!gameState.player.turretInventoryList) gameState.player.turretInventoryList = [];
        
        let tType = 'bullet';
        if (turretId === 'turret_frost') tType = 'frost';
        else if (turretId === 'turret_tesla') tType = 'tesla';
        
        gameState.player.turretInventoryList.push(tType);
        gameState.player.turretInventory = (gameState.player.turretInventory || 0) + 1;
        updateHUD();
        renderShop();
    }
}

export function buyBarricade(cost) {
    let isSandbox = gameState.gameMode === 'sandbox';
    if (isSandbox || gameState.money >= cost) {
        if (!isSandbox) gameState.money -= cost;
        gameState.player.barricadeInventory = (gameState.player.barricadeInventory || 0) + 1;
        updateHUD();
        renderShop();
    }
}

export function buyLandmine(cost) {
    let isSandbox = gameState.gameMode === 'sandbox';
    if (isSandbox || gameState.money >= cost) {
        if (!isSandbox) gameState.money -= cost;
        gameState.player.landmineInventory = (gameState.player.landmineInventory || 0) + 1;
        updateHUD();
        renderShop();
    }
}

export function buyBeacon(cost) {
    let isSandbox = gameState.gameMode === 'sandbox';
    if (isSandbox || gameState.money >= cost) {
        if (!isSandbox) gameState.money -= cost;
        gameState.player.beaconInventory = (gameState.player.beaconInventory || 0) + 1;
        updateHUD();
        renderShop();
    }
}

export function upgrade(wId, stat, cost) {
    let w = gameState.player.weapons.find(wp => wp && wp.id === wId);
    let isSandbox = gameState.gameMode === 'sandbox';
    if (!w || (!isSandbox && gameState.money < cost)) return;

    if (!isSandbox) gameState.money -= cost;

    if (stat === 'dmg' && (w.lvlDmg || 0) < 6) {
        w.lvlDmg = (w.lvlDmg || 0) + 1;
        w.dmg = Math.round(w.dmg * 1.25);
    } else if (stat === 'rate' && (w.lvlRate || 0) < 6) {
        w.lvlRate = (w.lvlRate || 0) + 1;
        w.fireRate = Math.max(0.04, Number((w.fireRate * 0.85).toFixed(3)));
    } else if (stat === 'ammo' && (w.lvlAmmo || 0) < 6 && w.id !== 'katana' && w.id !== 'flamethrower') {
        w.lvlAmmo = (w.lvlAmmo || 0) + 1;
        w.maxAmmo = Math.floor(w.maxAmmo * 1.5);
        w.ammo = w.maxAmmo;
    } else if (stat === 'range' && (w.lvlAmmo || 0) < 6) {
        w.lvlAmmo = (w.lvlAmmo || 0) + 1;
        if (w.id === 'katana') w.range += 15;
        else if (w.id === 'flamethrower') w.range = (w.range || 0.5) + 0.15;
    }
    updateHUD();
    renderShop();
}

export function nextWave() {
    document.getElementById('ui-shop').classList.add('hidden');
    gameState.currentWave++;
    import('./main.js').then(m => m.startWave());
}

// Bind to window for HTML click compatibility
export function buyAttachment(wId, type, cost) {
    let w = gameState.player.weapons.find(wp => wp && wp.id === wId);
    let isSandbox = gameState.gameMode === 'sandbox';
    if (!w || (!isSandbox && gameState.money < cost)) return;
    if (!w.attachments) w.attachments = { laser: false, extMags: false, suppressor: false };
    if (w.attachments[type]) return; 
    
    if (!isSandbox) gameState.money -= cost;
    w.attachments[type] = true;
    
    if (type === 'laser') {
        w.spread = 0.002;
    } else if (type === 'extMags') {
        w.maxAmmo = Math.floor(w.maxAmmo * 1.5);
        w.ammo = w.maxAmmo;
    } else if (type === 'suppressor') {
        w.dmg = Math.floor(w.dmg * 1.2);
    }
    
    updateHUD();
    renderShop();
}

export function isFullscreen() {
    return Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    );
}

export function requestFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) {
        return el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
        return el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
        return el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) {
        return el.msRequestFullscreen();
    }
    return Promise.reject(new Error('Fullscreen not supported'));
}

export function exitFullscreen() {
    if (document.exitFullscreen) {
        return document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        return document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        return document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        return document.msExitFullscreen();
    }
    return Promise.reject(new Error('Exit fullscreen not supported'));
}

export function toggleFullscreen() {
    if (isFullscreen()) {
        exitFullscreen().catch(() => {});
    } else {
        requestFullscreen().then(() => {
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {});
            }
        }).catch(() => {});
    }
}

export function updateFullscreenUI() {
    const fs = isFullscreen();
    const icon = fs ? '🗗' : '⛶';

    const menuIcon = document.getElementById('fullscreen-icon-menu');
    const menuText = document.getElementById('fullscreen-text-menu');
    if (menuIcon) menuIcon.innerText = icon;
    if (menuText) menuText.innerText = fs ? 'EXIT FULL' : 'FULLSCREEN';

    const mobileBtn = document.getElementById('m-btn-fullscreen');
    if (mobileBtn) mobileBtn.innerText = icon;

    const pauseIcon = document.getElementById('fullscreen-pause-icon');
    const pauseLabel = document.getElementById('fullscreen-pause-label');
    if (pauseIcon) pauseIcon.innerText = icon;
    if (pauseLabel) pauseLabel.innerText = fs ? 'EXIT FULLSCREEN' : 'FULLSCREEN MODE';
}

document.addEventListener('fullscreenchange', updateFullscreenUI);
document.addEventListener('webkitfullscreenchange', updateFullscreenUI);

window.toggleFullscreen = toggleFullscreen;
window.requestFullscreen = requestFullscreen;
window.exitFullscreen = exitFullscreen;
window.isFullscreen = isFullscreen;
window.updateFullscreenUI = updateFullscreenUI;

window.buyAttachment = buyAttachment;
window.togglePause = togglePause;
window.nextWave = nextWave;
window.buyTurret = buyTurret;
window.buyBarricade = buyBarricade;
window.buyLandmine = buyLandmine;
window.buyBeacon = buyBeacon;
window.buyWeapon = buyWeapon;
window.upgrade = upgrade;
window.setShopTab = setShopTab;
window.resumeFromShop = resumeFromShop;
window.onShopActionClick = onShopActionClick;
window.openSandboxShop = openSandboxShop;
window.quitToMenu = quitToMenu;
window.startMode = (mode) => import('./main.js').then(m => m.startMode(mode));
window.restartCurrentMode = () => import('./main.js').then(m => m.restartCurrentMode());
window.showPerks = showPerks;
window.showGameOver = triggerGameOver;
window.setWeaponIndex = (idx) => {
    if (gameState.player && gameState.player.weapons && gameState.player.weapons[idx]) {
        gameState.player.currentWeaponIndex = idx;
        updateHUD();
    }
};

