import { platforms } from '../physics.js';
import { GRAVITY, MAP_WIDTH, MAP_HEIGHT } from '../constants.js';
import { gameState } from '../state.js';
import { createParticles, createExplosion, createFloatingText } from '../effects.js';

export class Projectile {
    constructor(x, y, angle, speed, dmg, color, isRpg=false, isEnemy=false, isFrost=false, options={}) {
        this.x = x; 
        this.y = y; 
        this.vx = Math.cos(angle) * speed; 
        this.vy = Math.sin(angle) * speed;
        this.dmg = dmg; 
        this.color = color; 
        this.isRpg = isRpg; 
        this.isEnemy = isEnemy; 
        this.isFrost = isFrost; 
        this.active = true; 
        this.life = options.life || 2.0;
        
        this.isCluster = options.isCluster || false;
        this.isSubCluster = options.isSubCluster || false;
        this.isShockwave = options.isShockwave || false;
        this.isRailgun = options.isRailgun || false;
        this.isCryo = options.isCryo || false;
        this.pierceCount = options.pierceCount !== undefined ? options.pierceCount : (this.isRailgun ? 99 : 0);
        this.hitEnemies = new Set();
    }

    update(dt) {
        this.x += this.vx * dt; 
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) {
            if (this.isRpg || this.isCluster || this.isSubCluster) {
                this.explode();
            } else {
                this.active = false;
            }
            return;
        }
        
        if (this.isRpg || this.isSubCluster) {
            this.vy += GRAVITY * 0.25 * dt; 
            createParticles(this.x, this.y, 1, '#fbbf24', 40); 
        } else if (this.isCluster) {
            this.vy += GRAVITY * 0.35 * dt;
            createParticles(this.x, this.y, 1, '#f97316', 50);
        } else if (this.isRailgun) {
            createParticles(this.x, this.y, 2, '#22d3ee', 60);
        } else if (this.isCryo) {
            createParticles(this.x, this.y, 1, '#38bdf8', 35);
        } else if (this.isShockwave) {
            createParticles(this.x, this.y, 1, '#78716c', 60);
        }

        if (this.x < 0 || this.x > MAP_WIDTH || this.y > MAP_HEIGHT) {
            this.active = false;
            return;
        }

        // Platform collision
        if (!this.isRailgun) {
            for (let p of platforms) {
                if (this.x > p.x && this.x < p.x + p.width && this.y > p.y && this.y < p.y + p.height) {
                    this.explode(); 
                    break;
                }
            }
        }

        if (!this.active) return;

        if (this.isEnemy) {
            let p = gameState.player;
            if (p && this.x > p.x && this.x < p.x + p.width && this.y > p.y && this.y < p.y + p.height) {
                if (this.isRpg || this.isCluster) {
                    this.explode();
                } else {
                    p.takeDamage(this.dmg);
                    if (this.isShockwave) {
                        p.vy = -550;
                        gameState.camera.shake = 6;
                    }
                    this.active = false;
                    createParticles(this.x, this.y, 6, this.color, 100);
                }
            }
        } else {
            // Check barrels
            for (let b of gameState.barrels) {
                if (this.x > b.x && this.x < b.x + b.width && this.y > b.y && this.y < b.y + b.height) {
                    if (this.isRpg || this.isCluster) {
                        this.explode();
                    } else {
                        b.takeDamage(this.dmg, gameState);
                        if (!this.isRailgun) this.active = false;
                        createParticles(this.x, this.y, 5, this.color, 100);
                    }
                    break;
                }
            }

            if (!this.active) return;

            // Check enemies
            for (let e of gameState.enemies) {
                if (this.x > e.x && this.x < e.x + e.width && this.y > e.y && this.y < e.y + e.height && !e.dead) {
                    if (this.hitEnemies.has(e)) continue;
                    this.hitEnemies.add(e);

                    if (this.isRpg || this.isCluster || this.isSubCluster) { 
                        this.explode(); 
                        break;
                    }

                    // Shield-Bearer frontal block mechanic
                    if (e.type === 'shield' && !this.isRailgun) {
                        let facingRight = e.vx >= 0 || (gameState.player && gameState.player.x > e.x);
                        let hitFront = (facingRight && this.vx < 0) || (!facingRight && this.vx > 0);
                        if (hitFront) {
                            createParticles(this.x, this.y, 8, '#94a3b8', 160);
                            createFloatingText(e.x + e.width / 2, e.y - 15, "BLOCKED!", '#94a3b8');
                            this.active = false;
                            break;
                        }
                    }

                    let isHeadshot = this.y < e.y + e.height * 0.35;
                    let finalDmg = isHeadshot ? this.dmg * 2.0 : this.dmg;

                    // Cryo freeze stack & shatter
                    if (this.isCryo || this.isFrost) {
                        let oldFrozen = e.frozen || 0;
                        e.frozen = Math.min(4.5, oldFrozen + 1.2);
                        if (oldFrozen >= 2.5) {
                            // Shatter ice statue!
                            createExplosion(e.x + e.width / 2, e.y + e.height / 2, 90, 50);
                            createParticles(e.x + e.width / 2, e.y + e.height / 2, 16, '#bae6fd', 200);
                            createFloatingText(e.x + e.width / 2, e.y - 20, "SHATTER!", '#38bdf8');
                        }
                    }

                    e.takeDamage(finalDmg); 

                    if (isHeadshot) {
                        createParticles(this.x, this.y, 12, '#f43f5e', 180);
                        createFloatingText(e.x + e.width / 2, e.y - 15, "HEADSHOT!", '#f43f5e');
                    } else {
                        createParticles(this.x, this.y, 5, this.color, 100); 
                    }

                    if (this.pierceCount > 0) {
                        this.pierceCount--;
                    } else {
                        this.active = false;
                        break;
                    }
                }
            }
        }
    }

    explode() {
        if (!this.active) return;
        this.active = false;
        
        if (this.isCluster) {
            // Main grenade detonation
            createExplosion(this.x, this.y, 120, this.dmg);
            // Spawn 4 cluster sub-munitions
            for (let i = 0; i < 4; i++) {
                let spreadAngle = -Math.PI / 2 + (i - 1.5) * 0.45 + (Math.random() - 0.5) * 0.2;
                let subProj = new Projectile(
                    this.x, 
                    this.y - 5, 
                    spreadAngle, 
                    320 + Math.random() * 80, 
                    this.dmg * 0.5, 
                    '#f97316', 
                    false, 
                    false, 
                    false, 
                    { isSubCluster: true, life: 0.8 }
                );
                gameState.projectiles.push(subProj);
            }
        } else if (this.isSubCluster) {
            createExplosion(this.x, this.y, 90, this.dmg);
            createParticles(this.x, this.y, 8, '#f97316', 140);
        } else if (this.isRpg) {
            createExplosion(this.x, this.y, 150, this.dmg);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;

        if (this.isRailgun) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.vx * 0.04, this.y - this.vy * 0.04);
            ctx.stroke();
        } else if (this.isCluster) {
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.isSubCluster) {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.isShockwave) {
            ctx.fillStyle = '#a8a29e';
            ctx.fillRect(this.x - 6, this.y - 16, 12, 20);
        } else if (this.isRpg) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
        }
        ctx.restore();
    }
}
