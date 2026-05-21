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

export function drawZombie(ctx, x, y, w, h, facingRight, typeColor, hpRatio) {
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    if (!facingRight) ctx.scale(-1, 1);

    ctx.fillStyle = typeColor; // Body
    ctx.fillRect(-w/2 + 4, -h/2 + 10, w - 8, h - 14);
    
    ctx.fillStyle = "#4ade80"; // Head
    ctx.fillRect(-w/2 + 2, -h/2 - 10, w - 4, 20);
    
    ctx.fillStyle = "#ef4444"; // Eyes
    ctx.fillRect(w/2 - 8, -h/2 - 4, 4, 4);
    
    ctx.fillStyle = "#4ade80"; // Reaching Arm
    ctx.fillRect(w/2 - 4, 0, 16, 6);
    
    if(hpRatio < 1) {
        ctx.fillStyle = `rgba(100, 0, 0, ${1 - hpRatio})`;
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillRect(-w/2, -h/2 - 10, w, h + 10);
        ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore();
}
