import { Rect, platforms } from '../physics.js';
import { GRAVITY } from '../constants.js';
import { gameState } from '../state.js';
import { createParticles, createExplosion, createFloatingText } from '../effects.js';
import { Projectile } from './Projectile.js';
import { Pickup } from './Pickup.js';
import { drawZombie } from '../drawHelpers.js';
import { updateHUD } from '../ui.js';

export class Enemy extends Rect {
    constructor(x, y, type = 'normal') {
        super(x, y, 30, 40);
        this.type = type; 
        this.vx = 0; 
        this.vy = 0;
        this.grounded = false;
        this.onFire = 0;
        this.frozen = 0;
        this.dead = false;
        this.isBoss = type.startsWith('boss');
        
        let effectiveLevel = gameState.gameMode === 'sandbox'
            ? (1 + (gameState.sandboxTime / 20))
            : gameState.currentWave;
        let hpScale = 1 + (effectiveLevel * 0.16);
        let spdScale = 1 + Math.min(1.5, effectiveLevel * 0.04);

        switch(type) {
            case 'tank':
                this.width = 50; this.height = 60; this.color = '#6b7280';
                this.maxHp = 300 * hpScale; this.speed = 100 * spdScale;
                this.score = 50; this.money = 45; break;
            case 'thrower':
                this.color = '#eab308';
                this.maxHp = 80 * hpScale; this.speed = 150 * spdScale;
                this.score = 30; this.money = 35; this.cd = 2.0; break;
            case 'mutant': 
                this.color = '#a855f7';
                this.maxHp = 100 * hpScale; this.speed = 220 * spdScale;
                this.score = 40; this.money = 40; break;
            case 'speedy':
                this.width = 25; this.height = 35; this.color = '#06b6d4';
                this.maxHp = 50 * hpScale; this.speed = 300 * spdScale;
                this.score = 15; this.money = 25; break;
            case 'jumper':
                this.color = '#f97316';
                this.maxHp = 120 * hpScale; this.speed = 140 * spdScale;
                this.score = 25; this.money = 30; this.jumpCd = 0; break;
            case 'spitter':
                this.color = '#a3e635';
                this.maxHp = 90 * hpScale; this.speed = 120 * spdScale;
                this.score = 35; this.money = 40; this.cd = 2.5; break;
            case 'gargoyle':
                this.width = 30; this.height = 30; this.color = '#7c3aed';
                this.maxHp = 60 * hpScale; this.speed = 160 * spdScale;
                this.score = 25; this.money = 30; this.cd = 2.0; this.wingFlapLeft = false; this.flapTimer = 0; break;

            // --- 5 NEW CREEPS ---
            case 'exploder':
                this.width = 38; this.height = 46; this.color = '#dc2626';
                this.maxHp = 140 * hpScale; this.speed = 210 * spdScale;
                this.score = 35; this.money = 35;
                this.fuseTimer = 1.2; this.isTicking = false;
                break;
            case 'shield':
                this.width = 36; this.height = 46; this.color = '#475569';
                this.maxHp = 220 * hpScale; this.speed = 130 * spdScale;
                this.score = 45; this.money = 40;
                break;
            case 'stalker':
                this.width = 28; this.height = 38; this.color = '#1e1b4b';
                this.maxHp = 70 * hpScale; this.speed = 250 * spdScale;
                this.score = 40; this.money = 35;
                this.cloakAlpha = 0.2;
                break;
            case 'swarmer':
                this.width = 20; this.height = 20; this.color = '#84cc16';
                this.maxHp = 30 * hpScale; this.speed = 340 * spdScale;
                this.score = 10; this.money = 12;
                break;
            case 'shock':
                this.width = 32; this.height = 42; this.color = '#38bdf8';
                this.maxHp = 110 * hpScale; this.speed = 170 * spdScale;
                this.score = 40; this.money = 40;
                this.cd = 2.2;
                break;

            // --- 3 UNIQUE EPIC BOSSES ---
            case 'boss_behemoth':
                this.width = 90; this.height = 110; this.color = '#78716c';
                this.bossName = 'THE BEHEMOTH';
                this.bossTitle = 'EARTHSHAKER TITAN';
                this.maxHp = 3400 * hpScale; this.speed = 190 * spdScale;
                this.score = 800; this.money = 900;
                this.slamCd = 4.0; this.chargeCd = 7.0; this.isCharging = false; this.chargeTimer = 0;
                break;
            case 'boss_broodmother':
                this.width = 80; this.height = 95; this.color = '#15803d';
                this.bossName = 'THE BROODMOTHER';
                this.bossTitle = 'ACID SWARM QUEEN';
                this.maxHp = 2700 * hpScale; this.speed = 160 * spdScale;
                this.score = 750; this.money = 850;
                this.spitCd = 3.0; this.eggCd = 7.5;
                break;
            case 'boss_necromancer':
                this.width = 70; this.height = 90; this.color = '#6b21a8';
                this.bossName = 'THE NECROMANCER';
                this.bossTitle = 'CYBER LICH OVERLORD';
                this.maxHp = 2400 * hpScale; this.speed = 150 * spdScale;
                this.score = 850; this.money = 1000;
                this.teleportCd = 6.0; this.orbitalCd = 5.0; this.raiseCd = 9.0;
                this.orbitalAiming = false; this.orbitalAimTimer = 0;
                break;
            case 'boss':
                this.width = 80; this.height = 100;
                this.bossName = 'GOLIATH';
                this.bossTitle = 'INFECTED COLOSSUS';
                this.maxHp = 2000 * hpScale; this.speed = 250 * spdScale;
                this.score = 500; this.money = 600; this.stompCd = 5.0;
                let roll = Math.random();
                if (roll < 0.33) {
                    this.mutator = 'Shielded';
                    this.bossShield = 800; this.maxBossShield = 800;
                    this.color = '#1e3a8a'; 
                } else if (roll < 0.66) {
                    this.mutator = 'Toxic';
                    this.color = '#065f46'; this.toxicTimer = 0;
                } else {
                    this.mutator = 'Splitter';
                    this.color = '#9a3412'; 
                }
                break;
            default:
                this.color = '#22c55e';
                this.maxHp = 100 * hpScale; this.speed = 180 * spdScale;
                this.score = 10; this.money = 20;
        }
        this.hp = this.maxHp;
    }

