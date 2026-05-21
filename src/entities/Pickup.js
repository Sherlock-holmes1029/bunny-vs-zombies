import { Rect, platforms } from '../physics.js';
import { GRAVITY, MAP_HEIGHT } from '../constants.js';
import { gameState } from '../state.js';
import { createParticles } from '../effects.js';
import { updateHUD } from '../ui.js';

export class Pickup extends Rect {
    constructor(x, y, type) {
        super(x, y, 15, 15);
        this.type = type;
        this.vy = -300; this.vx = (Math.random() - 0.5) * 200;
        this.active = true;
    }
    update(dt) {
        this.vy += GRAVITY * dt;
        this.x += this.vx * dt; this.y += this.vy * dt;
        
        for (let p of platforms) {
            if (this.intersects(p) && this.vy > 0) {
                this.y = p.y - this.height;
                this.vy *= -0.4; this.vx *= Math.pow(0.8, dt * 60);
            }
        }
        if(this.y > MAP_HEIGHT) this.active = false;
    }
    collect() {
        this.active = false;
        const player = gameState.player;
        if(this.type === 'carrot' && player) {
            player.hp = Math.min(player.maxHp, player.hp + 20);
            updateHUD();
            createParticles(this.x, this.y, 10, '#f97316', 150);
        }
    }
    draw(ctx) {
        ctx.fillStyle = '#f97316'; 
        ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x+this.width, this.y); ctx.lineTo(this.x+this.width/2, this.y+this.height); ctx.fill();
        ctx.fillStyle = '#22c55e'; ctx.fillRect(this.x+4, this.y-4, 7, 4);
    }
}
