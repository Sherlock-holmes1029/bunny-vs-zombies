import { Rect, platforms } from '../physics.js';
import { GRAVITY } from '../constants.js';
import { gameState } from '../state.js';
import { createParticles, createExplosion } from '../effects.js';
import { drawZombie } from '../drawHelpers.js';
import { updateHUD } from '../ui.js';
import { Projectile } from './Projectile.js';
import { Pickup } from './Pickup.js';

export class Enemy extends Rect {
    constructor(x, y, type) {
        super(x, y, 30, 40);
        this.type = type; 
        this.vx = 0; this.vy = 0;
        this.grounded = false;
        this.onFire = 0;
        this.frozen = 0;
        this.dead = false;
        
        let hpScale = 1 + (gameState.currentWave * 0.15);
        let spdScale = 1 + (gameState.currentWave * 0.05);

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
            case 'boss':
                this.width = 80; this.height = 100;
                this.maxHp = 2000 * hpScale; this.speed = 250 * spdScale;
                this.score = 500; this.money = 600; this.stompCd = 5.0;
                
                // Roll mutator trait
                let roll = Math.random();
                if (roll < 0.33) {
                    this.mutator = 'Shielded';
                    this.bossShield = 800;
                    this.maxBossShield = 800;
                    this.color = '#1e3a8a'; 
                } else if (roll < 0.66) {
                    this.mutator = 'Toxic';
                    this.color = '#065f46'; 
                    this.toxicTimer = 0;
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
            this.onFire -= dt; this.takeDamage(10 * dt); 
            createParticles(this.x+this.width/2, this.y, 1, '#f97316', 50);
        }
        let moveSpeed = this.speed;
        if(this.frozen > 0) {
            this.frozen -= dt; moveSpeed *= 0.5; this.color = '#38bdf8'; 
        }
        if(this.onFire > 0) {
            moveSpeed *= 0.6;
        }

        let dx = (player.x + player.width/2) - (this.x + this.width/2);
        let dy = (player.y + player.height/2) - (this.y + this.height/2);
        let dist = Math.hypot(dx, dy);

        // Check barricades blockage
        let barricadeBlocked = false;
        if (this.type !== 'gargoyle') {
            for (let b of gameState.barricades) {
                if (this.intersects(b)) {
                    barricadeBlocked = true;
                    this.vx = 0;
                    this.attackCd = (this.attackCd || 0) - dt;
                    if (this.attackCd <= 0) {
                        b.takeDamage(this.type === 'boss' ? 40 : 15);
                        this.attackCd = 1.0;
                    }
                    break;
                }
            }
        }

        if (barricadeBlocked) {
            // Blocked by barricade, do not move towards player
        } else if (this.type === 'gargoyle') {
            let targetY = player.y - 120;
            let targetX = player.x + (this.wingFlapLeft ? -150 : 150);
            
            if (Math.random() < 0.005) {
                this.wingFlapLeft = !this.wingFlapLeft;
            }
            
            let tdx = targetX - this.x;
            let tdy = targetY - this.y;
            let td = Math.hypot(tdx, tdy);
            
            if (td > 10) {
                this.vx = (tdx / td) * moveSpeed;
                this.vy = (tdy / td) * moveSpeed;
            } else {
                this.vx = 0;
                this.vy = 0;
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
        } else {
            this.vx = (dx > 0 ? 1 : -1) * moveSpeed;
        }

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
            player.takeDamage(this.type === 'boss' ? 30 : 10);
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
                        this.y = p.y - this.height; this.grounded = true;
                    } else if (this.vy < 0) this.y = p.y + p.height;
                    this.vy = 0;
                }
            }
        }
    }

    takeDamage(amount) {
        if(this.dead) return;
        
        if (this.type === 'boss' && this.mutator === 'Shielded' && (this.bossShield || 0) > 0) {
            this.bossShield -= amount;
            createParticles(this.x + this.width/2, this.y + this.height/2, 5, '#3b82f6', 100);
            if (this.bossShield < 0) {
                this.hp += this.bossShield;
                this.bossShield = 0;
            }
        } else {
            this.hp -= amount;
        }
        
        createParticles(this.x + this.width/2, this.y + this.height/2, 3, '#9ca3af', 100);
        if (this.hp <= 0) this.die();
    }

    die() {
        if(this.dead) return;
        this.dead = true;
        
        if (this.type === 'boss' && this.mutator === 'Splitter') {
            for (let i = 0; i < 3; i++) {
                gameState.enemies.push(new Enemy(this.x + i * 20, this.y, 'speedy'));
            }
        }

        gameState.comboCount++;
        gameState.comboTimer = 4.0;
        
        let comboMult = 1 + Math.min(10, Math.floor(gameState.comboCount / 5)) * 0.1;
        let moneyEarned = Math.floor(this.money * comboMult);
        
        gameState.score += this.score; 
        gameState.money += moneyEarned;
        updateHUD();
        
        const player = gameState.player;
        if(player.perks.lifesteal > 0 && player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + player.perks.lifesteal);
            updateHUD();
        }

        if(this.type === 'mutant') createExplosion(this.x + this.width/2, this.y + this.height/2, 120, 40, true);
        createParticles(this.x + this.width/2, this.y + this.height/2, this.type === 'boss' ? 50 : 15, this.color, this.type === 'boss' ? 400 : 200);
        
        if (Math.random() < 0.2 || this.type === 'boss') gameState.pickups.push(new Pickup(this.x, this.y, 'carrot'));
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

        // Draw double health bars for Boss variants
        if (this.type === 'boss') {
            let barW = this.width * 1.4;
            let barX = this.x - (barW - this.width) / 2;
            let barY = this.y - 20;
            
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(barX, barY, barW, 6);
            
            let hpPct = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(barX, barY, barW * hpPct, 6);
            
            if (this.mutator === 'Shielded' && this.bossShield > 0) {
                let shPct = this.bossShield / this.maxBossShield;
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(barX, barY - 4, barW * shPct, 3);
            }
        }

        drawZombie(ctx, this.x, this.y, this.width, this.height, this.vx >= 0, this.color, this.hp / this.maxHp);
    }
}
