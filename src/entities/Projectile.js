import { platforms } from '../physics.js';
import { GRAVITY, MAP_WIDTH, MAP_HEIGHT } from '../constants.js';
import { gameState } from '../state.js';
import { createParticles, createExplosion, createFloatingText } from '../effects.js';

export class Projectile {
    constructor(x, y, angle, speed, dmg, color, isRpg=false, isEnemy=false, isFrost=false) {
        this.x = x; this.y = y; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.dmg = dmg; this.color = color; this.isRpg = isRpg; this.isEnemy = isEnemy; this.isFrost = isFrost; this.active = true; this.life = 2.0;
    }
    update(dt) {
        this.x += this.vx * dt; this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) this.active = false;
        
        if (this.isRpg) {
            this.vy += GRAVITY * 0.2 * dt; 
            createParticles(this.x, this.y, 1, '#fbbf24', 50); 
        }

        if (this.x < 0 || this.x > MAP_WIDTH || this.y > MAP_HEIGHT) this.active = false;

        for (let p of platforms) {
            if (this.x > p.x && this.x < p.x + p.width && this.y > p.y && this.y < p.y + p.height) {
                this.explode(); break;
            }
        }

        if (this.active) {
            if (this.isEnemy) {
                let p = gameState.player;
                if (p && this.x > p.x && this.x < p.x + p.width && this.y > p.y && this.y < p.y + p.height) {
                    if (this.isRpg) {
                        this.explode();
                    } else {
                        p.takeDamage(this.dmg);
                        this.active = false;
                        createParticles(this.x, this.y, 5, this.color, 100);
                    }
                }
            } else {
                for (let b of gameState.barrels) {
                    if (this.x > b.x && this.x < b.x + b.width && this.y > b.y && this.y < b.y + b.height) {
                        if (this.isRpg) {
                            this.explode();
                        } else {
                            b.takeDamage(this.dmg, gameState);
                            this.active = false;
                            createParticles(this.x, this.y, 5, this.color, 100);
                        }
                        break;
                    }
                }
                if (this.active) {
                    for (let e of gameState.enemies) {
                        if (this.x > e.x && this.x < e.x + e.width && this.y > e.y && this.y < e.y + e.height && !e.dead) {
                            if (this.isRpg) { 
                                this.explode(); 
                            } else { 
                                let isHeadshot = this.y < e.y + e.height * 0.35;
                                let finalDmg = isHeadshot ? this.dmg * 2.0 : this.dmg;
                                e.takeDamage(finalDmg); 
                                if (this.isFrost) {
                                    e.frozen = 3.0;
                                }
                                this.active = false; 
                                if (isHeadshot) {
                                    createParticles(this.x, this.y, 12, '#f43f5e', 180);
                                    createFloatingText(e.x + e.width/2, e.y - 15, "HEADSHOT!", '#f43f5e');
                                } else {
                                    createParticles(this.x, this.y, 5, this.color, 100); 
                                }
                            }
                            break;
                        }
                    }
                }
            }
        }
    }
    explode() {
        if (!this.active) return;
        this.active = false;
        if(this.isRpg) createExplosion(this.x, this.y, 150, this.dmg);
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        if(this.isRpg) ctx.arc(this.x, this.y, 6, 0, Math.PI*2);
        else ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
        ctx.fill();
    }
}