    update(dt) {
        if(this.dead) return;
        const player = gameState.player;
        if (!player) return;

        if(this.onFire > 0) {
            this.onFire -= dt; 
            this.takeDamage(10 * dt); 
            createParticles(this.x + this.width/2, this.y, 1, '#f97316', 50);
        }
        let moveSpeed = this.speed;
        if(this.frozen > 0) {
            this.frozen -= dt; 
            moveSpeed *= 0.5; 
            this.color = '#38bdf8'; 
        }
        if(this.onFire > 0) {
            moveSpeed *= 0.6;
        }

        let dx = (player.x + player.width/2) - (this.x + this.width/2);
        let dy = (player.y + player.height/2) - (this.y + this.height/2);
        let dist = Math.hypot(dx, dy);

        // Check barricades blockage
        let barricadeBlocked = false;
        if (this.type !== 'gargoyle' && this.type !== 'boss_necromancer') {
            for (let b of gameState.barricades) {
                if (this.intersects(b)) {
                    barricadeBlocked = true;
                    this.vx = 0;
                    this.attackCd = (this.attackCd || 0) - dt;
                    if (this.attackCd <= 0) {
                        b.takeDamage(this.isBoss ? 45 : 15);
                        this.attackCd = 1.0;
                    }
                    break;
                }
            }
        }

        if (barricadeBlocked) {
            // Blocked by barricade
        } else if (this.type === 'gargoyle') {
            let targetY = player.y - 120;
            let targetX = player.x + (this.wingFlapLeft ? -150 : 150);
            if (Math.random() < 0.005) this.wingFlapLeft = !this.wingFlapLeft;
            
            let tdx = targetX - this.x;
            let tdy = targetY - this.y;
            let td = Math.hypot(tdx, tdy);
            if (td > 10) {
                this.vx = (tdx / td) * moveSpeed;
                this.vy = (tdy / td) * moveSpeed;
            }
            this.flapTimer = (this.flapTimer || 0) + dt * 10;
            this.cd = (this.cd || 2.0) - dt;
            if (this.cd <= 0 && dist < 600) {
                this.cd = 2.5;
                let angle = Math.atan2((player.y+player.height/2) - this.y, (player.x+player.width/2) - this.x);
                gameState.enemyProjectiles.push(new Projectile(this.x + this.width/2, this.y + this.height/2, angle, 450, 15, '#c084fc', false, true));
            }
        } else if (this.type === 'thrower' || this.type === 'spitter') {
            let targetDist = this.type === 'thrower' ? 300 : 350;
            let farDist = this.type === 'thrower' ? 500 : 550;
            if (dist < targetDist) this.vx = (dx > 0 ? -1 : 1) * moveSpeed; 
            else if (dist > farDist) this.vx = (dx > 0 ? 1 : -1) * moveSpeed; 
            else this.vx *= Math.pow(0.9, dt * 60); 
            
            this.cd -= dt;
            if (this.cd <= 0 && dist < 650) {
                this.cd = this.type === 'thrower' ? 2.0 : 2.5;
                let angle = Math.atan2(dy, dx);
                let bulletColor = this.type === 'thrower' ? '#eab308' : '#a3e635';
                let bulletDmg = this.type === 'thrower' ? 15 : 22;
                let bulletSpeed = this.type === 'thrower' ? 400 : 550;
                gameState.enemyProjectiles.push(new Projectile(this.x + this.width/2, this.y + this.height/2, angle, bulletSpeed, bulletDmg, bulletColor, this.type === 'thrower', true));
            }
        } else if (this.type === 'jumper') {
            this.jumpCd -= dt;
            if (this.jumpCd <= 0 && this.grounded && dist < 350) {
                this.vy = -950;
                this.vx = (dx > 0 ? 1.5 : -1.5) * moveSpeed;
                this.jumpCd = 3.0;
                this.grounded = false;
            } else if (!this.grounded) {
                this.vx = (dx > 0 ? 1.2 : -1.2) * moveSpeed;
            } else {
                this.vx = (dx > 0 ? 1 : -1) * moveSpeed;
            }
        } else if (this.type === 'exploder') {
            // Ticking suicide rusher
            if (dist < 75) {
                this.isTicking = true;
            }
            if (this.isTicking) {
                this.fuseTimer -= dt;
                createParticles(this.x + this.width/2, this.y, 1, '#f97316', 40);
                if (this.fuseTimer <= 0) {
                    this.die();
                    return;
                }
            }
            this.vx = (dx > 0 ? 1 : -1) * (this.isTicking ? moveSpeed * 1.3 : moveSpeed);
        } else if (this.type === 'stalker') {
            this.cloakAlpha = Math.max(0.12, Math.min(0.85, dist / 350));
            let speedMult = dist < 160 ? 1.6 : 1.0;
            this.vx = (dx > 0 ? 1 : -1) * moveSpeed * speedMult;
        } else if (this.type === 'shock') {
            this.vx = (dx > 0 ? 1 : -1) * moveSpeed;
            this.cd -= dt;
            if (this.cd <= 0 && dist < 240) {
                this.cd = 2.4;
                let angle = Math.atan2(dy, dx);
                gameState.enemyProjectiles.push(new Projectile(this.x + this.width/2, this.y + this.height/2, angle, 650, 18, '#38bdf8', false, true));
                createParticles(this.x + this.width/2, this.y + this.height/2, 8, '#38bdf8', 120);
            }
        } else if (this.type === 'boss_behemoth') {
            // Charge attack
            this.chargeCd -= dt;
            if (this.chargeCd <= 0 && this.grounded && !this.isCharging && dist < 650) {
                this.isCharging = true;
                this.chargeTimer = 1.8;
                this.chargeDir = dx > 0 ? 1 : -1;
                this.chargeCd = 8.5;
                createFloatingText(this.x + this.width/2, this.y - 25, "CHARGING!", '#ef4444');
            }

            if (this.isCharging) {
                this.chargeTimer -= dt;
                this.vx = this.chargeDir * 520;
                createParticles(this.x + (this.chargeDir > 0 ? 0 : this.width), this.y + this.height, 3, '#78716c', 80);
                if (this.chargeTimer <= 0) {
                    this.isCharging = false;
                }
            } else {
                this.vx = (dx > 0 ? 1 : -1) * moveSpeed;
                // Shockwave jump slam
                this.slamCd -= dt;
                if (this.slamCd <= 0 && this.grounded) {
                    this.vy = -750;
                    this.slamCd = 5.5;
                    this.willShockwave = true;
                }
            }
        } else if (this.type === 'boss_broodmother') {
            this.vx = (dx > 0 ? 1 : -1) * moveSpeed;

            // Acid mortar barrage
            this.spitCd -= dt;
            if (this.spitCd <= 0 && dist < 850) {
                this.spitCd = 3.5;
                for (let i = 0; i < 3; i++) {
                    let a = Math.atan2(dy - 100, dx) + (i - 1) * 0.22;
                    gameState.enemyProjectiles.push(new Projectile(this.x + this.width/2, this.y, a, 450, 22, '#22c55e', true, true));
                }
            }

            // Swarm spawns
            this.eggCd -= dt;
            if (this.eggCd <= 0) {
                this.eggCd = 8.0;
                createFloatingText(this.x + this.width/2, this.y - 25, "BROOD HATCH!", '#84cc16');
                for (let i = 0; i < 3; i++) {
                    let offset = (i - 1) * 30;
                    gameState.enemies.push(new Enemy(this.x + this.width/2 + offset, this.y - 10, 'swarmer'));
                }
            }
        } else if (this.type === 'boss_necromancer') {
            this.vx = (dx > 0 ? 1 : -1) * moveSpeed * 0.7;

            // Orbital death ray
            this.orbitalCd -= dt;
            if (this.orbitalCd <= 0 && !this.orbitalAiming) {
                this.orbitalAiming = true;
                this.orbitalAimTimer = 1.3;
                this.orbitalTargetX = player.x + player.width/2;
                this.orbitalTargetY = player.y + player.height/2;
                this.orbitalCd = 6.0;
                createFloatingText(player.x + player.width/2, player.y - 30, "ORBITAL STRIKE!", '#dc2626');
            }

            if (this.orbitalAiming) {
                this.orbitalAimTimer -= dt;
                // Tracking reticle
                this.orbitalTargetX += ((player.x + player.width/2) - this.orbitalTargetX) * 0.08;
                this.orbitalTargetY += ((player.y + player.height/2) - this.orbitalTargetY) * 0.08;

                if (this.orbitalAimTimer <= 0) {
                    this.orbitalAiming = false;
                    createExplosion(this.orbitalTargetX, this.orbitalTargetY, 150, 40);
                    gameState.camera.shake = 10;
                    createParticles(this.orbitalTargetX, this.orbitalTargetY, 25, '#ef4444', 300);
                }
            }

            // Raise dead minions
            this.raiseCd -= dt;
            if (this.raiseCd <= 0) {
                this.raiseCd = 10.0;
                createFloatingText(this.x + this.width/2, this.y - 25, "ARISE!", '#a855f7');
                gameState.enemies.push(new Enemy(this.x - 40, this.y - 10, 'shield'));
                gameState.enemies.push(new Enemy(this.x + this.width + 10, this.y - 10, 'speedy'));
            }
        } else {
            this.vx = (dx > 0 ? 1 : -1) * moveSpeed;
        }

        // Generic boss slam
        if(this.type === 'boss') {
            this.stompCd -= dt;
            if(this.stompCd <= 0 && this.grounded && dist < 400) {
                this.vy = -800; this.stompCd = 4.0;
            } else if (this.grounded && this.vy > 500) {
                createExplosion(this.x+this.width/2, this.y+this.height, 300, 0, true); 
                player.vx += dx > 0 ? -800 : 800;
                player.takeDamage(30); this.vy = 0;
            }
        }

        if (this.type === 'boss' && this.mutator === 'Toxic' && !this.dead) {
            this.toxicTimer = (this.toxicTimer || 0) + dt;
            if (this.toxicTimer > 0.6) {
                this.toxicTimer = 0;
                let angle = -Math.PI/2 + (Math.random() - 0.5) * 0.4;
                gameState.enemyProjectiles.push(new Projectile(this.x + this.width/2, this.y, angle, 300, 12, '#22c55e', false, true));
            }
            createParticles(this.x + this.width/2, this.y + this.height/2, 1, '#10b981', 50);
        }

        if (this.type === 'gargoyle') {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        } else {
            if (this.grounded && dy < -50 && Math.abs(dx) < 150 && Math.random() < 0.05) {
                this.vy = -800; this.grounded = false;
            }

            if (this.grounded && Math.abs(this.vx) > 0) {
                let gapAhead = true;
                let checkX = this.x + (this.vx > 0 ? this.width + 10 : -10);
                for(let p of platforms) {
                    if (checkX > p.x && checkX < p.x + p.width && Math.abs(p.y - (this.y + this.height)) < 50) {
                        gapAhead = false; break;
                    }
                }
                if (gapAhead && Math.random() < 0.1) {
                    this.vy = -600; this.grounded = false;
                }
            }

            this.vy += GRAVITY * dt;
            this.x += this.vx * dt; this.resolveCollisions(true);
            this.y += this.vy * dt; this.resolveCollisions(false);
        }

        if (this.intersects(player) && !this.dead) {
            let contactDmg = this.isBoss ? 35 : (this.type === 'swarmer' ? 6 : 10);
            player.takeDamage(contactDmg);
            this.vx = (dx > 0 ? -1 : 1) * 300; 
            player.vx = (dx > 0 ? 1 : -1) * 300;
        }
    }

