export const keys = {};
export const mouse = { x: window.innerWidth/2, y: window.innerHeight/2, down: false, worldX: 0, worldY: 0 };

export const mobileState = {
    isMobileShooting: false,
    manualAim: false,
    aimAngle: 0,
    activeTarget: null,
    joystickActive: false
};

export function initInput(onGrapple, onPause, isMobileCheck, getCurrentState, GameState, onPlaceTurret, onUltimate, onPlaceBarricade, onInteract, onPlaceLandmine, onPlaceBeacon) {
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
        if(e.key.toLowerCase() === 'c' && getCurrentState() === GameState.PLAYING && onPlaceLandmine) {
            onPlaceLandmine();
        }
        if(e.key.toLowerCase() === 'b' && getCurrentState() === GameState.PLAYING && onPlaceBeacon) {
            onPlaceBeacon();
        }
        if(e.key.toLowerCase() === 'q' && getCurrentState() === GameState.PLAYING && onUltimate) {
            onUltimate();
        }
    });

    window.addEventListener('keyup', e => {
        keys[e.key.toLowerCase()] = keys[e.key] = false;
        if(e.key === 'Escape' && (getCurrentState() === GameState.PLAYING || getCurrentState() === GameState.PAUSED || getCurrentState() === GameState.SHOP)) {
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

export function setupMobileControls(
    onGrapple, 
    isMobileCheck, 
    getCurrentState, 
    GameState, 
    togglePause,
    onPlaceTurret,
    onUltimate,
    onPlaceBarricade,
    onInteract,
    onPlaceLandmine,
    onPlaceBeacon
) {
    const triggerHaptic = (ms = 10) => {
        try { if (navigator.vibrate) navigator.vibrate(ms); } catch(e) {}
    };

    // --- 1. Floating Virtual Joystick ---
    const joyZone = document.getElementById('joystick-zone');
    const joyBase = document.getElementById('joystick-base');
    const joyNub = document.getElementById('joystick-nub');

    if (joyZone && joyBase && joyNub) {
        let joyTouchId = null;
        let originX = 0;
        let originY = 0;
        const maxRadius = 45;

        const resetJoystick = () => {
            joyTouchId = null;
            mobileState.joystickActive = false;
            keys['a'] = false;
            keys['arrowleft'] = false;
            keys['d'] = false;
            keys['arrowright'] = false;
            keys['w'] = false;
            keys['arrowup'] = false;
            keys['s'] = false;
            keys['arrowdown'] = false;
            joyNub.style.transform = 'translate(0px, 0px)';
            joyBase.style.opacity = '0.6';
        };

        joyZone.addEventListener('touchstart', (e) => {
            if (joyTouchId !== null) return;
            const touch = e.changedTouches[0];
            joyTouchId = touch.identifier;
            mobileState.joystickActive = true;

            const rect = joyZone.getBoundingClientRect();
            let localX = touch.clientX - rect.left;
            let localY = touch.clientY - rect.top;

            const baseHalf = joyBase.offsetWidth / 2 || 60;
            localX = Math.max(baseHalf, Math.min(rect.width - baseHalf, localX));
            localY = Math.max(baseHalf, Math.min(rect.height - baseHalf, localY));

            originX = rect.left + localX;
            originY = rect.top + localY;

            joyBase.style.left = `${localX - baseHalf}px`;
            joyBase.style.bottom = 'auto';
            joyBase.style.top = `${localY - baseHalf}px`;
            joyBase.style.opacity = '0.95';
            joyNub.style.transform = 'translate(0px, 0px)';
            triggerHaptic(8);
        }, { passive: false });

        const handleJoyMove = (e) => {
            if (joyTouchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === joyTouchId) {
                    e.preventDefault();
                    let dx = touch.clientX - originX;
                    let dy = touch.clientY - originY;
                    let dist = Math.hypot(dx, dy);
                    let angle = Math.atan2(dy, dx);

                    let clampedDist = Math.min(dist, maxRadius);
                    let nx = Math.cos(angle) * clampedDist;
                    let ny = Math.sin(angle) * clampedDist;
                    joyNub.style.transform = `translate(${nx}px, ${ny}px)`;

                    // Horizontal steering with 10px deadzone
                    if (Math.abs(dx) > 10) {
                        if (dx < 0) {
                            keys['a'] = true; keys['arrowleft'] = true;
                            keys['d'] = false; keys['arrowright'] = false;
                        } else {
                            keys['d'] = true; keys['arrowright'] = true;
                            keys['a'] = false; keys['arrowleft'] = false;
                        }
                    } else {
                        keys['a'] = false; keys['arrowleft'] = false;
                        keys['d'] = false; keys['arrowright'] = false;
                    }

                    // Vertical upward flick to jump
                    if (dy < -28) {
                        keys['w'] = true; keys['arrowup'] = true;
                    } else {
                        keys['w'] = false; keys['arrowup'] = false;
                    }

                    // Downward pull: enables platform drop-down & grapple slam!
                    if (dy > 20) {
                        keys['s'] = true; keys['arrowdown'] = true;
                    } else {
                        keys['s'] = false; keys['arrowdown'] = false;
                    }
                    break;
                }
            }
        };

        const handleJoyEnd = (e) => {
            if (joyTouchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joyTouchId) {
                    e.preventDefault();
                    resetJoystick();
                    break;
                }
            }
        };

        window.addEventListener('touchmove', handleJoyMove, { passive: false });
        window.addEventListener('touchend', handleJoyEnd, { passive: false });
        window.addEventListener('touchcancel', handleJoyEnd, { passive: false });
    }

    // --- 2. Primary Combat Actions ---
    // Shoot (Fire) with Twin-Stick Drag Aiming
    const shootBtn = document.getElementById('m-shoot');
    if (shootBtn) {
        let shootTouchId = null;
        let shootOriginX = 0;
        let shootOriginY = 0;

        shootBtn.addEventListener('touchstart', (e) => {
            if (shootTouchId !== null) return;
            const touch = e.changedTouches[0];
            shootTouchId = touch.identifier;
            const rect = shootBtn.getBoundingClientRect();
            shootOriginX = rect.left + rect.width / 2;
            shootOriginY = rect.top + rect.height / 2;

            mouse.down = true;
            mobileState.isMobileShooting = true;
            mobileState.manualAim = false;
            triggerHaptic(10);
        }, { passive: false });

        const handleShootMove = (e) => {
            if (shootTouchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === shootTouchId) {
                    let dx = touch.clientX - shootOriginX;
                    let dy = touch.clientY - shootOriginY;
                    let dist = Math.hypot(dx, dy);
                    // Drag threshold for twin-stick precision aiming
                    if (dist > 14) {
                        mobileState.manualAim = true;
                        mobileState.aimAngle = Math.atan2(dy, dx);
                    } else {
                        mobileState.manualAim = false;
                    }
                    break;
                }
            }
        };

        const handleShootEnd = (e) => {
            if (shootTouchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === shootTouchId) {
                    shootTouchId = null;
                    mouse.down = false;
                    mobileState.isMobileShooting = false;
                    mobileState.manualAim = false;
                    break;
                }
            }
        };

        window.addEventListener('touchmove', handleShootMove, { passive: false });
        window.addEventListener('touchend', handleShootEnd, { passive: false });
        window.addEventListener('touchcancel', handleShootEnd, { passive: false });
    }

    // Jump
    const jumpBtn = document.getElementById('m-jump');
    if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys['w'] = true;
            keys[' '] = true;
            keys['arrowup'] = true;
            triggerHaptic(12);
        }, { passive: false });

        const endJump = (e) => {
            e.preventDefault();
            keys['w'] = false;
            keys[' '] = false;
            keys['arrowup'] = false;
        };
        jumpBtn.addEventListener('touchend', endJump, { passive: false });
        jumpBtn.addEventListener('touchcancel', endJump, { passive: false });
    }

    // Evasive Dash
    const dashBtn = document.getElementById('m-dash');
    if (dashBtn) {
        dashBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys['shift'] = true;
            triggerHaptic(14);
            setTimeout(() => { keys['shift'] = false; }, 120);
        }, { passive: false });
    }

    // Reload
    const reloadBtn = document.getElementById('m-reload');
    if (reloadBtn) {
        reloadBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys['r'] = true;
            triggerHaptic(10);
            setTimeout(() => { keys['r'] = false; }, 120);
        }, { passive: false });
    }

    // Grapple Hook
    const grappleBtn = document.getElementById('m-grapple');
    if (grappleBtn) {
        grappleBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (getCurrentState() === GameState.PLAYING && onGrapple) {
                onGrapple();
                triggerHaptic(14);
            }
        }, { passive: false });
    }

    // --- 3. Deployables Drawer ---
    const deployToggle = document.getElementById('m-deploy-toggle');
    const deployDrawer = document.getElementById('m-deploy-drawer');
    if (deployToggle && deployDrawer) {
        deployToggle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isHidden = deployDrawer.classList.contains('opacity-0');
            if (isHidden) {
                deployDrawer.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
                deployToggle.classList.add('bg-amber-500/40', 'border-amber-400');
            } else {
                deployDrawer.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
                deployToggle.classList.remove('bg-amber-500/40', 'border-amber-400');
            }
            triggerHaptic(10);
        }, { passive: false });

        document.addEventListener('touchstart', (e) => {
            if (!deployDrawer.classList.contains('opacity-0') &&
                !deployDrawer.contains(e.target) &&
                !deployToggle.contains(e.target)) {
                deployDrawer.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
                deployToggle.classList.remove('bg-amber-500/40', 'border-amber-400');
            }
        });
    }

    const bindDeployItem = (id, handler) => {
        const el = document.getElementById(id);
        if (!el || !handler) return;
        el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (getCurrentState() === GameState.PLAYING) {
                handler();
                triggerHaptic(15);
            }
        }, { passive: false });
    };

    bindDeployItem('m-turret', onPlaceTurret);
    bindDeployItem('m-barricade', onPlaceBarricade);
    bindDeployItem('m-mine', onPlaceLandmine);
    bindDeployItem('m-beacon', onPlaceBeacon);

    // --- 4. Ultimate & Contextual Interact ---
    const ultBtn = document.getElementById('m-ultimate');
    if (ultBtn) {
        ultBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (getCurrentState() === GameState.PLAYING && onUltimate) {
                onUltimate();
                triggerHaptic(25);
            }
        }, { passive: false });
    }

    const interactBtn = document.getElementById('m-interact');
    if (interactBtn) {
        interactBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (getCurrentState() === GameState.PLAYING && onInteract) {
                onInteract();
                triggerHaptic(15);
            }
        }, { passive: false });
    }
}
