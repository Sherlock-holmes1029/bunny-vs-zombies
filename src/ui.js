import { gameState } from './state.js';
import { GameState } from './constants.js';
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
    { id: 'm16', name: 'M16 Assault', slot: 0, baseCost: 500, type: 'auto', dmg: 22, rate: 0.12, ammo: 30, reload: 1.5, color: '#f87171' },
    { id: 'ak47', name: 'AK-47', slot: 0, baseCost: 750, type: 'auto', dmg: 35, rate: 0.09, ammo: 30, reload: 1.6, color: '#ef4444' },
    { id: 'shotgun', name: 'Shotgun', slot: 1, baseCost: 800, type: 'semi', dmg: 18, rate: 0.8, ammo: 6, reload: 2.0, color: '#fb923c' },
    { id: 'sniper', name: 'Sniper Rifle', slot: 1, baseCost: 1100, type: 'semi', dmg: 180, rate: 1.5, ammo: 5, reload: 2.2, color: '#a855f7' },
    { id: 'rpg', name: 'RPG-7', slot: 1, baseCost: 1500, type: 'semi', dmg: 150, rate: 1.5, ammo: 1, reload: 2.5, color: '#4ade80' },
    { id: 'katana', name: 'Katana', slot: 2, baseCost: 1000, type: 'melee', dmg: 80, rate: 0.5, ammo: 1, reload: 0, color: '#38bdf8', range: 120 },
    { id: 'flamethrower', name: 'Flamethrower', slot: 1, baseCost: 1200, type: 'auto', dmg: 24, rate: 0.05, ammo: 100, reload: 3.0, color: '#fbbf24' },
    { id: 'turret', name: 'Auto Turret', slot: 'item', baseCost: 300, isItem: true, desc: "Place a standard turret for defensive fire support" },
    { id: 'turret_frost', name: 'Frost Turret', slot: 'item', baseCost: 450, isItem: true, desc: "Fires cryo-beams that freeze and slow groups" },
    { id: 'turret_tesla', name: 'Tesla Coil', slot: 'item', baseCost: 600, isItem: true, desc: "Discharges chain-lightning arcing between 5 targets" },
    { id: 'barricade', name: 'Wood Barricade', slot: 'item', baseCost: 120, isItem: true, isBarricade: true, desc: "Deploy a wooden barrier [F]. Zombies attack it instead of you." }
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
    if(gameState.currentState === GameState.PLAYING) {
        gameState.currentState = GameState.PAUSED;
        document.getElementById('ui-pause').classList.remove('hidden');
        gameState.player.reloading = false;
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
    document.getElementById('hud-money').innerText = gameState.money;
    document.getElementById('hud-score').innerText = gameState.score;
    document.getElementById('hud-turrets').innerText = player.turretInventory || 0;
    document.getElementById('hud-barricades').innerText = player.barricadeInventory || 0;
    document.getElementById('hud-shield').innerText = `${Math.floor(player.shield)}/${player.maxShield}`;
    document.getElementById('hud-shield-bar').style.width = `${Math.max(0, (player.shield/player.maxShield)*100)}%`;

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
            document.getElementById('adrenaline-label').innerText = "RUSH READY (Q)";
            document.getElementById('adrenaline-label').className = "text-amber-400 animate-bounce font-black";
            document.getElementById('adrenaline-bullet').className = "w-2 h-2 rounded-full bg-amber-400 animate-pulse";
        } else {
            document.getElementById('adrenaline-label').innerText = "Adrenaline (Q)";
            document.getElementById('adrenaline-label').className = "";
            document.getElementById('adrenaline-bullet').className = "w-2 h-2 rounded-full bg-purple-500 animate-pulse";
        }
    }

    let w = player.getWeapon();
    if(w) {
        if(w.id === 'katana') {
            document.getElementById('hud-ammo-current').innerText = 'INF';
            document.getElementById('hud-ammo-max').innerText = '';
        } else {
            document.getElementById('hud-ammo-current').innerText = w.ammo;
            document.getElementById('hud-ammo-max').innerText = w.maxAmmo;
            document.getElementById('hud-ammo-current').className = w.reloading ? 'text-red-500 animate-pulse' : 'text-yellow-400';
        }
    }

    const wContainer = document.getElementById('hud-weapons');
    wContainer.innerHTML = '';
    for(let i=0; i<4; i++) {
        let slotW = player.weapons[i];
        let active = player.currentWeaponIndex === i;
        let html = `<div onclick="window.setWeaponIndex(${i})" class="weapon-slot w-14 h-14 md:w-16 md:h-16 rounded-2xl border flex items-center justify-center font-bold flex-col transition-all duration-300 ${active ? 'bg-green-500/10 border-green-500 text-green-400 scale-105 shadow-[0_0_20px_rgba(34,197,94,0.3)] z-10' : 'bg-gray-900/60 border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'}">
            <div class="text-[9px] md:text-[10px] uppercase tracking-wider mb-0.5 opacity-60">S${i+1}</div>`;
        if(slotW) html += `<div class="text-xs md:text-sm font-black truncate max-w-[90%]">${slotW.name.substring(0,6)}</div>`;
        else html += `<div class="text-sm font-light opacity-30">-</div>`;
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

export function triggerGameOver() {
    gameState.currentState = GameState.GAMEOVER;
    document.getElementById('ui-hud').classList.add('hidden');
    updateDeviceUI();
    document.getElementById('ui-gameover').classList.remove('hidden');
    document.getElementById('go-wave').innerText = gameState.currentWave;
    document.getElementById('go-score').innerText = gameState.score;
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
        card.className = "perk-card p-8 rounded-2xl cursor-pointer text-center flex-1 transform flex flex-col justify-between items-center";
        card.innerHTML = `
            <div class="flex flex-col items-center">
                <h3 class="text-3xl font-black ${p.color} mb-4 tracking-tight">${p.name}</h3>
                <p class="text-base text-gray-300 mb-6 font-medium leading-relaxed">${p.desc}</p>
            </div>
            <span class="px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/20 rounded-xl text-xs uppercase tracking-wider transition-colors">Select Buff</span>`;
        card.onclick = () => { p.apply(); updateHUD(); document.getElementById('ui-perks').classList.add('hidden'); showShop(); };
        container.appendChild(card);
    });
}

