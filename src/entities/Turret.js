import { gameState } from '../state.js';
import { Projectile } from './Projectile.js';
import { createParticles } from '../effects.js';

export class Turret {
    constructor(x, y, type = 'bullet') {
        this.x = x; this.y = y; this.width = 20; this.height = 30;
        this.type = type;
        this.cd = 0;
        this.lightningChain = [];
        this.lightningLife = 0;

        this.level = 1;
        if (type === 'frost') {
            this.range = 400;
            this.color = '#0891b2';
            this.headColor = '#67e8f9';
            this.fireRate = 0.8;
        } else if (type === 'tesla') {
            this.range = 300;
            this.color = '#4f46e5';
            this.headColor = '#a5b4fc';
            this.fireRate = 1.2;
        } else {
            this.range = 500;
            this.color = '#4b5563';
            this.headColor = '#9ca3af';
            this.fireRate = 0.5;
        }
    }

    update(dt) {
        if (this.lightningLife > 0) this.lightningLife -= dt;
        if (this.cd > 0) this.cd -= dt;

        if (this.cd <= 0) {
            let closest = null, minDist = this.range;
            gameState.enemies.forEach(e => {
                let d = Math.hypot(e.x - this.x, e.y - this.y);
                if (d < minDist && !e.dead) { minDist = d; closest = e; }
            });

            if (closest) {
                if (this.type === 'tesla') {
                    // Chain lightning
                    let chain = [{ x: this.x + 10, y: this.y }];
                    let current = closest;
                    let visited = new Set();
                    let chainDmg = 40 + (this.level - 1) * 10; // Extra level scaling damage!

                    while (current && chain.length < 6) {
                        let cx = current.x + current.width/2;
                        let cy = current.y + current.height/2;
                        chain.push({ x: cx, y: cy });
                        visited.add(current);
                        current.takeDamage(chainDmg);
                        createParticles(cx, cy, 6, '#818cf8', 120);

                        let nextTarget = null;
                        let nextMinDist = 180;
                        gameState.enemies.forEach(e => {
                            if (!e.dead && !visited.has(e)) {
                                let d = Math.hypot((e.x+e.width/2) - cx, (e.y+e.height/2) - cy);
                                if (d < nextMinDist) {
                                    nextMinDist = d;
                                    nextTarget = e;
                                }
                            }
                        });
                        current = nextTarget;
                    }
                    this.lightningChain = chain;
                    this.lightningLife = 0.15;
                    this.cd = this.fireRate;
                } else if (this.type === 'frost') {
                    // Frost projectile (applies slow/freeze debuff)
                    let angle = Math.atan2((closest.y+closest.height/2) - this.y, (closest.x+closest.width/2) - this.x);
                    let dmg = 15 + (this.level - 1) * 5;
                    gameState.projectiles.push(new Projectile(this.x + 10, this.y, angle, 900, dmg, '#22d3ee', false, false, true));
                    this.cd = this.fireRate;
                    createParticles(this.x + 10, this.y, 5, '#22d3ee', 50);
                } else {
                    // Standard turret
                    let angle = Math.atan2((closest.y+closest.height/2) - this.y, (closest.x+closest.width/2) - this.x);
                    let dmg = 25 + (this.level - 1) * 8;
                    gameState.projectiles.push(new Projectile(this.x + 10, this.y, angle, 1200, dmg, '#fbbf24', false, false, false));
                    this.cd = this.fireRate;
                    createParticles(this.x + 10, this.y, 5, '#fbbf24', 50);
                }
            }
        }
    }

    draw(ctx) {
        // Base
        ctx.fillStyle = this.color; 
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Head
        ctx.fillStyle = this.headColor; 
        ctx.beginPath(); 
        ctx.arc(this.x + 10, this.y, 10, 0, Math.PI, true); 
        ctx.fill();

        // Draw lightning lines if active
        if (this.type === 'tesla' && this.lightningLife > 0 && this.lightningChain.length > 1) {
            ctx.save();
            ctx.strokeStyle = '#c7d2fe';
            ctx.shadowColor = '#818cf8';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            ctx.moveTo(this.lightningChain[0].x, this.lightningChain[0].y);
            for (let i = 1; i < this.lightningChain.length; i++) {
                // Jagged lightning midpoint offset
                let x1 = this.lightningChain[i-1].x;
                let y1 = this.lightningChain[i-1].y;
                let x2 = this.lightningChain[i].x;
                let y2 = this.lightningChain[i].y;
                
                let mx = (x1 + x2) / 2;
                let my = (y1 + y2) / 2;
                
                // Normal vector offset
                let nx = -(y2 - y1);
                let ny = (x2 - x1);
                let len = Math.hypot(nx, ny) || 1;
                let offset = (Math.random() - 0.5) * 20;
                
                mx += (nx / len) * offset;
                my += (ny / len) * offset;
                
                ctx.lineTo(mx, my);
                ctx.lineTo(x2, y2);
            }
            ctx.stroke();
            ctx.restore();
        }
        
        if (this.level > 1) {
            ctx.save();
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Lvl ${this.level}`, this.x + 10, this.y - 12);
            ctx.restore();
        }
    }
}