    resolveCollisions(horizontal) {
        this.grounded = false;
        for (let p of platforms) {
            if (this.intersects(p)) {
                if (horizontal) {
                    if (this.vx > 0) this.x = p.x - this.width;
                    else if (this.vx < 0) this.x = p.x + p.width;
                    this.vx = 0;
                } else {
                    if (this.vy > 0) {
                        this.y = p.y - this.height; 
                        this.grounded = true;

                        // Behemoth shockwave generation on landing
                        if (this.type === 'boss_behemoth' && this.willShockwave) {
                            this.willShockwave = false;
                            gameState.camera.shake = 12;
                            createExplosion(this.x + this.width/2, this.y + this.height, 180, 25);
                            gameState.enemyProjectiles.push(new Projectile(this.x + this.width/2, this.y + this.height - 10, 0, 520, 24, '#78716c', false, true, false, { isShockwave: true, life: 1.5 }));
                            gameState.enemyProjectiles.push(new Projectile(this.x + this.width/2, this.y + this.height - 10, Math.PI, 520, 24, '#78716c', false, true, false, { isShockwave: true, life: 1.5 }));
                        }
                    } else if (this.vy < 0) {
                        this.y = p.y + p.height;
                    }
                    this.vy = 0;
                }
            }
        }
    }

