import { gameState, isMobileCheck } from './state.js';
import { GameState, MAP_WIDTH, MAP_HEIGHT } from './constants.js';
import { generateMap, platforms } from './physics.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { Turret } from './entities/Turret.js';
import { Barricade } from './entities/Barricade.js';
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
    if ((player.turretInventory || 0) > 0) {
        player.turretInventory--;
        if (!player.turretInventoryList) player.turretInventoryList = [];
        let tType = player.turretInventoryList.pop() || 'bullet';
        gameState.turrets.push(new Turret(player.x, player.y, tType));
        updateHUD();
    }
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
        let bx = player.x + player.width/2 - 20;
        let by = player.y + player.height - 40;
        gameState.barricades.push(new Barricade(bx, by));
        player.barricadeInventory--;
        updateHUD();
    }
}

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
        if(mobileState.isMobileShooting) {
            let target = null, minDist = 800;
            gameState.enemies.forEach(e => {
                if(e.dead) return;
                let d = Math.hypot((e.x+e.width/2) - (player.x+player.width/2), (e.y+e.height/2) - (player.y+player.height/2));
                if(d < minDist) { minDist = d; target = e; }
            });
            if(target) {
                mouse.worldX = target.x + target.width/2;
                mouse.worldY = target.y + target.height/2;
            } else {
                mouse.worldX = player.x + player.width/2 + (player.facingRight ? 200 : -200);
                mouse.worldY = player.y + player.height/2;
            }
        } else {
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
                    type = 'boss';
                } else {
                    if (gameState.currentWave > 1) {
                        if (r < 0.12 && gameState.currentWave > 2) type = 'speedy';
                        else if (r < 0.25 && gameState.currentWave > 2) type = 'tank';
                        else if (r < 0.38 && gameState.currentWave > 3) type = 'thrower';
                        else if (r < 0.51 && gameState.currentWave > 4) type = 'jumper';
                        else if (r < 0.64 && gameState.currentWave > 5) type = 'mutant';
                        else if (r < 0.77 && gameState.currentWave > 6) type = 'spitter';
                        else if (r < 0.90 && gameState.currentWave > 7) type = 'gargoyle';
                    }
                }
                gameState.enemies.push(new Enemy(ex, ey, type));
            }
        }
    } else if (gameState.enemies.length === 0) {
        import('./ui.js').then(m => m.showPerks());
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
                if (e.type === 'speedy') arrowColor = '#06b6d4';
                else if (e.type === 'spitter') arrowColor = '#a3e635';
                else if (e.type === 'boss') arrowColor = '#f43f5e';
                else if (e.type === 'gargoyle') arrowColor = '#a78bfa';
                
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
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRoundRect(sx - 22, sy - 14, 44, 18, 6);
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
    }
}

// Bootstrap
generateMap();
gameState.player = new Player();
initInput(handleGrappleInput, togglePause, isMobileCheck, () => gameState.currentState, GameState, handlePlaceTurret, handleUltimate, handlePlaceBarricade, handleInteract);
setupMobileControls(handleGrappleInput, isMobileCheck, () => gameState.currentState, GameState, togglePause);
startWave();
gameLoop();
