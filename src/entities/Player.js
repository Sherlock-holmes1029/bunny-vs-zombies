import { Rect, platforms } from '../physics.js';
import { GRAVITY, FRICTION, MAP_WIDTH } from '../constants.js';
import { gameState } from '../state.js';
import { keys, mouse } from '../input.js';
import { createParticles, createMeleeSlash, createFloatingText } from '../effects.js';
import { drawBunny } from '../drawHelpers.js';
import { updateHUD, triggerGameOver } from '../ui.js';
import { Projectile } from './Projectile.js';
import { FlameProjectile } from './FlameProjectile.js';

export class Player extends Rect {
    constructor() {
        super(MAP_WIDTH/2, 100, 30, 40);
        this.vx = 0; this.vy = 0;
        this.speed = 600; this.jumpForce = -750;
        this.maxHp = 100; this.hp = 100;
        this.facingRight = true;
        this.grounded = false;
        
        this.dashSpeed = 1200;
        this.dashDuration = 0.15;
        this.dashTimer = 0;
        this.dashCooldown = 1.0;
        this.dashCooldownTimer = 0;
        this.isDashing = false;
        
        this.grapple = { active: false, x: 0, y: 0 };
        this.perks = { lifesteal: 0, reloadMult: 1, dmgMult: 1, speedMult: 1, droneRate: 1.0, droneDmg: 1.0, droneMulti: 1 };
        
        this.weapons = [
            { id: 'pistol', name: 'Pistol', slot: 0, dmg: 40, fireRate: 0.12, maxAmmo: 30, reloadTime: 0.8, ammo: 30, reloading: false, reloadTimer: 0, cd: 0, spread: 0.02, color: '#9ca3af', type: 'semi', attachments: { laser: false, extMags: false, suppressor: false }, lvlDmg: 0, lvlRate: 0, lvlAmmo: 0 },
            null, null, null 
        ];
        this.currentWeaponIndex = 0;
        this.damageFlash = 0;
        this.invulnerableTimer = 0;
        this.turretInventory = 0;
        this.barricadeInventory = 0;
        this.landmineInventory = 0;
        this.beaconInventory = 0;
        this.maxShield = 50;
        this.shield = 50;
        this.shieldRegenTimer = 0;
        this.isGrappleSlamming = false;
        this.adrenaline = 0;
        this.adrenalineMax = 100;
    }

    getWeapon() { return this.weapons[this.currentWeaponIndex]; }

