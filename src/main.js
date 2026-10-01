import { gameState, isMobileCheck } from './state.js';
import { GameState, MAP_WIDTH, MAP_HEIGHT, MAX_ACTIVE_TURRETS } from './constants.js';
import { generateMap, platforms } from './physics.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { Turret } from './entities/Turret.js';
import { Barricade } from './entities/Barricade.js';
import { Landmine, NanoBeacon } from './entities/Deployable.js';
import { CarePackage } from './entities/CarePackage.js';
import { ExplosiveBarrel } from './entities/ExplosiveBarrel.js';
import { createParticles, createFloatingText } from './effects.js';
import { initInput, setupMobileControls, mouse, mobileState } from './input.js';
import { updateCamera } from './camera.js';
import { updateDeviceUI, updateHUD, togglePause, lastTimeRef } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false }); 
let cw = canvas.width = window.innerWidth;
let ch = canvas.height = window.innerHeight;

// Grab focus
window.focus();
document.addEventListener('click', () => window.focus());

window.addEventListener('resize', () => {
    cw = canvas.width = window.innerWidth;
    ch = canvas.height = window.innerHeight;
    updateDeviceUI();
});

export function startWave() {
    gameState.waveKills = 0;
    gameState.killsNeeded = 5 + Math.floor((gameState.currentWave - 1) * 3);
    gameState.spawnTimer = 2.0;
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.enemyProjectiles = [];
    gameState.pickups = [];
    
    gameState.barrels = [];
    let numBarrels = 2 + Math.floor(Math.random() * 3);
    for(let i = 0; i < numBarrels; i++) {
        let p = platforms[Math.floor(Math.random() * (platforms.length - 1)) + 1];
        if (p) {
            let spawnX = p.x + Math.random() * (p.width - 24);
            let spawnY = p.y - 32;
            gameState.barrels.push(new ExplosiveBarrel(spawnX, spawnY));
        }
    }
    
    gameState.isRaining = gameState.currentWave % 3 === 0;
    if (gameState.player) {
        gameState.player.speed = gameState.isRaining ? 300 : 400; 
    }
    
    gameState.currentState = GameState.PLAYING;
    document.getElementById('hud-wave').innerText = gameState.currentWave;
    updateDeviceUI();
    updateHUD();
}

export function startMode(mode = 'survival') {
    gameState.gameMode = mode;
    gameState.score = 0;
    gameState.totalKills = 0;
    gameState.waveKills = 0;
    gameState.comboCount = 0;
    gameState.comboTimer = 0;
    gameState.adrenalineActive = false;
    gameState.adrenalineTimer = 0;
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.enemyProjectiles = [];
    gameState.pickups = [];
    gameState.turrets = [];
    gameState.barricades = [];
    gameState.landmines = [];
    gameState.beacons = [];
    gameState.carePackages = [];
    gameState.companions = [];
    gameState.particles = [];
    gameState.slashes = [];

    gameState.player = new Player();

    if (mode === 'sandbox') {
        gameState.money = 9999999;
        gameState.sandboxTime = 0;
        gameState.sandboxBossTimer = 75.0;
        gameState.killsNeeded = Infinity;
        gameState.currentWave = 1;
        gameState.spawnTimer = 1.0;
        gameState.isRaining = false;
        gameState.player.speed = 400;
    } else {
        gameState.money = 0;
        gameState.currentWave = 1;
        gameState.killsNeeded = 10;
        gameState.spawnTimer = 1.5;
        gameState.isRaining = false;
        gameState.player.speed = 400;
    }

    // Reset barrels
    gameState.barrels = [];
    let numBarrels = 4 + Math.floor(Math.random() * 3);
    for(let i = 0; i < numBarrels; i++) {
        let p = platforms[Math.floor(Math.random() * (platforms.length - 1)) + 1];
        if (p) {
            let spawnX = p.x + Math.random() * (p.width - 24);
            let spawnY = p.y - 32;
            gameState.barrels.push(new ExplosiveBarrel(spawnX, spawnY));
        }
    }

    // Hide menus & show HUD
    const menuEl = document.getElementById('ui-menu');
    if (menuEl) menuEl.classList.add('hidden');
    const goEl = document.getElementById('ui-gameover');
    if (goEl) goEl.classList.add('hidden');
    const pauseEl = document.getElementById('ui-pause');
    if (pauseEl) pauseEl.classList.add('hidden');
    const shopEl = document.getElementById('ui-shop');
    if (shopEl) shopEl.classList.add('hidden');
    const perksEl = document.getElementById('ui-perks');
    if (perksEl) perksEl.classList.add('hidden');
    const hudEl = document.getElementById('ui-hud');
    if (hudEl) hudEl.classList.remove('hidden');

    gameState.currentState = GameState.PLAYING;
    lastTimeRef.value = performance.now();
    updateDeviceUI();
    updateHUD();
}

