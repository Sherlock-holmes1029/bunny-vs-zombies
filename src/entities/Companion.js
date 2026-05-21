import { gameState } from '../state.js';
import { Projectile } from './Projectile.js';
import { createParticles } from '../effects.js';

export class Companion {
    constructor(player, index = 0) {
        this.player = player;
        this.index = index;
        this.x = player.x; this.y = player.y;
        this.vx = 0; this.vy = 0;
        this.cd = 0;
    }
    update(dt) {
        let orbitSpeed = 0.002;
        let angleOffset = this.index * (Math.PI * 2 / 4); // Distribute up to 4+ drones evenly
        let orbitAngle = (performance.now() * orbitSpeed) + angleOffset;
        let orbitRadiusX = 50;
        let orbitRadiusY = 20;

        let targetX = this.player.x + this.player.width/2 + Math.cos(orbitAngle) * orbitRadiusX;
        let targetY = this.player.y + this.player.height/2 - 35 + Math.sin(orbitAngle) * orbitRadiusY;
        
        this.x += (targetX - this.x) * dt * 5;
        this.y += (targetY - this.y) * dt * 5;

        if(this.cd > 0) this.cd -= dt;
        if(this.cd <= 0 && gameState.enemies.length > 0) {
            let targetIdx = this.index % gameState.enemies.length;
            let target = gameState.enemies[targetIdx];
            let dist = Math.hypot(target.x - this.x, target.y - this.y);
            if(dist < 400 && !target.dead) {
                let angle = Math.atan2((target.y+target.height/2) - this.y, (target.x+target.width/2) - this.x);
                let multi = this.player.perks.droneMulti;
                
                for(let i=0; i<multi; i++) {
                    let a = angle + (Math.random() - 0.5) * 0.2 * (multi > 1 ? 1 : 0);
                    gameState.projectiles.push(new Projectile(this.x, this.y, a, 800, 10 * this.player.perks.droneDmg, '#0ea5e9', false));
                }

                this.cd = 1.0 * this.player.perks.droneRate;
                createParticles(this.x, this.y, 3 * multi, '#0ea5e9', 100);
            }
        }
    }
    draw(ctx) {
        ctx.fillStyle = "#0ea5e9";
        ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.fillRect(this.x-2, this.y-2, 4, 4);
    }
}