export function showShop() {
    gameState.currentState = GameState.SHOP;
    updateDeviceUI();
    renderShop();
}

export function renderShop() {
    document.getElementById('ui-shop').classList.remove('hidden');
    const container = document.querySelector('#ui-shop .grid');
    container.innerHTML = '';
    
    document.getElementById('shop-money').innerText = gameState.money;

    SHOP_ITEMS.forEach(item => {
        let w = null;
        if(!item.isItem) w = gameState.player.weapons.find(wp => wp && wp.id === item.id);

        let card = document.createElement('div');
        card.className = "bg-gray-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/5 flex flex-col justify-between shadow-xl";
        
        if (item.isItem) {
             let buyCall = item.isBarricade 
                ? `buyBarricade(${item.baseCost})`
                : `buyTurret(${item.baseCost}, '${item.id}')`;
             let labelText = item.isBarricade ? '🪵 Barricade' : 'Defense Structure';
             let labelColor = item.isBarricade ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
             card.innerHTML = `
                <div>
                    <span class="text-[10px] uppercase font-bold tracking-widest ${labelColor} px-2 py-0.5 border rounded-md">${labelText}</span>
                    <h3 class="text-2xl font-black text-white mt-2 mb-1">${item.name}</h3>
                    <p class="text-gray-400 text-sm mb-6">${item.desc}</p>
                </div>
                <button onclick="${buyCall}" class="w-full py-3 rounded-xl font-bold transition-all ${gameState.money >= item.baseCost ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-950 shadow-[0_4px_15px_rgba(234,179,8,0.3)] hover:scale-[1.02]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}">BUY ($${item.baseCost})</button>`;
        } else if (!w) {
            card.innerHTML = `
                <div>
                    <span class="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-md">Weapon</span>
                    <h3 class="text-2xl font-black text-white mt-2 mb-1">${item.name}</h3>
                    <p class="text-gray-400 text-sm mb-6">Slot ${item.slot + 1} • DMG: ${item.dmg}</p>
                </div>
                <button onclick="buyWeapon('${item.id}')" class="w-full py-3 rounded-xl font-bold transition-all ${gameState.money >= item.baseCost ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:scale-[1.02]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}">PURCHASE ($${item.baseCost})</button>`;
        } else {
            let upDmgCost = Math.floor(item.baseCost * 0.5 * (1 + (w.lvlDmg||0)*0.5));
            let upRateCost = Math.floor(item.baseCost * 0.4 * (1 + (w.lvlRate||0)*0.5));
            let upAmmoCost = Math.floor(item.baseCost * 0.3 * (1 + (w.lvlAmmo||0)*0.5));
            let isKatana = w.id === 'katana';

            if (!w.attachments) {
                w.attachments = { laser: false, extMags: false, suppressor: false };
            }
            let hasLaser = w.attachments.laser;
            let hasMags = w.attachments.extMags;
            let hasSuppressor = w.attachments.suppressor;

            let laserCost = 400;
            let magsCost = 350;
            let suppressorCost = 450;

            card.innerHTML = `
                <div class="mb-4">
                    <span class="text-[10px] uppercase font-bold tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 border border-blue-500/20 rounded-md">Owned Weapon</span>
                    <h3 class="text-2xl font-black text-white mt-2" style="color:${item.color}">${item.name}</h3>
                </div>
                <div class="space-y-2">
                    <button onclick="upgrade('${w.id}', 'dmg', ${upDmgCost})" class="w-full p-3 text-xs font-bold rounded-xl flex justify-between items-center transition-all ${w.lvlDmg >= 6 ? 'bg-green-900/40 text-green-400 border border-green-500/20' : (gameState.money >= upDmgCost ? 'bg-gray-800 hover:bg-gray-700 hover:scale-[1.01] text-white border border-white/5' : 'bg-gray-950 text-gray-600 border border-transparent')}">
                        <span>${isKatana?'Blade Sharpness':'Damage'} (Lvl ${w.lvlDmg||0}/6)</span> <span>${w.lvlDmg >= 6 ? 'MAX' : '$'+upDmgCost}</span></button>
                    <button onclick="upgrade('${w.id}', 'rate', ${upRateCost})" class="w-full p-3 text-xs font-bold rounded-xl flex justify-between items-center transition-all ${w.lvlRate >= 6 ? 'bg-green-900/40 text-green-400 border border-green-500/20' : (gameState.money >= upRateCost ? 'bg-gray-800 hover:bg-gray-700 hover:scale-[1.01] text-white border border-white/5' : 'bg-gray-950 text-gray-600 border border-transparent')}">
                        <span>${isKatana?'Swing Speed':'Fire Rate'} (Lvl ${w.lvlRate||0}/6)</span> <span>${w.lvlRate >= 6 ? 'MAX' : '$'+upRateCost}</span></button>
                    ${w.id === 'flamethrower' ? 
                    `<button onclick="upgrade('${w.id}', 'range', ${upAmmoCost})" class="w-full p-3 text-xs font-bold rounded-xl flex justify-between items-center transition-all ${w.lvlAmmo >= 6 ? 'bg-green-900/40 text-green-400 border border-green-500/20' : (gameState.money >= upAmmoCost ? 'bg-gray-800 hover:bg-gray-700 hover:scale-[1.01] text-white border border-white/5' : 'bg-gray-950 text-gray-600 border border-transparent')}">
                        <span>Flame Range (Lvl ${w.lvlAmmo||0}/6)</span> <span>${w.lvlAmmo >= 6 ? 'MAX' : '$'+upAmmoCost}</span></button>` : 
                    (!isKatana ? 
                    `<button onclick="upgrade('${w.id}', 'ammo', ${upAmmoCost})" class="w-full p-3 text-xs font-bold rounded-xl flex justify-between items-center transition-all ${w.lvlAmmo >= 6 ? 'bg-green-900/40 text-green-400 border border-green-500/20' : (gameState.money >= upAmmoCost ? 'bg-gray-800 hover:bg-gray-700 hover:scale-[1.01] text-white border border-white/5' : 'bg-gray-950 text-gray-600 border border-transparent')}">
                        <span>Capacity (Lvl ${w.lvlAmmo||0}/6)</span> <span>${w.lvlAmmo >= 6 ? 'MAX' : '$'+upAmmoCost}</span></button>` : 
                    `<button onclick="upgrade('${w.id}', 'range', ${upAmmoCost})" class="w-full p-3 text-xs font-bold rounded-xl flex justify-between items-center transition-all ${w.lvlAmmo >= 6 ? 'bg-green-900/40 text-green-400 border border-green-500/20' : (gameState.money >= upAmmoCost ? 'bg-gray-800 hover:bg-gray-700 hover:scale-[1.01] text-white border border-white/5' : 'bg-gray-950 text-gray-600 border border-transparent')}">
                        <span>Blade Length (Lvl ${w.lvlAmmo||0}/6)</span> <span>${w.lvlAmmo >= 6 ? 'MAX' : '$'+upAmmoCost}</span></button>`)
                    }
                </div>
                ${!isKatana && w.id !== 'flamethrower' ? `
                <div class="mt-4 pt-4 border-t border-white/5 space-y-2">
                    <span class="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Attachments</span>
                    <div class="grid grid-cols-3 gap-1.5">
                        <button onclick="buyAttachment('${w.id}', 'laser', ${laserCost})" class="p-2 text-[10px] leading-tight font-black rounded-lg text-center transition-all ${hasLaser ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-500/20' : (gameState.money >= laserCost ? 'bg-gray-800 hover:bg-gray-700 text-white border border-white/5' : 'bg-gray-950 text-gray-600 border border-transparent')}">
                            Laser<br>${hasLaser ? 'OWNED' : '$'+laserCost}
                        </button>
                        <button onclick="buyAttachment('${w.id}', 'extMags', ${magsCost})" class="p-2 text-[10px] leading-tight font-black rounded-lg text-center transition-all ${hasMags ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-500/20' : (gameState.money >= magsCost ? 'bg-gray-800 hover:bg-gray-700 text-white border border-white/5' : 'bg-gray-950 text-gray-600 border border-transparent')}">
                            Ext Mag<br>${hasMags ? 'OWNED' : '$'+magsCost}
                        </button>
                        <button onclick="buyAttachment('${w.id}', 'suppressor', ${suppressorCost})" class="p-2 text-[10px] leading-tight font-black rounded-lg text-center transition-all ${hasSuppressor ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-500/20' : (gameState.money >= suppressorCost ? 'bg-gray-800 hover:bg-gray-700 text-white border border-white/5' : 'bg-gray-950 text-gray-600 border border-transparent')}">
                            Silencer<br>${hasSuppressor ? 'OWNED' : '$'+suppressorCost}
                        </button>
                    </div>
                </div>` : ''}`;
        }
        
        container.appendChild(card);
    });
}