export function restartCurrentMode() {
    startMode(gameState.gameMode || 'survival');
}

export function onGameResumed() {
    lastTimeRef.value = performance.now();
}

function handleGrappleInput(forceState) {
    const player = gameState.player;
    if (!player) return;
    
    let targetState = forceState !== undefined ? forceState : !player.grapple.active;
    
    if (targetState) {
        if (player.grapple.active) return;
        let hooked = false;
        if (!isMobileCheck()) {
            for(let p of platforms) {
                if(mouse.worldX >= p.x && mouse.worldX <= p.x + p.width &&
                   mouse.worldY >= p.y && mouse.worldY <= p.y + p.height) {
                    player.grapple.active = true;
                    player.grapple.x = mouse.worldX;
                    player.grapple.y = mouse.worldY;
                    hooked = true; break;
                }
            }
        }
        if (!hooked) {
            let bestPlat = null;
            let bestDist = 1000;
            for(let p of platforms) {
                let px = p.x + p.width/2;
                let py = p.y + p.height; 
                let d = Math.hypot(px - (player.x+player.width/2), py - player.y);
                if (d < bestDist && py < player.y + 100) { 
                    bestDist = d; bestPlat = {x: px, y: py};
                }
            }
            if (bestPlat) {
                player.grapple.active = true;
                player.grapple.x = bestPlat.x;
                player.grapple.y = bestPlat.y;
            }
        }
    } else {
        player.grapple.active = false;
    }
}

function handlePlaceTurret() {
    const player = gameState.player;
    if (!player) return;
    if ((player.turretInventory || 0) <= 0) return;

    if (Number.isFinite(MAX_ACTIVE_TURRETS) && gameState.turrets.length >= MAX_ACTIVE_TURRETS) {
        createFloatingText(player.x + player.width/2, player.y - 20, `TURRET LIMIT (${MAX_ACTIVE_TURRETS}/${MAX_ACTIVE_TURRETS})`, '#f59e0b');
        return;
    }

    player.turretInventory--;
    if (!player.turretInventoryList) player.turretInventoryList = [];
    let tType = player.turretInventoryList.pop() || 'bullet';

    // Position turret grounded on nearest platform below player
    let tx = player.x + (player.facingRight ? 35 : -35);
    let ty = player.y + player.height - 30;
    
    let footX = tx + 10;
    let footY = player.y + player.height;
    let closestPlatY = null;
    for (let p of platforms) {
        if (footX >= p.x && footX <= p.x + p.width && p.y >= footY - 15) {
            if (closestPlatY === null || p.y < closestPlatY) {
                closestPlatY = p.y;
            }
        }
    }
    if (closestPlatY !== null) {
        ty = closestPlatY - 30;
    }

    gameState.turrets.push(new Turret(tx, ty, tType));
    createParticles(tx + 10, ty + 15, 12, '#38bdf8', 100);
    let limitStr = Number.isFinite(MAX_ACTIVE_TURRETS) ? ` (${gameState.turrets.length}/${MAX_ACTIVE_TURRETS})` : ` (#${gameState.turrets.length})`;
    createFloatingText(tx + 10, ty - 15, `TURRET PLACED${limitStr}`, '#38bdf8');
    updateHUD();
}

function handleUltimate() {
    const player = gameState.player;
    if (!player) return;
    if (!gameState.adrenalineActive && player.adrenaline >= player.adrenalineMax) {
        gameState.adrenalineActive = true;
        gameState.adrenalineTimer = 8.0;
        player.adrenaline = 0;
        import('./effects.js').then(m => {
            m.createFloatingText(player.x + player.width/2, player.y - 15, "ADRENALINE RUSH!", '#d946ef');
        });
        updateHUD();
    }
}

function handlePlaceBarricade() {
    const player = gameState.player;
    if (!player) return;
    if ((player.barricadeInventory || 0) > 0) {
        let bx = player.x + (player.facingRight ? 40 : -50);
        let by = player.y + player.height - 40;
        
        let footX = bx + 20;
        let footY = player.y + player.height;
        let closestPlatY = null;
        for (let p of platforms) {
            if (footX >= p.x && footX <= p.x + p.width && p.y >= footY - 15) {
                if (closestPlatY === null || p.y < closestPlatY) {
                    closestPlatY = p.y;
                }
            }
        }
        if (closestPlatY !== null) {
            by = closestPlatY - 40;
        }

        gameState.barricades.push(new Barricade(bx, by));
        player.barricadeInventory--;
        createParticles(bx + 20, by + 20, 10, '#f59e0b', 80);
        createFloatingText(bx + 20, by - 10, "BARRICADE DEPLOYED", '#f59e0b');
        updateHUD();
    }
}

