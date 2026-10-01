import { Rect } from '../physics.js';
import { gameState } from '../state.js';
import { createParticles, createExplosion, createFloatingText } from '../effects.js';

export class Landmine extends Rect {
    constructor(x, y) {
        super(x, y, 24, 10);
        this.armed = false;
        this.armTimer = 0.5;
        this.dead = false;
        this.dmg = 240;
        this.radius = 150;
        this.blinkTimer = 0;
    }

    update(dt) {
        if (this.dead) return;

        if (!this.armed) {
            this.armTimer -= dt;
            if (this.armTimer <= 0) {
                this.armed = true;
                createParticles(this.x + 12, this.y + 5, 6, '#ef4444', 60);
            }
            return;
        }

        this.blinkTimer = (this.blinkTimer + dt * 6) % Math.PI;

        // Check enemy triggers
        for (let e of gameState.enemies) {
            if (e.dead) continue;
            let dist = Math.hypot((e.x + e.width / 2) - (this.x + 12), (e.y + e.height) - (this.y + 5));
            if (dist < 40) {
                this.detonate();
                break;
            }
        }
    }

    detonate() {
        if (this.dead) return;
        this.dead = true;
        createExplosion(this.x + 12, this.y + 5, this.radius, this.dmg);
        gameState.camera.shake = 8;
        createParticles(this.x + 12, this.y + 5, 20, '#f97316', 220);
        createFloatingText(this.x + 12, this.y - 15, "MINE BLAST!", '#f97316');
    }

    draw(ctx) {
        if (this.dead) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Mine base plate
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(0, 4, 24, 6, 2);
        ctx.fill();

        // Mine core
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(12, 5, 5, Math.PI, 0);
        ctx.fill();

        // Flashing LED
        let ledColor = !this.armed ? '#eab308' : (Math.sin(this.blinkTimer) > 0.4 ? '#ef4444' : '#7f1d1d');
        ctx.fillStyle = ledColor;
        ctx.beginPath();
        ctx.arc(12, 3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class NanoBeacon extends Rect {
    constructor(x, y) {
        super(x, y, 28, 48);
        this.hp = 350;
        this.maxHp = 350;
        this.range = 220;
        this.pulseTimer = 0;
        this.pulseRadius = 0;
        this.dead = false;
    }

    update(dt) {
        if (this.dead) return;

        this.pulseTimer += dt;
        this.pulseRadius = ((this.pulseTimer * 80) % this.range);

        // Periodic heal and shield pulse
        const player = gameState.player;
        if (player) {
            let dist = Math.hypot((player.x + player.width / 2) - (this.x + 14), (player.y + player.height / 2) - (this.y + 24));
            if (dist < this.range) {
                // Heal player
                if (player.hp < player.maxHp) {
                    player.hp = Math.min(player.maxHp, player.hp + 6 * dt);
                }
                // Charge shield
                if (player.shield < player.maxShield) {
                    player.shield = Math.min(player.maxShield, player.shield + 12 * dt);
                }
            }
        }

        // Repair nearby turrets & barricades
        [...gameState.turrets, ...gameState.barricades].forEach(obj => {
            let dist = Math.hypot(obj.x - this.x, obj.y - this.y);
            if (dist < this.range) {
                if (obj.hp !== undefined && obj.maxHp !== undefined && obj.hp < obj.maxHp) {
                    obj.hp = Math.min(obj.maxHp, obj.hp + 20 * dt);
                }
            }
        });
    }

    takeDamage(dmg) {
        this.hp -= dmg;
        createParticles(this.x + 14, this.y + 24, 4, '#06b6d4', 80);
        if (this.hp <= 0) {
            this.dead = true;
            createExplosion(this.x + 14, this.y + 24, 80, 20);
            createFloatingText(this.x + 14, this.y - 10, "BEACON DESTROYED", '#ef4444');
        }
    }

    draw(ctx) {
        if (this.dead) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Base
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(0, 36, 28, 12, 3);
        ctx.fill();

        // Pylon stem
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(10, 14, 8, 22);

        // Glowing crystal top
        let glowIntensity = 0.7 + Math.sin(this.pulseTimer * 4) * 0.3;
        ctx.fillStyle = `rgba(56, 189, 248, ${glowIntensity})`;
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(24, 14);
        ctx.lineTo(14, 20);
        ctx.lineTo(4, 14);
        ctx.closePath();
        ctx.fill();

        // HP bar above beacon
        if (this.hp < this.maxHp) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, -10, 28, 4);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(0, -10, 28 * (this.hp / this.maxHp), 4);
        }

        ctx.restore();

        // Aura pulse ring
        ctx.save();
        ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 0.4 - (this.pulseRadius / this.range) * 0.4)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x + 14, this.y + 24, this.pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}
