import { gameState } from './state.js';

export function createParticles(x, y, count, color, speed) {
    for(let i=0; i<count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let s = Math.random() * speed;
        gameState.particles.push({
            x: x, y: y,
            vx: Math.cos(angle)*s, vy: Math.sin(angle)*s,
            life: 0.2 + Math.random()*0.3,
            color: color,
            size: 2 + Math.random()*4
        });
    }
}

export function createMeleeSlash(x, y, facingRight, range) {
    gameState.slashes.push({
        x: x, y: y,
        radius: range,
        facingRight: facingRight,
        life: 0.15, maxLife: 0.15
    });
}

export function createExplosion(x, y, radius, dmg, damagesPlayer=false) {
    createParticles(x, y, 30, '#ef4444', 400);
    createParticles(x, y, 20, '#f59e0b', 300);
    gameState.camera.shake = 10;

    gameState.enemies.forEach(e => {
        if (!e.dead && Math.hypot((e.x+e.width/2)-x, (e.y+e.height/2)-y) < radius) {
            e.takeDamage(dmg); e.vx += (e.x - x) * 2; e.vy -= 200;
        }
    });

    if(damagesPlayer && gameState.player && Math.hypot((gameState.player.x+gameState.player.width/2)-x, (gameState.player.y+gameState.player.height/2)-y) < radius) {
        gameState.player.takeDamage(dmg); gameState.player.vx += (gameState.player.x - x) * 2;
    }
}

export function createFloatingText(x, y, text, color) {
    gameState.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 60, vy: -150 - Math.random() * 50,
        life: 0.6,
        color: color,
        text: text
    });
}