export function handlePlaceLandmine() {
    const player = gameState.player;
    if (!player) return;
    if ((player.landmineInventory || 0) <= 0) return;

    let mx = player.x + (player.facingRight ? 25 : -25);
    let my = player.y + player.height - 10;

    let footX = mx + 12;
    let footY = player.y + player.height;
    let closestPlatY = null;
    for (let p of platforms) {
        if (footX >= p.x && footX <= p.x + p.width && p.y >= footY - 15) {
            if (closestPlatY === null || p.y < closestPlatY) {
                closestPlatY = p.y;
            }
        }
    }
    if (closestPlatY !== null) {
        my = closestPlatY - 10;
    }

    gameState.landmines.push(new Landmine(mx, my));
    player.landmineInventory--;
    createParticles(mx + 12, my + 5, 8, '#ef4444', 80);
    createFloatingText(mx + 12, my - 15, "MINE ARMED", '#ef4444');
    updateHUD();
}

export function handlePlaceBeacon() {
    const player = gameState.player;
    if (!player) return;
    if ((player.beaconInventory || 0) <= 0) return;

    let bx = player.x + (player.facingRight ? 30 : -30);
    let by = player.y + player.height - 48;

    let footX = bx + 14;
    let footY = player.y + player.height;
    let closestPlatY = null;
    for (let p of platforms) {
        if (footX >= p.x && footX <= p.x + p.width && p.y >= footY - 15) {
            if (closestPlatY === null || p.y < closestPlatY) {
                closestPlatY = p.y;
            }
        }
    }
    if (closestPlatY !== null) {
        by = closestPlatY - 48;
    }

    gameState.beacons.push(new NanoBeacon(bx, by));
    player.beaconInventory--;
    createParticles(bx + 14, by + 24, 12, '#38bdf8', 120);
    createFloatingText(bx + 14, by - 15, "BEACON DEPLOYED", '#38bdf8');
    updateHUD();
}

window.handlePlaceLandmine = handlePlaceLandmine;
window.handlePlaceBeacon = handlePlaceBeacon;
window.handlePlaceTurret = handlePlaceTurret;
window.handlePlaceBarricade = handlePlaceBarricade;
window.handleUltimate = handleUltimate;
window.handleInteract = handleInteract;

function handleInteract() {
    const player = gameState.player;
    if (!player) return;
    
    let targetObj = null;
    let minDist = 70;
    
    gameState.turrets.forEach(t => {
        let d = Math.hypot((t.x + 10) - (player.x + player.width/2), (t.y + 15) - (player.y + player.height/2));
        if (d < minDist) {
            minDist = d;
            targetObj = t;
        }
    });
    
    gameState.barricades.forEach(b => {
        let d = Math.hypot((b.x + 20) - (player.x + player.width/2), (b.y + 20) - (player.y + player.height/2));
        if (d < minDist) {
            minDist = d;
            targetObj = b;
        }
    });
    
    if (targetObj) {
        if (targetObj.isBarricade) {
            let needed = targetObj.maxHp - targetObj.hp;
            if (needed > 0) {
                let cost = Math.min(gameState.money, Math.ceil(needed / 2));
                if (cost > 0) {
                    gameState.money -= cost;
                    targetObj.hp += cost * 2;
                    if (targetObj.hp > targetObj.maxHp) targetObj.hp = targetObj.maxHp;
                    createParticles(targetObj.x + 20, targetObj.y + 20, 10, '#f59e0b', 120);
                    createFloatingText(targetObj.x + 20, targetObj.y - 10, "REPAIRED", '#f59e0b');
                    updateHUD();
                }
            }
        } else {
            let cost = 150;
            if (gameState.money >= cost) {
                gameState.money -= cost;
                targetObj.level = (targetObj.level || 1) + 1;
                targetObj.fireRate *= 0.85; 
                createParticles(targetObj.x + 10, targetObj.y + 15, 15, '#10b981', 150);
                createFloatingText(targetObj.x + 10, targetObj.y - 15, `LVL ${targetObj.level}`, '#10b981');
                updateHUD();
            } else {
                createFloatingText(targetObj.x + 10, targetObj.y - 15, "NEED $150", '#ef4444');
            }
        }
    }
}

