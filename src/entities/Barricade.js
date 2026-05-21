export class Barricade {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.maxHp = 200;
        this.hp = 200;
        this.dead = false;
        this.isBarricade = true;
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) this.dead = true;
    }

    draw(ctx) {
        // Draw wood crate block
        ctx.fillStyle = '#78350f'; 
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = '#451a03'; 
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
        
        // Draw diagonal crossbeams
        ctx.beginPath();
        ctx.moveTo(this.x + 2, this.y + 2);
        ctx.lineTo(this.x + this.width - 2, this.y + this.height - 2);
        ctx.moveTo(this.x + this.width - 2, this.y + 2);
        ctx.lineTo(this.x + 2, this.y + this.height - 2);
        ctx.stroke();

        // Draw HP bar above barricade
        if (this.hp < this.maxHp) {
            let pct = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(this.x, this.y - 8, this.width, 4);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(this.x, this.y - 8, this.width * pct, 4);
        }
    }
}