    takeDamage(dmg) {
        if(this.dead) return;
        
        if (this.mutator === 'Shielded' && this.bossShield > 0) {
            this.bossShield -= dmg;
            if (this.bossShield < 0) {
                this.hp += this.bossShield;
                this.bossShield = 0;
            }
            createParticles(this.x+this.width/2, this.y+this.height/2, 4, '#3b82f6', 150);
        } else {
            this.hp -= dmg;
            createParticles(this.x+this.width/2, this.y+this.height/2, 3, this.color, 100);
        }

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        if (this.dead) return;
        this.dead = true;
        
        if (this.mutator === 'Splitter') {
            for (let i = 0; i < 2; i++) {
                gameState.enemies.push(new Enemy(this.x + i * 20, this.y, 'speedy'));
            }
        }

        gameState.comboCount++;
        gameState.comboTimer = 4.0;
        
        let comboMult = 1 + Math.min(10, Math.floor(gameState.comboCount / 5)) * 0.1;
        let moneyEarned = Math.floor(this.money * comboMult);
        
        gameState.totalKills = (gameState.totalKills || 0) + 1;
        gameState.score += this.score; 
        if (gameState.gameMode !== 'sandbox') {
            gameState.money += moneyEarned;
        }
        updateHUD();
        
        const player = gameState.player;
        if(player && player.perks && player.perks.lifesteal > 0 && player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + player.perks.lifesteal);
            updateHUD();
        }

