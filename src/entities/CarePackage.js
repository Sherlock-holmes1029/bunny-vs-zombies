import { platforms } from '../physics.js';
import { gameState } from '../state.js';
import { createParticles, createFloatingText } from '../effects.js';
import { updateHUD } from '../ui.js';

export class CarePackage {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.vy = 65; // slow falling rate
        this.parachuting = true;
        this.collected = false;
    }

    update(dt) {
        if (this.collected) return;

        if (this.parachuting) {
            this.y += this.vy * dt;
            
            // Check landing on platforms
            for (let p of platforms) {
                if (this.x + this.width > p.x && this.x < p.x + p.width) {
                    if (this.y + this.height >= p.y && this.y + this.height - this.vy * dt <= p.y + 10) {
                        this.y = p.y - this.height;
                        this.parachuting = false;
                        break;
                    }
                }
            }
        }

        // Check collision with player
        const player = gameState.player;
        if (player) {
            let px = player.x;
            let py = player.y;
            if (this.x < px + player.width && this.x + this.width > px &&
                this.y < py + player.height && this.y + this.height > py) {
                this.collect(player);
            }
        }
    }

    collect(player) {
        this.collected = true;
        
        let roll = Math.random();
        if (roll < 0.33) {
            // Heals player
            let healAmount = Math.min(player.maxHp - player.hp, 40);
            player.hp += healAmount;
            createParticles(this.x + 12, this.y + 12, 15, '#ef4444', 120);
            createFloatingText(this.x + 12, this.y - 10, `+${healAmount} HP`, '#ef4444');
        } else if (roll < 0.66) {
            // Grants gold
            let gold = 150 + Math.floor(Math.random() * 100);
            gameState.money += gold;
            createParticles(this.x + 12, this.y + 12, 15, '#fbbf24', 150);
            createFloatingText(this.x + 12, this.y - 10, `+$${gold}`, '#fbbf24');
        } else {
            // Refills ammo for all equipped firearms
            let refilled = false;
            if (player.weapons) {
                player.weapons.forEach(w => {
                    if (w && w.id !== 'katana') {
                        w.ammo = w.maxAmmo;
                        w.reloading = false;
                        w.reloadTimer = 0;
                        refilled = true;
                    }
                });
            }
            createParticles(this.x + 12, this.y + 12, 15, '#3b82f6', 120);
            createFloatingText(this.x + 12, this.y - 10, refilled ? "AMMO REFILLED!" : "+AMMO", '#3b82f6');
        }
        updateHUD();
    }

    draw(ctx) {
        if (this.collected) return;

        // Draw parachute canopy & strings if floating
        if (this.parachuting) {
            ctx.save();
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1.2;
            
            // Left & right parachute lines
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.width / 2, this.y - 25);
            ctx.moveTo(this.x + this.width, this.y);
            ctx.lineTo(this.x + this.width / 2, this.y - 25);
            ctx.stroke();
            
            // Canopy dome
            ctx.fillStyle = '#ef4444'; // Red parachute
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y - 25, 14, Math.PI, 0, false);
            ctx.fill();
            
            // White stripes on parachute
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y - 25, 14, Math.PI + Math.PI/4, Math.PI + Math.PI/2, false);
            ctx.lineTo(this.x + this.width / 2, this.y - 25);
            ctx.fill();
            
            ctx.restore();
        }

        // Draw package crate
        ctx.save();
        ctx.fillStyle = '#78350f'; // Dark brown wood
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Steel frame/brackets
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
        
        // Yellow stripe/stencil
        ctx.fillStyle = '#eab308';
        ctx.fillRect(this.x + 4, this.y + 8, this.width - 8, 8);
        
        // Draw standard cross symbol
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 10, this.y + 4, 4, 16);
        ctx.fillRect(this.x + 4, this.y + 10, 16, 4);

        ctx.restore();
    }
}
