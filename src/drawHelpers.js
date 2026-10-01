export function drawBunny(ctx, x, y, w, h, facingRight, color="#fff") {
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    if (!facingRight) ctx.scale(-1, 1);
    
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(0, 5, 12, 14, 0, 0, Math.PI*2); ctx.fill(); // Body
    ctx.beginPath(); ctx.arc(0, -8, 10, 0, Math.PI*2); ctx.fill(); // Head
    ctx.beginPath(); ctx.ellipse(-4, -20, 3, 10, -0.2, 0, Math.PI*2); ctx.fill(); // Ears
    ctx.beginPath(); ctx.ellipse(4, -20, 3, 10, 0.2, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = "#fbcfe8"; // Inner Ears
    ctx.beginPath(); ctx.ellipse(-4, -19, 1.5, 7, -0.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -19, 1.5, 7, 0.2, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = "#000"; // Eyes
    ctx.beginPath(); ctx.arc(4, -10, 2, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = "#fff"; // Tail
    ctx.beginPath(); ctx.arc(-12, 10, 5, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}

export function drawZombie(ctx, x, y, w, h, facingRight, typeColor, hpRatio, type = 'normal', enemy = null) {
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    if (!facingRight) ctx.scale(-1, 1);

    // Stalker cloaking transparency
    if (type === 'stalker') {
        ctx.globalAlpha = enemy && enemy.cloakAlpha !== undefined ? enemy.cloakAlpha : 0.25;
    }

    // Body
    ctx.fillStyle = typeColor;
    ctx.fillRect(-w/2 + 4, -h/2 + 10, w - 8, h - 14);
    
    // Head
    let headColor = type === 'shock' ? '#38bdf8' : (type === 'boss_necromancer' ? '#7e22ce' : (type === 'boss_behemoth' ? '#44403c' : '#4ade80'));
    ctx.fillStyle = headColor;
    ctx.fillRect(-w/2 + 2, -h/2 - 10, w - 4, 20);
    
    // Eyes
    let eyeColor = type === 'shock' ? '#e0f2fe' : (type === 'boss_broodmother' ? '#a3e635' : '#ef4444');
    ctx.fillStyle = eyeColor;
    ctx.fillRect(w/2 - 8, -h/2 - 4, 4, 4);
    if (type === 'boss_broodmother') {
        // Multi-eyes
        ctx.fillRect(w/2 - 14, -h/2 - 7, 3, 3);
        ctx.fillRect(w/2 - 6, -h/2 - 8, 3, 3);
    }
    
    // Arm
    ctx.fillStyle = headColor;
    ctx.fillRect(w/2 - 4, 0, 16, 6);

    // Specific enemy visual enhancements
    if (type === 'shield') {
        // Heavy steel riot shield held in front
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.roundRect(w/2 + 4, -h/2 - 6, 12, h + 10, 3);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(w/2 + 7, -h/2 + 4, 6, 8); // Vision slit
    } else if (type === 'exploder') {
        // Bloated ticking belly
        let isTicking = enemy && enemy.isTicking;
        let bellyColor = isTicking ? (Math.sin(Date.now() * 0.02) > 0 ? '#ef4444' : '#fee2e2') : '#ef4444';
        ctx.fillStyle = bellyColor;
        ctx.beginPath();
        ctx.arc(0, 4, 14, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'shock') {
        // Electric arcs
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let ox = (Math.random() - 0.5) * 20;
        let oy = (Math.random() - 0.5) * 30;
        ctx.moveTo(-10, -10);
        ctx.lineTo(ox, oy);
        ctx.lineTo(12, 10);
        ctx.stroke();
    } else if (type === 'boss_behemoth') {
        // Spiked rock shoulder pads
        ctx.fillStyle = '#292524';
        ctx.fillRect(-w/2 - 8, -h/2 - 6, 14, 14);
        ctx.fillRect(w/2 - 6, -h/2 - 6, 14, 14);
    } else if (type === 'boss_necromancer') {
        // Dark levitation crown
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(0, -h/2 - 18, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Damage overlay
    if(hpRatio < 1) {
        ctx.fillStyle = `rgba(100, 0, 0, ${1 - hpRatio})`;
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillRect(-w/2, -h/2 - 10, w, h + 10);
        ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore();
}
