import { Rect } from '../physics.js';
import { createParticles } from '../effects.js';

export class ExplosiveBarrel extends Rect {
    constructor(x, y) {
        super(x, y, 24, 32);
        this.hp = 10;
        this.maxHp = 10;
        this.color = '#ef4444';
    }

    takeDamage(amount, gameState) {
        this.hp -= amount;
        if(this.hp <= 0) {
            this.explode(gameState);
            return true;
        }
        return false;
    }

    explode(gameState) {
        // Multi-stage explosion particles
        createParticles(this.x + this.width/2, this.y + this.height/2, 40, '#f97316', 800);
        createParticles(this.x + this.width/2, this.y + this.height/2, 25, '#ef4444', 600);
        createParticles(this.x + this.width/2, this.y + this.height/2, 20, '#eab308', 500);

        let explosionX = this.x + this.width/2;
        let explosionY = this.y + this.height/2;
        let radius = 180;
        let dmg = 250;

        // Damage enemies inside the radius
        gameState.enemies.forEach(enemy => {
            let enemyX = enemy.x + enemy.width/2;
            let enemyY = enemy.y + enemy.height/2;
            let dist = Math.hypot(enemyX - explosionX, enemyY - explosionY);
            if(dist <= radius) {
                let falloff = 1 - (dist / radius);
                enemy.takeDamage(dmg * falloff);
            }
        });

        // Push player back and deal minor self-damage if close
        if(gameState.player) {
            let playerX = gameState.player.x + gameState.player.width/2;
            let playerY = gameState.player.y + gameState.player.height/2;
            let dist = Math.hypot(playerX - explosionX, playerY - explosionY);
            if(dist <= radius) {
                let force = (1 - (dist / radius)) * 600;
                let angle = Math.atan2(playerY - explosionY, playerX - explosionX);
                gameState.player.vx += Math.cos(angle) * force;
                gameState.player.vy += Math.sin(angle) * force - 200;
                gameState.player.takeDamage(20 * (1 - (dist / radius)));
            }
        }
        
        // Trigger camera shake for dramatic effect!
        gameState.camera.shake = 15;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        
        // Rounded barrel shape
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 4);
        ctx.fill();
        ctx.stroke();

        // Metal reinforcement bands
        ctx.fillStyle = '#475569';
        ctx.fillRect(this.x, this.y + 6, this.width, 3);
        ctx.fillRect(this.x, this.y + this.height - 9, this.width, 3);

        // "TNT" label
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', this.x + this.width/2, this.y + this.height/2);

        ctx.restore();
    }
}