function updateGame(dt) {
    const player = gameState.player;
    if (!player) return;

    // Care package system
    gameState.carePackageTimer -= dt;
    if (gameState.carePackageTimer <= 0) {
        gameState.carePackageTimer = 35.0 + Math.random() * 15.0;
        let spawnX = 100 + Math.random() * (MAP_WIDTH - 200);
        let spawnY = gameState.camera.y - 120;
        gameState.carePackages.push(new CarePackage(spawnX, spawnY));
        createFloatingText(player.x + player.width/2, player.y - 40, "AIRDROP INBOUND!", '#ef4444');
    }

    gameState.carePackages.forEach(cp => cp.update(dt));
    for (let i = gameState.carePackages.length - 1; i >= 0; i--) {
        if (gameState.carePackages[i].collected) {
            gameState.carePackages.splice(i, 1);
        }
    }

    if (gameState.adrenalineActive) {
        gameState.adrenalineTimer -= dt;
        if (gameState.adrenalineTimer <= 0) {
            gameState.adrenalineActive = false;
            updateHUD();
        }
    }

    if(gameState.camera.shake > 0) gameState.camera.shake -= dt * 20;
    if(gameState.camera.shake < 0) gameState.camera.shake = 0;

    let worldDt = dt;
    if (gameState.adrenalineActive) {
        worldDt = dt * 0.35;
    }

    const isMobile = isMobileCheck();
    if(!isMobile) {
        mouse.worldX = mouse.x + gameState.camera.x;
        mouse.worldY = mouse.y + gameState.camera.y;
    } else {
        let px = player.x + player.width/2;
        let py = player.y + player.height/2;

        if(mobileState.isMobileShooting) {
            if (mobileState.manualAim) {
                // Precision Twin-Stick Manual Aiming
                mobileState.activeTarget = null;
                mouse.worldX = px + Math.cos(mobileState.aimAngle) * 450;
                mouse.worldY = py + Math.sin(mobileState.aimAngle) * 450;
                player.facingRight = (Math.cos(mobileState.aimAngle) >= 0);
            } else {
                // Smart Auto-Aim: target nearest priority enemy / boss
                let target = null, bestScore = Infinity;

                gameState.enemies.forEach(e => {
                    if(e.dead) return;
                    let ex = e.x + e.width/2;
                    let ey = e.y + e.height/2;
                    let d = Math.hypot(ex - px, ey - py);
                    if (d < 850) {
                        // Priority weighting: Bosses (x0.35 = ~3x priority), flying bats/spitters (x0.65)
                        let weight = 1.0;
                        if (e.isBoss) weight = 0.35;
                        else if (e.type === 'bat' || e.type === 'spitter') weight = 0.65;
                        
                        let score = d * weight;
                        if (score < bestScore) {
                            bestScore = score;
                            target = e;
                        }
                    }
                });

                mobileState.activeTarget = target;
                if(target) {
                    mouse.worldX = target.x + target.width/2;
                    mouse.worldY = target.y + target.height/2;
                    player.facingRight = (mouse.worldX >= px);
                } else {
                    mouse.worldX = px + (player.facingRight ? 200 : -200);
                    mouse.worldY = py;
                }
            }
        } else {
            mobileState.activeTarget = null;
            mouse.worldX = player.x + player.width/2 + (player.facingRight ? 200 : -200);
            mouse.worldY = player.y + player.height/2;
        }
    }

    player.update(dt);
    gameState.companions.forEach(c => c.update(dt));
    gameState.turrets.forEach(t => t.update(dt));

    updateCamera(dt, cw, ch);

    if(gameState.isRaining) {
        if(Math.random() < 0.3) {
            gameState.rainParticles.push({
                x: Math.random()*MAP_WIDTH,
                y: gameState.camera.y - 50,
                vx: 50,
                vy: 1000
            });
        }
        for(let i=gameState.rainParticles.length-1; i>=0; i--) {
            let r = gameState.rainParticles[i];
            r.x += r.vx*worldDt; r.y += r.vy*worldDt;
            if(r.y > gameState.camera.y + ch) gameState.rainParticles.splice(i, 1);
        }
    }

    if (gameState.gameMode === 'sandbox') {
        gameState.sandboxTime += worldDt;
        gameState.sandboxBossTimer -= worldDt;

        // Periodic boss spawns in sandbox
        if (gameState.sandboxBossTimer <= 0) {
            gameState.sandboxBossTimer = 75.0 + Math.random() * 15.0;
            let spawnPlat = platforms[Math.floor(Math.random() * (platforms.length - 1)) + 1];
            if (spawnPlat) {
                let ex = spawnPlat.x + spawnPlat.width / 2;
                let ey = spawnPlat.y - 70;
                let bossTypes = ['boss_behemoth', 'boss_broodmother', 'boss_necromancer', 'boss'];
                let chosenBoss = bossTypes[Math.floor(Math.random() * bossTypes.length)];
                gameState.enemies.push(new Enemy(ex, ey, chosenBoss));
                createFloatingText(player.x + player.width / 2, player.y - 45, "WARNING: BOSS INBOUND!", '#ef4444');
                gameState.camera.shake = 14;
            }
        }

        // Periodic explosive barrel replenishment in sandbox
        if (gameState.barrels.length < 3 && Math.random() < 0.005) {
            let p = platforms[Math.floor(Math.random() * (platforms.length - 1)) + 1];
            if (p) gameState.barrels.push(new ExplosiveBarrel(p.x + Math.random() * (p.width - 24), p.y - 32));
        }

        // Spawn interval gets faster over time: 1.8s down to 0.25s
        let spawnInterval = Math.max(0.25, 1.8 - (gameState.sandboxTime / 60) * 0.25);
        // Maximum concurrent enemies scales with time: from 14 up to 50
        let maxConcurrent = Math.min(50, 14 + Math.floor(gameState.sandboxTime / 15) * 2);

        gameState.spawnTimer -= worldDt;
        if (gameState.spawnTimer <= 0 && gameState.enemies.length < maxConcurrent) {
            gameState.spawnTimer = spawnInterval;

            // At higher survival times, spawn batches of 1-3 zombies at once
            let batch = 1 + (gameState.sandboxTime > 90 ? (Math.random() < 0.45 ? 2 : 1) : 0);
            for (let b = 0; b < batch && gameState.enemies.length < maxConcurrent; b++) {
                let spawnPlat = platforms[Math.floor(Math.random() * (platforms.length - 1)) + 1];
                let ex = spawnPlat.x + spawnPlat.width / 2;
                let ey = spawnPlat.y - 50;

                if (Math.hypot(ex - player.x, ey - player.y) > 350) {
                    let type = 'normal';
                    let r = Math.random();
                    let elapsed = gameState.sandboxTime;

                    if (elapsed > 10 && r < 0.15) type = 'swarmer';
                    else if (elapsed > 20 && r < 0.28) type = 'speedy';
                    else if (elapsed > 35 && r < 0.40) type = 'shield';
                    else if (elapsed > 50 && r < 0.52) type = 'tank';
                    else if (elapsed > 65 && r < 0.62) type = 'exploder';
                    else if (elapsed > 80 && r < 0.72) type = 'thrower';
                    else if (elapsed > 95 && r < 0.80) type = 'shock';
                    else if (elapsed > 110 && r < 0.88) type = 'stalker';
                    else if (elapsed > 125 && r < 0.94) type = 'jumper';
                    else if (elapsed > 140 && r < 0.97) type = 'mutant';
                    else if (elapsed > 155) type = (r < 0.5 ? 'spitter' : 'gargoyle');

                    gameState.enemies.push(new Enemy(ex, ey, type));
                }
            }
        }
        updateHUD();
    } else {
        if (gameState.waveKills < gameState.killsNeeded) {
            gameState.spawnTimer -= worldDt;
            if (gameState.spawnTimer <= 0) {
                gameState.spawnTimer = Math.max(0.5, 2.0 - (gameState.currentWave * 0.1));
                let spawnPlat = platforms[Math.floor(Math.random() * (platforms.length-1)) + 1]; 
                let ex = spawnPlat.x + spawnPlat.width/2;
                let ey = spawnPlat.y - 50;

                if (Math.hypot(ex - player.x, ey - player.y) > 400) {
                    let type = 'normal', r = Math.random();
                    if (gameState.currentWave % 10 === 0 && gameState.waveKills === 0) {
                        let bossTier = (gameState.currentWave / 10) % 3;
                        if (bossTier === 1) type = 'boss_behemoth';
                        else if (bossTier === 2) type = 'boss_broodmother';
                        else type = 'boss_necromancer';
                    } else {
                        let wave = gameState.currentWave;
                        if (wave > 1) {
                            if (r < 0.12) type = 'swarmer';
                            else if (r < 0.22 && wave > 2) type = 'speedy';
                            else if (r < 0.32 && wave > 2) type = 'shield';
                            else if (r < 0.42 && wave > 3) type = 'tank';
                            else if (r < 0.52 && wave > 3) type = 'exploder';
                            else if (r < 0.62 && wave > 4) type = 'thrower';
                            else if (r < 0.72 && wave > 5) type = 'shock';
                            else if (r < 0.80 && wave > 5) type = 'jumper';
                            else if (r < 0.88 && wave > 6) type = 'stalker';
                            else if (r < 0.94 && wave > 7) type = 'mutant';
                            else if (wave > 7) type = (r < 0.97 ? 'spitter' : 'gargoyle');
                        }
                    }
                    gameState.enemies.push(new Enemy(ex, ey, type));
                }
            }
        } else if (gameState.enemies.length === 0) {
            import('./ui.js').then(m => m.showPerks());
        }
    }

    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        gameState.enemies[i].update(worldDt);
        if (gameState.enemies[i].dead) {
            gameState.enemies.splice(i, 1);
            gameState.waveKills++;
            if (player && !gameState.adrenalineActive) {
                player.adrenaline = Math.min(player.adrenalineMax, player.adrenaline + 12);
                updateHUD();
            }
        }
    }
    for (let i = gameState.barrels.length - 1; i >= 0; i--) {
        if (gameState.barrels[i].hp <= 0) {
            gameState.barrels.splice(i, 1);
        }
    }
    for (let i = gameState.barricades.length - 1; i >= 0; i--) {
        if (gameState.barricades[i].dead) {
            gameState.barricades.splice(i, 1);
        }
    }
    for (let i = gameState.landmines.length - 1; i >= 0; i--) {
        gameState.landmines[i].update(worldDt);
        if (gameState.landmines[i].dead) {
            gameState.landmines.splice(i, 1);
        }
    }
    for (let i = gameState.beacons.length - 1; i >= 0; i--) {
        gameState.beacons[i].update(worldDt);
        if (gameState.beacons[i].dead) {
            gameState.beacons.splice(i, 1);
        }
    }
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        gameState.projectiles[i].update(dt);
        if (!gameState.projectiles[i].active) gameState.projectiles.splice(i, 1);
    }
    for (let i = gameState.enemyProjectiles.length - 1; i >= 0; i--) {
        gameState.enemyProjectiles[i].update(worldDt);
        if (!gameState.enemyProjectiles[i].active) gameState.enemyProjectiles.splice(i, 1);
    }
    for (let i = gameState.pickups.length - 1; i >= 0; i--) {
        gameState.pickups[i].update(dt);
        if (!gameState.pickups[i].active) gameState.pickups.splice(i, 1);
    }
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        gameState.particles[i].x += gameState.particles[i].vx * dt;
        gameState.particles[i].y += gameState.particles[i].vy * dt;
        gameState.particles[i].life -= dt;
        if (gameState.particles[i].life <= 0) gameState.particles.splice(i, 1);
    }
    for (let i = gameState.slashes.length - 1; i >= 0; i--) {
        gameState.slashes[i].life -= dt;
        if (gameState.slashes[i].life <= 0) gameState.slashes.splice(i, 1);
    }

    // Decay combo
    if (gameState.comboCount > 0) {
        gameState.comboTimer -= dt;
        if (gameState.comboTimer <= 0) {
            gameState.comboCount = 0;
            gameState.comboTimer = 0;
            import('./ui.js').then(m => m.updateHUD());
        }
    }
}

