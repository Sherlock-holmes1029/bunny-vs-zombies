import { gameState } from '../state.js';

export class FlameProjectile {
    constructor(x, y, angle, dmg) {
        this.x = x; this.y = y; 
        let speed = 400 + Math.random()*200;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.dmg = dmg; this.active = true;
        this.life = 0.4 + Math.random()*0.2; this.maxLife = this.life;
    }
    update(dt) {
        this.x += this.vx * dt; this.y += this.vy * dt;
        this.vx *= Math.pow(0.95, dt * 60); this.vy -= 100 * dt; 
        this.life -= dt;
        if(this.life <= 0) this.active = false;
        
        if (this.active) {
            for (let b of gameState.barrels) {
                if (this.x > b.x && this.x < b.x + b.width && this.y > b.y && this.y < b.y + b.height) {
                    b.takeDamage(this.dmg * dt * 5, gameState);
                }
            }
            for (let e of gameState.enemies) {
                if (this.x > e.x && this.x < e.x + e.width && this.y > e.y && this.y < e.y + e.height && !e.dead) {
                    e.takeDamage(this.dmg * dt * 5); 
                    if(Math.random() < 0.3) e.onFire = 2.0; 
                }
            }
        }
    }
    draw(ctx) {
        let alpha = this.life / this.maxLife;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(245, 158, 11, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, 10 * (1 - alpha) + 5, 0, Math.PI*2); ctx.fill();
    }
}