    update(dt) {
        if(this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
        if(this.damageFlash > 0) this.damageFlash -= dt;
        if(this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
        
        if(this.shieldRegenTimer > 0) {
            this.shieldRegenTimer -= dt;
        } else if (this.shield < this.maxShield) {
            let oldShield = this.shield;
            this.shield = Math.min(this.maxShield, this.shield + dt * 15);
            if (Math.floor(oldShield) !== Math.floor(this.shield)) {
                updateHUD();
            }
        }
        
        if (keys['shift'] && this.dashCooldownTimer <= 0) {
            this.isDashing = true;
            this.dashTimer = this.dashDuration;
            this.dashCooldownTimer = this.dashCooldown;
            this.vy = 0; 
        }

        if (this.isDashing) {
            this.dashTimer -= dt;
            this.vx = (this.facingRight ? 1 : -1) * this.dashSpeed;
            createParticles(this.x + this.width/2, this.y + this.height, 2, '#4ade80', 50);
            if (this.dashTimer <= 0) this.isDashing = false;
        } else {
            let comboSpeedBoost = 1 + Math.min(0.3, (gameState.comboCount || 0) * 0.01);
            let currentSpeed = this.speed * this.perks.speedMult * comboSpeedBoost;
            if (keys['a'] || keys['arrowleft']) { this.vx -= currentSpeed * dt * 10; this.facingRight = false; }
            if (keys['d'] || keys['arrowright']) { this.vx += currentSpeed * dt * 10; this.facingRight = true; }
            this.vx *= Math.pow(FRICTION, dt * 60);
        }

        if (!this.isDashing) {
            this.vy += GRAVITY * dt;
            if ((keys['w'] || keys['arrowup'] || keys[' ']) && this.grounded) {
                this.vy = this.jumpForce;
                this.grounded = false;
                createParticles(this.x + this.width/2, this.y + this.height, 10, '#fff', 100);
            }
        }

        // Grappling physics
        if (this.grapple.active) {
            let dx = this.grapple.x - (this.x + this.width/2);
            let dy = this.grapple.y - (this.y + this.height/2);
            let dist = Math.hypot(dx, dy);

            if (keys['s'] || keys['arrowdown']) {
                this.grapple.active = false;
                this.vy = 1200;
                this.vx = 0;
                this.isGrappleSlamming = true;
                createFloatingText(this.x + this.width/2, this.y - 15, "SLAM!", '#4ade80');
            } else if (dist < 60 || ((keys['w'] || keys['arrowup'] || keys[' ']) && dist < 300)) {
                this.grapple.active = false;
                if(keys['w'] || keys['arrowup'] || keys[' ']) this.vy = this.jumpForce; 
            } else {
                this.vx += (dx / dist) * 2500 * dt;
                this.vy += (dy / dist) * 2500 * dt;
                this.vy -= GRAVITY * dt * 0.9; 
                createParticles(this.x + this.width/2, this.y + this.height/2, 1, '#9ca3af', 20);
            }
        }

        this.x += this.vx * dt; this.resolveCollisions(true);
        this.y += this.vy * dt; this.resolveCollisions(false);
        
        if (this.isGrappleSlamming) {
            createParticles(this.x + this.width/2, this.y + this.height/2, 2, '#4ade80', 50);
            if (this.grounded) {
                this.executeSlam();
            }
        }
        
        if (this.x < 0) this.x = 0;
        if (this.x > MAP_WIDTH - this.width) this.x = MAP_WIDTH - this.width;

        let w = this.getWeapon();
        if(w) {
            // Defensive recovery if ammo ever becomes undefined or NaN
            if (w.id !== 'katana' && (w.ammo === undefined || isNaN(w.ammo))) {
                w.ammo = w.maxAmmo || 30;
                w.reloading = false;
                w.reloadTimer = 0;
                updateHUD();
            }

            if (w.cd > 0) w.cd -= dt;
            
            if (w.reloading) {
                w.reloadTimer -= dt;
                if (w.reloadTimer <= 0) {
                    w.ammo = w.maxAmmo; w.reloading = false; updateHUD();
                }
            } else if ((keys['r'] && w.ammo < w.maxAmmo) || (mouse.down && w.ammo <= 0 && w.id !== 'katana')) {
                this.reloadWeapon(w);
            } else if (mouse.down && w.ammo > 0) {
                if(w.id === 'katana' && w.cd <= 0) this.swingMelee(w);
                else if(w.id === 'flamethrower' && w.cd <= 0) this.shootFlame(w);
                else if(w.id === 'minigun') this.shootMinigun(w, dt);
                else if(w.id === 'railgun' && w.cd <= 0) this.shootRailgun(w);
                else if(w.id === 'cluster_launcher' && w.cd <= 0) this.shootCluster(w);
                else if(w.id === 'cryo_ray' && w.cd <= 0) this.shootCryo(w);
                else if(w.cd <= 0) this.shootBullet(w);
            } else if (!mouse.down && w.id === 'minigun') {
                w.spinSpeed = Math.max(0, (w.spinSpeed || 0) - dt * 2.5);
            }
        }

        for(let i=1; i<=4; i++) {
            if(keys[i.toString()] && this.weapons[i-1]) {
                this.currentWeaponIndex = i-1; updateHUD();
            }
        }
        
        gameState.pickups.forEach(p => {
            let dist = Math.hypot((p.x+p.width/2) - (this.x+this.width/2), (p.y+p.height/2) - (this.y+this.height/2));
            if(dist < 150) {
                p.x += ((this.x+this.width/2) - p.x) * dt * 5;
                p.y += ((this.y+this.height/2) - p.y) * dt * 5;
            }
            if (this.intersects(p)) p.collect();
        });
    }

    reloadWeapon(w) {
        if(w.id === 'katana') return;
        w.reloading = true;
        w.reloadTimer = w.reloadTime * this.perks.reloadMult;
        updateHUD();
    }

    shootMinigun(w, dt) {
        w.spinSpeed = Math.min(1.0, (w.spinSpeed || 0) + dt * 1.8);
        if (w.spinSpeed < 0.3) {
            // Spooling up clicks
            if (Math.random() < 0.2) createParticles(this.x + this.width/2, this.y + this.height/2, 1, '#94a3b8', 40);
            return;
        }

        if (w.cd <= 0) {
            let fireInterval = Math.max(0.045, w.fireRate - (w.spinSpeed * 0.065));
            w.cd = fireInterval;
            if (!gameState.adrenalineActive) w.ammo--;

            let angle = Math.atan2(mouse.worldY - (this.y + this.height/2), mouse.worldX - (this.x + this.width/2));
            angle += (Math.random() - 0.5) * (w.spread || 0.12);

            gameState.projectiles.push(new Projectile(this.x + this.width/2, this.y + this.height/2, angle, 1900, w.dmg * this.perks.dmgMult, '#f59e0b'));

            // Reverse recoil thrust
            this.vx -= Math.cos(angle) * 110;
            if (Math.sin(angle) > 0.4 && !this.grounded) {
                this.vy -= 140; // Hover effect when firing down!
            }

            createParticles(this.x + this.width/2 + Math.cos(angle)*35, this.y + this.height/2 + Math.sin(angle)*35, 3, '#f97316', 180);
            updateHUD();
        }
    }

    shootRailgun(w) {
        if (!gameState.adrenalineActive) w.ammo--;
        w.cd = w.fireRate;
        let angle = Math.atan2(mouse.worldY - (this.y + this.height/2), mouse.worldX - (this.x + this.width/2));

        gameState.camera.shake = 8;
        this.vx -= Math.cos(angle) * 450; // Heavy kickback

        gameState.projectiles.push(new Projectile(
            this.x + this.width/2, 
            this.y + this.height/2, 
            angle, 
            4600, 
            w.dmg * this.perks.dmgMult, 
            '#22d3ee', 
            false, 
            false, 
            false, 
            { isRailgun: true, life: 0.6 }
        ));

        createParticles(this.x + this.width/2 + Math.cos(angle)*40, this.y + this.height/2 + Math.sin(angle)*40, 16, '#22d3ee', 320);
        updateHUD();
    }

    shootCluster(w) {
        if (!gameState.adrenalineActive) w.ammo--;
        w.cd = w.fireRate;
        let angle = Math.atan2(mouse.worldY - (this.y + this.height/2), mouse.worldX - (this.x + this.width/2));

        this.vx -= Math.cos(angle) * 220;

        gameState.projectiles.push(new Projectile(
            this.x + this.width/2, 
            this.y + this.height/2, 
            angle, 
            950, 
            w.dmg * this.perks.dmgMult, 
            '#f97316', 
            false, 
            false, 
            false, 
            { isCluster: true, life: 1.8 }
        ));

        createParticles(this.x + this.width/2 + Math.cos(angle)*35, this.y + this.height/2 + Math.sin(angle)*35, 8, '#f97316', 160);
        updateHUD();
    }

    shootCryo(w) {
        if (!gameState.adrenalineActive) w.ammo--;
        w.cd = w.fireRate;
        let angle = Math.atan2(mouse.worldY - (this.y + this.height/2), mouse.worldX - (this.x + this.width/2));
        angle += (Math.random() - 0.5) * 0.15;

        gameState.projectiles.push(new Projectile(
            this.x + this.width/2, 
            this.y + this.height/2, 
            angle, 
            1250, 
            w.dmg * this.perks.dmgMult, 
            '#38bdf8', 
            false, 
            false, 
            true, 
            { isCryo: true, life: 0.45 }
        ));

        createParticles(this.x + this.width/2 + Math.cos(angle)*25, this.y + this.height/2 + Math.sin(angle)*25, 4, '#bae6fd', 90);
        updateHUD();
    }

    shootBullet(w) {
        if (!gameState.adrenalineActive) w.ammo--;
        w.cd = w.fireRate;
        let angle = Math.atan2(mouse.worldY - (this.y + this.height/2), mouse.worldX - (this.x + this.width/2));
        angle += (Math.random() - 0.5) * w.spread;
        let speed = w.id === 'sniper' ? 2600 : 1500;
        let pelletCount = w.id === 'shotgun' ? 6 : 1;
        for(let i=0; i<pelletCount; i++) {
            let a = angle + (w.id==='shotgun' ? (Math.random()-0.5)*0.3 : 0);
            gameState.projectiles.push(new Projectile(this.x + this.width/2, this.y + this.height/2, a, speed, w.dmg * this.perks.dmgMult, w.color, w.id==='rpg'));
        }
        this.vx -= Math.cos(angle) * (w.id==='shotgun'?400:(w.id==='sniper'?350:100));
        createParticles(this.x+this.width/2 + Math.cos(angle)*30, this.y+this.height/2 + Math.sin(angle)*30, 5, '#fbbf24', 200);
        updateHUD();
    }

    shootFlame(w) {
        if (!gameState.adrenalineActive) w.ammo--;
        w.cd = w.fireRate;
        let angle = Math.atan2(mouse.worldY - (this.y + this.height/2), mouse.worldX - (this.x + this.width/2));
        angle += (Math.random() - 0.5) * 0.4; 
        gameState.projectiles.push(new FlameProjectile(this.x + this.width/2, this.y + this.height/2, angle, w.dmg * this.perks.dmgMult, w.range || 0.5));
        updateHUD();
    }

    swingMelee(w) {
        w.cd = w.fireRate;
        let range = w.range || 80;
        let pCenterX = this.x + this.width/2;
        let pCenterY = this.y + this.height/2;
        
        createMeleeSlash(pCenterX, pCenterY, this.facingRight, range);

        // Deflect enemy projectiles
        for (let i = gameState.enemyProjectiles.length - 1; i >= 0; i--) {
            let p = gameState.enemyProjectiles[i];
            let dist = Math.hypot(p.x - pCenterX, p.y - pCenterY);
            let inFront = this.facingRight ? (p.x > this.x) : (p.x < this.x);
            if (dist < range && inFront) {
                p.isEnemy = false; // Now it damages enemies!
                p.vx = -p.vx * 1.5;
                p.vy = -p.vy * 1.5;
                createParticles(p.x, p.y, 8, '#22c55e', 150); // Deflection spark
                gameState.enemyProjectiles.splice(i, 1);
                gameState.projectiles.push(p);
            }
        }

        gameState.enemies.forEach(e => {
            let dist = Math.hypot((e.x+e.width/2) - pCenterX, (e.y+e.height/2) - pCenterY);
            let inFront = this.facingRight ? (e.x > this.x) : (e.x < this.x);
            if(dist < range && inFront && !e.dead) {
                e.takeDamage(w.dmg * this.perks.dmgMult);
                e.vx = (this.facingRight ? 1 : -1) * 300; e.vy = -200;
            }
        });
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
                    } else if (this.vy < 0) this.y = p.y + p.height;
                    this.vy = 0;
                }
            }
        }
    }

    executeSlam() {
        this.isGrappleSlamming = false;
        gameState.camera.shake = 10;
        
        let pCenterX = this.x + this.width/2;
        let pBottomY = this.y + this.height;

        createParticles(pCenterX, pBottomY, 30, '#4ade80', 250);
        createParticles(pCenterX, pBottomY, 15, '#22c55e', 200);

        let range = 180;
        let dmg = 120;
        
        gameState.enemies.forEach(e => {
            let dist = Math.hypot((e.x + e.width/2) - pCenterX, (e.y + e.height/2) - pBottomY);
            if (dist <= range && !e.dead) {
                let falloff = 1 - (dist / range);
                e.takeDamage(dmg * falloff);
                let dir = (e.x + e.width/2 > pCenterX) ? 1 : -1;
                e.vx += dir * 400 * falloff;
                e.vy -= 250 * falloff;
            }
        });

        gameState.barrels.forEach(b => {
            let dist = Math.hypot((b.x + b.width/2) - pCenterX, (b.y + b.height/2) - pBottomY);
            if (dist <= range) {
                b.takeDamage(50, gameState);
            }
        });
    }

    takeDamage(amount) {
        if(this.isDashing || this.invulnerableTimer > 0) return; 
        
        this.shieldRegenTimer = 4.0;
        
        if (this.shield > 0) {
            if (this.shield >= amount) {
                this.shield -= amount;
                amount = 0;
            } else {
                amount -= this.shield;
                this.shield = 0;
            }
        }
        
        if (amount > 0) {
            this.hp -= amount;
        }
        
        this.damageFlash = 0.2;
        this.invulnerableTimer = 0.5;
        createParticles(this.x + this.width/2, this.y + this.height/2, 15, '#ef4444', 300);
        updateHUD();
        if (this.hp <= 0) triggerGameOver();
    }

    draw(ctx) {
        let isBlinking = this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 15) % 2 === 0;

        if (this.grapple.active) {
            ctx.save(); ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 3; ctx.beginPath();
            ctx.moveTo(this.x + this.width/2, this.y + this.height/2);
            ctx.lineTo(this.grapple.x, this.grapple.y); ctx.stroke();
            ctx.fillStyle = '#6b7280'; ctx.beginPath(); ctx.arc(this.grapple.x, this.grapple.y, 5, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }

        if (!isBlinking) {
            drawBunny(ctx, this.x, this.y, this.width, this.height, this.facingRight, this.damageFlash > 0 ? '#ef4444' : '#fff');
            let w = this.getWeapon();
            if (w && w.id !== 'katana') {
                ctx.save();
                ctx.translate(this.x + this.width/2, this.y + this.height/2 + 5);
                let angle = Math.atan2(mouse.worldY - (this.y + this.height/2), mouse.worldX - (this.x + this.width/2));
                ctx.rotate(angle);
                ctx.fillStyle = w.color;
                ctx.fillRect(0, -4, 25 + (w.dmg/20), 8); 
                ctx.restore();
            }
        }
        
        gameState.companions.forEach(c => c.draw(ctx));
    }
}