        if(this.type === 'exploder') {
            createExplosion(this.x + this.width/2, this.y + this.height/2, 140, 50, true);
        } else if(this.type === 'shock') {
            createParticles(this.x + this.width/2, this.y + this.height/2, 25, '#38bdf8', 250);
        } else if(this.type === 'mutant') {
            createExplosion(this.x + this.width/2, this.y + this.height/2, 120, 40, true);
        }

        createParticles(this.x + this.width/2, this.y + this.height/2, this.isBoss ? 60 : 15, this.color, this.isBoss ? 450 : 200);
        
        if (Math.random() < 0.2 || this.isBoss) {
            gameState.pickups.push(new Pickup(this.x, this.y, 'carrot'));
        }
    }

    draw(ctx) {
        if(this.dead) return;

        // Draw wings for flying gargoyle
        if (this.type === 'gargoyle') {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.fillStyle = '#475569';
            let angle = Math.sin((this.flapTimer || 0)) * 0.6;
            ctx.save();
            ctx.rotate(-angle);
            ctx.beginPath();
            ctx.ellipse(-this.width/2 - 4, -4, 14, 7, -Math.PI/6, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.ellipse(this.width/2 + 4, -4, 14, 7, Math.PI/6, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
            ctx.restore();
        }

        // Draw orbital tracking reticle for Necromancer
        if (this.type === 'boss_necromancer' && this.orbitalAiming) {
            ctx.save();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.orbitalTargetX, this.orbitalTargetY, 25, 0, Math.PI * 2);
            ctx.moveTo(this.orbitalTargetX - 35, this.orbitalTargetY);
            ctx.lineTo(this.orbitalTargetX + 35, this.orbitalTargetY);
            ctx.moveTo(this.orbitalTargetX, this.orbitalTargetY - 35);
            ctx.lineTo(this.orbitalTargetX, this.orbitalTargetY + 35);
            ctx.stroke();
            ctx.restore();
        }

        drawZombie(ctx, this.x, this.y, this.width, this.height, this.vx >= 0, this.color, this.hp / this.maxHp, this.type, this);
    }
}
