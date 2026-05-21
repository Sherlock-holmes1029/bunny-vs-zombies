import { gameState, isMobileCheck } from './state.js';
import { mouse, mobileState } from './input.js';
import { MAP_WIDTH, MAP_HEIGHT } from './constants.js';

export function updateCamera(dt, cw, ch) {
    const player = gameState.player;
    const camera = gameState.camera;
    if (!player) return;

    const isMobile = isMobileCheck();
    if(mobileState.isMobileShooting || isMobile) {
        camera.targetX = player.x + player.width/2;
        camera.targetY = player.y + player.height/2;
    } else {
        camera.targetX = player.x + (mouse.worldX - player.x)*0.2;
        camera.targetY = player.y + (mouse.worldY - player.y)*0.2;
    }

    let smoothFactor = 1 - Math.pow(1 - camera.smoothing, dt * 60);
    camera.x += (camera.targetX - cw/2 - camera.x) * smoothFactor;
    camera.y += (camera.targetY - ch/2 - camera.y) * smoothFactor;
    camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH - cw));
    camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT - ch));
}
