export const keys = {};
export const mouse = { x: window.innerWidth/2, y: window.innerHeight/2, down: false, worldX: 0, worldY: 0 };

export const mobileState = {
    isMobileShooting: false
};

export function initInput(onGrapple, onPause, isMobileCheck, getCurrentState, GameState, onPlaceTurret, onUltimate, onPlaceBarricade, onInteract) {
    window.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = keys[e.key] = true;
        if(e.key.toLowerCase() === 'e' && getCurrentState() === GameState.PLAYING && onInteract) {
            onInteract();
        }
        if(e.key.toLowerCase() === 'g' && getCurrentState() === GameState.PLAYING && onPlaceTurret) {
            onPlaceTurret();
        }
        if(e.key.toLowerCase() === 'f' && getCurrentState() === GameState.PLAYING && onPlaceBarricade) {
            onPlaceBarricade();
        }
        if(e.key.toLowerCase() === 'q' && getCurrentState() === GameState.PLAYING && onUltimate) {
            onUltimate();
        }
    });

    window.addEventListener('keyup', e => {
        keys[e.key.toLowerCase()] = keys[e.key] = false;
        if(e.key === 'Escape' && (getCurrentState() === GameState.PLAYING || getCurrentState() === GameState.PAUSED)) {
            onPause();
        }
    });

    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', e => {
        if(getCurrentState() === GameState.PLAYING && !isMobileCheck()) {
            if(e.button === 2) onGrapple(true); // Launch on right click down
            else mouse.down = true; 
        }
    });

    window.addEventListener('mouseup', e => {
        if(!isMobileCheck()) {
            if(e.button === 2) onGrapple(false); // Release on right click up
            else mouse.down = false; 
        }
    });

    window.addEventListener('contextmenu', e => e.preventDefault());
}

export function setupMobileControls(onGrapple, isMobileCheck, getCurrentState, GameState, togglePause) {
    const bind = (id, key, isClick = false) => {
        const el = document.getElementById(id);
        if(!el) return;
        
        const handleStart = (e) => {
            e.preventDefault();
            if(isClick) { mouse.down = true; mobileState.isMobileShooting = true; }
            else keys[key.toLowerCase()] = keys[key] = true;
        };
        const handleEnd = (e) => {
            e.preventDefault();
            if(isClick) { mouse.down = false; mobileState.isMobileShooting = false; }
            else keys[key.toLowerCase()] = keys[key] = false;
        };

        el.addEventListener('touchstart', handleStart, {passive: false});
        el.addEventListener('touchend', handleEnd, {passive: false});
        el.addEventListener('touchcancel', handleEnd, {passive: false});
    };
    bind('m-left', 'a'); bind('m-right', 'd');
    bind('m-jump', 'w'); bind('m-dash', 'shift'); 
    bind('m-reload', 'r'); bind('m-shoot', '', true);
    
    const grappleBtn = document.getElementById('m-grapple');
    if(grappleBtn) {
        grappleBtn.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            if(getCurrentState() === GameState.PLAYING) onGrapple(); 
        }, {passive: false});
    }
}