function drawGame() {
    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    
    let camera = gameState.camera;
    let sx = camera.shake > 0 ? (Math.random()-0.5)*camera.shake : 0;
    let sy = camera.shake > 0 ? (Math.random()-0.5)*camera.shake : 0;
    ctx.translate(-camera.x + sx, -camera.y + sy);

    ctx.fillStyle = gameState.isRaining ? "#1e293b" : "#0f172a";
    ctx.fillRect(camera.x, camera.y, cw, ch);

    platforms.forEach(p => {
        ctx.fillStyle = "#451a03"; ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = gameState.isRaining ? "#166534" : "#15803d"; ctx.fillRect(p.x, p.y, p.width, 10);
    });

    gameState.turrets.forEach(t => t.draw(ctx));
    gameState.barricades.forEach(b => b.draw(ctx));
    gameState.landmines.forEach(m => m.draw(ctx));
    gameState.beacons.forEach(b => b.draw(ctx));
    gameState.carePackages.forEach(cp => cp.draw(ctx));
    gameState.pickups.forEach(p => p.draw(ctx));
    gameState.barrels.forEach(b => b.draw(ctx));
    gameState.player.draw(ctx);
    gameState.enemies.forEach(e => e.draw(ctx));
    gameState.projectiles.forEach(p => p.draw(ctx));
    gameState.enemyProjectiles.forEach(p => p.draw(ctx));

    gameState.slashes.forEach(s => {
        let alpha = s.life / s.maxLife;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`; ctx.lineWidth = 4; ctx.beginPath();
        let startAngle = s.facingRight ? -Math.PI/4 : Math.PI + Math.PI/4;
        let endAngle = s.facingRight ? Math.PI/4 : Math.PI - Math.PI/4;
        ctx.arc(s.x, s.y, s.radius, startAngle, endAngle, !s.facingRight); ctx.stroke();
    });

    gameState.particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, Math.min(1.0, p.life * 2));
        if (p.text) {
            ctx.fillStyle = p.color;
            ctx.font = '800 16px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y);
        } else {
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        }
    });
    ctx.globalAlpha = 1.0;

    if(gameState.isRaining) {
        ctx.strokeStyle = "rgba(100, 150, 255, 0.3)"; ctx.lineWidth = 1; ctx.beginPath();
        gameState.rainParticles.forEach(r => { ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - 5, r.y + 20); });
        ctx.stroke();
        
        let grad = ctx.createRadialGradient(gameState.player.x, gameState.player.y, 200, gameState.player.x, gameState.player.y, 800);
        grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(1, "rgba(0,0,0,0.7)");
        ctx.fillStyle = grad; ctx.fillRect(camera.x, camera.y, cw, ch);
    }
    ctx.restore();

    // Draw off-screen threat indicators
    if (gameState.currentState === GameState.PLAYING) {
        let camX = gameState.camera.x;
        let camY = gameState.camera.y;

        gameState.enemies.forEach(e => {
            if (e.dead) return;
            let screenX = e.x + e.width/2 - camX;
            let screenY = e.y + e.height/2 - camY;

            let border = 25; 
            if (screenX < 0 || screenX > cw || screenY < 0 || screenY > ch) {
                let cx = cw / 2;
                let cy = ch / 2;
                let dx = screenX - cx;
                let dy = screenY - cy;
                let angle = Math.atan2(dy, dx);

                let px = cx;
                let py = cy;
                let slope = dx / (dy || 1);
                
                if (dx > 0) {
                    px = cw - border;
                    py = cy + (px - cx) / slope;
                } else {
                    px = border;
                    py = cy + (px - cx) / slope;
                }
                
                if (py < border) {
                    py = border;
                    px = cx + (py - cy) * slope;
                } else if (py > ch - border) {
                    py = ch - border;
                    px = cx + (py - cy) * slope;
                }

                px = Math.max(border, Math.min(cw - border, px));
                py = Math.max(border, Math.min(ch - border, py));

                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(angle);
                
                let arrowColor = '#ef4444';
                if (e.isBoss) arrowColor = '#f43f5e';
                else if (e.type === 'speedy') arrowColor = '#06b6d4';
                else if (e.type === 'spitter') arrowColor = '#a3e635';
                else if (e.type === 'gargoyle') arrowColor = '#a78bfa';
                else if (e.type === 'exploder') arrowColor = '#f97316';
                else if (e.type === 'shield') arrowColor = '#64748b';
                else if (e.type === 'shock') arrowColor = '#38bdf8';
                else if (e.type === 'stalker') arrowColor = '#818cf8';
                else if (e.type === 'swarmer') arrowColor = '#84cc16';
                
                ctx.fillStyle = arrowColor;
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1.5;

                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(-6, -7);
                ctx.lineTo(-6, 7);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.restore();
            }
        });

        // Off-screen care package indicators (gold)
        gameState.carePackages.forEach(cp => {
            if (cp.collected) return;
            let screenX = cp.x + cp.width/2 - camX;
            let screenY = cp.y + cp.height/2 - camY;
            let border = 25;
            if (screenX < 0 || screenX > cw || screenY < 0 || screenY > ch) {
                let cx2 = cw / 2, cy2 = ch / 2;
                let adx = screenX - cx2, ady = screenY - cy2;
                let aAngle = Math.atan2(ady, adx);
                let apx = cx2, apy = cy2;
                let aSlope = adx / (ady || 1);
                if (adx > 0) { apx = cw - border; apy = cy2 + (apx - cx2) / aSlope; }
                else { apx = border; apy = cy2 + (apx - cx2) / aSlope; }
                if (apy < border) { apy = border; apx = cx2 + (apy - cy2) * aSlope; }
                else if (apy > ch - border) { apy = ch - border; apx = cx2 + (apy - cy2) * aSlope; }
                apx = Math.max(border, Math.min(cw - border, apx));
                apy = Math.max(border, Math.min(ch - border, apy));
                ctx.save();
                ctx.translate(apx, apy);
                ctx.rotate(aAngle);
                ctx.fillStyle = '#fbbf24';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(-6, -7);
                ctx.lineTo(-6, 7);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        });
    }

    if(!isMobileCheck()) {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 10, 0, Math.PI*2);
        ctx.moveTo(mouse.x-15, mouse.y); ctx.lineTo(mouse.x+15, mouse.y);
        ctx.moveTo(mouse.x, mouse.y-15); ctx.lineTo(mouse.x, mouse.y+15);
        ctx.stroke();
    } else if (mobileState.manualAim && mobileState.isMobileShooting && gameState.player) {
        // Precision Twin-Stick Drag Aim Reticle & Direction Line
        const px = (gameState.player.x + gameState.player.width/2) - gameState.camera.x;
        const py = (gameState.player.y + gameState.player.height/2) - gameState.camera.y;
        const targetScreenX = mouse.worldX - gameState.camera.x;
        const targetScreenY = mouse.worldY - gameState.camera.y;

        ctx.save();
        // Laser guide line
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(targetScreenX, targetScreenY);
        ctx.stroke();

        // Directional reticle ring
        ctx.setLineDash([]);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(targetScreenX, targetScreenY, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(targetScreenX, targetScreenY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    } else if (mobileState.activeTarget && !mobileState.activeTarget.dead) {
        const t = mobileState.activeTarget;
        const tx = (t.x + t.width/2) - gameState.camera.x;
        const ty = (t.y + t.height/2) - gameState.camera.y;
        const r = Math.max(t.width, t.height) / 2 + 10;
        
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        
        const bSize = 6;
        ctx.beginPath();
        // Top-left bracket
        ctx.moveTo(tx - r, ty - r + bSize); ctx.lineTo(tx - r, ty - r); ctx.lineTo(tx - r + bSize, ty - r);
        // Top-right bracket
        ctx.moveTo(tx + r - bSize, ty - r); ctx.lineTo(tx + r, ty - r); ctx.lineTo(tx + r, ty - r + bSize);
        // Bottom-left bracket
        ctx.moveTo(tx - r, ty + r - bSize); ctx.lineTo(tx - r, ty + r); ctx.lineTo(tx - r + bSize, ty + r);
        // Bottom-right bracket
        ctx.moveTo(tx + r - bSize, ty + r); ctx.lineTo(tx + r, ty + r); ctx.lineTo(tx + r, ty + r - bSize);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.beginPath();
        ctx.arc(tx, ty, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Draw "E" interact hint near turrets/barricades within range
    if (gameState.player) {
        const player = gameState.player;
        let camX = gameState.camera.x;
        let camY = gameState.camera.y;
        let hintRange = 70;

        [...gameState.turrets, ...gameState.barricades].forEach(obj => {
            let ox = obj.x + (obj.isBarricade ? 20 : 10);
            let oy = obj.y + (obj.isBarricade ? 20 : 15);
            let d = Math.hypot(ox - (player.x + player.width/2), oy - (player.y + player.height/2));
            if (d < hintRange) {
                let sx = ox - camX;
                let sy = (obj.y - camY) - 20;
                ctx.save();
                ctx.font = 'bold 11px Outfit';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.beginPath();
                ctx.roundRect(sx - 28, sy - 14, 56, 18, 6);
                ctx.fill();
                ctx.fillStyle = '#10b981';
                ctx.fillText(obj.isBarricade ? '[E] Repair' : '[E] Upgrade', sx, sy);
                ctx.restore();
            }
        });
    }
}

function gameLoop() {
    requestAnimationFrame(gameLoop);
    let now = performance.now();
    let dt = (now - lastTimeRef.value) / 1000;
    lastTimeRef.value = now;
    if (dt > 0.1) dt = 0.1;

    if (gameState.currentState === GameState.PLAYING) {
        updateGame(dt); drawGame();
    } else if (gameState.currentState === GameState.PAUSED) {
        drawGame(); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, cw, ch);
    } else if (gameState.currentState === GameState.MENU) {
        drawGame(); ctx.fillStyle = 'rgba(3, 7, 18, 0.85)'; ctx.fillRect(0, 0, cw, ch);
    }
}

// Bootstrap
generateMap();
gameState.player = new Player();
initInput(handleGrappleInput, togglePause, isMobileCheck, () => gameState.currentState, GameState, handlePlaceTurret, handleUltimate, handlePlaceBarricade, handleInteract, handlePlaceLandmine, handlePlaceBeacon);
setupMobileControls(
    handleGrappleInput, 
    isMobileCheck, 
    () => gameState.currentState, 
    GameState, 
    togglePause,
    handlePlaceTurret,
    handleUltimate,
    handlePlaceBarricade,
    handleInteract,
    handlePlaceLandmine,
    handlePlaceBeacon
);
gameState.currentState = GameState.MENU;
const menuEl = document.getElementById('ui-menu');
if (menuEl) menuEl.classList.remove('hidden');
const hudEl = document.getElementById('ui-hud');
if (hudEl) hudEl.classList.add('hidden');
updateDeviceUI();
gameLoop();
