import { GameState } from './constants.js';

export const gameState = {
    player: null,
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    pickups: [],
    turrets: [],
    companions: [],
    barrels: [],
    barricades: [],
    landmines: [],
    beacons: [],
    hazardZones: [],
    carePackages: [],
    particles: [],
    slashes: [],
    rainParticles: [],
    currentWave: 1,
    score: 0,
    money: 0,
    isRaining: false,
    waveKills: 0,
    killsNeeded: 10,
    comboCount: 0,
    comboTimer: 0,
    spawnTimer: 0,
    adrenalineActive: false,
    adrenalineTimer: 0,
    carePackageTimer: 30.0,
    gameMode: 'survival', // 'survival' | 'sandbox'
    sandboxTime: 0,
    sandboxBossTimer: 75.0,
    totalKills: 0,
    currentState: GameState.MENU,
    camera: { x: 0, y: 0, targetX: 0, targetY: 0, smoothing: 0.1, shake: 0 }
};

export function isMobileCheck() {
    return (
        (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
        (typeof window !== 'undefined' && (
            window.innerWidth <= 768 ||
            (window.innerWidth <= 1024 && window.innerHeight <= 550) ||
            (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
        ))
    );
}

