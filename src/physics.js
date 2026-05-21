import { MAP_WIDTH, MAP_HEIGHT } from './constants.js';

export class Rect {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }

    intersects(other) {
        return this.x < other.x + other.width && this.x + this.width > other.x &&
               this.y < other.y + other.height && this.y + this.height > other.y;
    }
}

export const platforms = [];

export function generateMap() {
    platforms.length = 0; // Clear
    platforms.push(new Rect(-500, MAP_HEIGHT - 100, MAP_WIDTH + 1000, 200)); 
    
    for(let i=0; i < 25; i++) {
        let placed = false;
        let attempts = 0;
        while(!placed && attempts < 50) {
            let w = 150 + Math.random() * 200;
            let h = 40;
            let x = Math.random() * (MAP_WIDTH - w);
            let y = Math.random() * (MAP_HEIGHT - 300) + 100;
            let newPlat = new Rect(x, y, w, h);
            
            let overlap = false;
            for(let p of platforms) {
                if (newPlat.x < p.x + p.width + 50 && newPlat.x + newPlat.width + 50 > p.x &&
                    newPlat.y < p.y + p.height + 100 && newPlat.y + newPlat.height + 100 > p.y) {
                    overlap = true; break;
                }
            }
            if(!overlap) { platforms.push(newPlat); placed = true; }
            attempts++;
        }
    }
}