export function buyWeapon(id) {
    let item = SHOP_ITEMS.find(i => i.id === id);
    if(gameState.money >= item.baseCost) {
        gameState.money -= item.baseCost;
        let emptySlot = gameState.player.weapons.findIndex(w => w === null);
        let finalSlot = emptySlot !== -1 ? emptySlot : item.slot;

        let spreadVal = item.id === 'sniper' ? 0.005 : 0.05;
        let newWep = {
            id: item.id, name: item.name, slot: finalSlot, dmg: item.dmg, fireRate: item.rate, maxAmmo: item.ammo,
            reloadTime: item.reload, ammo: item.ammo, cd: 0, reloading: false, reloadTimer: 0, spread: spreadVal,
            color: item.color, type: item.type, range: item.range || 0, lvlDmg: 0, lvlRate: 0, lvlAmmo: 0,
            attachments: { laser: false, extMags: false, suppressor: false }
        };
        gameState.player.weapons[finalSlot] = newWep; gameState.player.currentWeaponIndex = finalSlot; renderShop();
    }
}

export function buyTurret(cost, turretId) {
    if(gameState.money >= cost) {
        gameState.money -= cost;
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
    if(gameState.money >= cost) {
        gameState.money -= cost;
        gameState.player.barricadeInventory = (gameState.player.barricadeInventory || 0) + 1;
        updateHUD();
        renderShop();
    }
}

export function upgrade(wId, stat, cost) {
    let w = gameState.player.weapons.find(wp => wp && wp.id === wId);
    if(!w || gameState.money < cost) return;

    if(stat === 'dmg' && (w.lvlDmg||0) < 6) { gameState.money -= cost; w.lvlDmg = (w.lvlDmg||0) + 1; w.dmg *= 1.25; } 
    else if (stat === 'rate' && (w.lvlRate||0) < 6) { gameState.money -= cost; w.lvlRate = (w.lvlRate||0) + 1; w.fireRate *= 0.85; } 
    else if (stat === 'ammo' && (w.lvlAmmo||0) < 6 && w.id !== 'katana' && w.id !== 'flamethrower') { gameState.money -= cost; w.lvlAmmo = (w.lvlAmmo||0) + 1; w.maxAmmo = Math.floor(w.maxAmmo * 1.5); } 
    else if (stat === 'range' && (w.lvlAmmo||0) < 6) { 
        gameState.money -= cost; 
        w.lvlAmmo = (w.lvlAmmo||0) + 1; 
        if (w.id === 'katana') w.range += 15;
        else if (w.id === 'flamethrower') w.range = (w.range || 0.5) + 0.15;
    }
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
    if (!w || gameState.money < cost) return;
    if (!w.attachments) w.attachments = { laser: false, extMags: false, suppressor: false };
    if (w.attachments[type]) return; 
    
    gameState.money -= cost;
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

window.buyAttachment = buyAttachment;
window.togglePause = togglePause;
window.nextWave = nextWave;
window.buyTurret = buyTurret;
window.buyBarricade = buyBarricade;
window.buyWeapon = buyWeapon;
window.upgrade = upgrade;
window.setWeaponIndex = (idx) => {
    if (gameState.player) {
        gameState.player.currentWeaponIndex = idx;
        updateHUD();
    }
};
