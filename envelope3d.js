// =========================================================
// P4 — Wax-Sealed Letter (vanilla Three.js, procedural geometry)
// Visual layer over the existing #open-surprise-btn. All functional
// logic (music start, motion permission, overlay reveal) stays in
// script.js; this module only choreographs the entry gesture.
//
// Fallback cascade (any failure → original flat envelope + inline openSurprise()):
//   reduced-motion | no WebGL | no GSAP | three load fails | init throws.
// The mode (html.env-3d vs html.env-flat) is decided pre-paint by the inline
// detector in <head>, so the flat envelope never flashes before the 3D scene.
// Hard safety: once the reveal begins, revealCard() is force-called after 3s.
// =========================================================
// three is imported dynamically inside boot() so a load failure is catchable
// and we can revert to the flat envelope instead of stranding the user.
let THREE = null;

const overlay = document.getElementById('surprise-overlay');
const canvas = document.getElementById('envelope-canvas');
const btn = document.getElementById('open-surprise-btn');
const gsap = window.gsap;

const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer, scene, camera, timer, envelope, keyLight, letterTex;
let aborted = false;
let raf = 0;
let tl = null;
let safetyTimer = 0;
let disposeTimer = 0;
let hasBegun = false;
let finished = false;
let disposed = false;
const isSmall = window.innerWidth < 700;

function webglSupported() {
    try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

// ---- Bootstrap / fallback gate -------------------------------------------
async function boot() {
    if (prefersReduced || !overlay || !canvas || !btn || !gsap || !webglSupported()) {
        revertToFlat(); // ensure the flat envelope + inline openSurprise() path
        return;
    }
    // Slow/stalled library load → show the flat envelope rather than a dark void.
    const loadTimer = setTimeout(() => { aborted = true; revertToFlat(); }, 3500);
    try {
        THREE = await import('three');
    } catch (e) {
        clearTimeout(loadTimer);
        console.warn('[envelope3d] three load failed, using fallback:', e);
        revertToFlat();
        return;
    }
    clearTimeout(loadTimer);
    if (aborted) return; // load came back after the timeout already reverted
    try {
        init();
    } catch (e) {
        console.warn('[envelope3d] init failed, using fallback:', e);
        revertToFlat();
    }
}

// Switch from the optimistic 3D mode back to the flat envelope and restore the
// original click handler (covers no-gsap / load-fail / init-throw).
function revertToFlat() {
    document.documentElement.classList.remove('env-3d');
    document.documentElement.classList.add('env-flat');
    if (btn) {
        try { btn.removeEventListener('click', beginReveal); } catch (e) {}
        btn.onclick = window.openSurprise || null;
    }
}

// ---- Geometry helpers -----------------------------------------------------
function roundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
}

function heartShape(scale) {
    const s = new THREE.Shape();
    const x = 0, y = 0;
    s.moveTo(x, y + 0.5 * scale);
    s.bezierCurveTo(x, y + 0.7 * scale, x - 0.5 * scale, y + 1.1 * scale, x - 0.5 * scale, y + 0.5 * scale);
    s.bezierCurveTo(x - 0.5 * scale, y + 0.1 * scale, x, y - 0.1 * scale, x, y - 0.4 * scale);
    s.bezierCurveTo(x, y - 0.1 * scale, x + 0.5 * scale, y + 0.1 * scale, x + 0.5 * scale, y + 0.5 * scale);
    s.bezierCurveTo(x + 0.5 * scale, y + 1.1 * scale, x, y + 0.7 * scale, x, y + 0.5 * scale);
    return s;
}

function makeLetterTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    const draw = () => {
        x.clearRect(0, 0, 512, 512);
        x.fillStyle = '#fbf3ec';
        x.fillRect(0, 0, 512, 512);
        x.strokeStyle = 'rgba(224,96,126,0.12)';
        x.lineWidth = 2;
        for (let i = 170; i < 420; i += 56) {
            x.beginPath(); x.moveTo(70, i); x.lineTo(442, i); x.stroke();
        }
        x.textAlign = 'center';
        x.fillStyle = '#e0607e';
        x.font = '600 56px Caveat, "Segoe Script", cursive';
        x.fillText('I have a question', 256, 232);
        x.fillText('for you…', 256, 300);
        // small heart
        x.fillStyle = '#ff8fa3';
        x.beginPath();
        const hx = 256, hy = 360, s = 16;
        x.moveTo(hx, hy + s * 0.9);
        x.bezierCurveTo(hx - s, hy - s * 0.4, hx - s * 1.4, hy + s * 0.5, hx, hy + s * 1.4);
        x.bezierCurveTo(hx + s * 1.4, hy + s * 0.5, hx + s, hy - s * 0.4, hx, hy + s * 0.9);
        x.fill();
    };
    draw();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => { draw(); tex.needsUpdate = true; }).catch(() => {});
    }
    return tex;
}

// ---- Scene ----------------------------------------------------------------
function init() {
    const w = window.innerWidth, h = window.innerHeight;

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isSmall });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0.4, 6);
    camera.lookAt(0, 0, 0);
    timer = new THREE.Timer();

    // Lighting — candlelit, warm key + soft fill + cool rim.
    scene.add(new THREE.HemisphereLight(0xffe6cf, 0x2a1830, 1.2));
    keyLight = new THREE.DirectionalLight(0xffd9b0, 2.4);
    keyLight.position.set(-3.2, 4.5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(isSmall ? 512 : 1024, isSmall ? 512 : 1024);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -4; keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4; keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);
    const rim = new THREE.DirectionalLight(0xbfa9ff, 0.5);
    rim.position.set(2.5, 1.5, -3);
    scene.add(rim);

    // Soft contact shadow on an invisible ground.
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.ShadowMaterial({ opacity: 0.28 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.35;
    ground.receiveShadow = true;
    scene.add(ground);

    envelope = new THREE.Group();
    envelope.rotation.x = -0.16;
    scene.add(envelope);

    const W = 3.2, H = 2.2;
    const paper = new THREE.MeshStandardMaterial({ color: 0xfbf3ec, roughness: 0.85, metalness: 0 });
    const paperBack = new THREE.MeshStandardMaterial({ color: 0xefe2d8, roughness: 0.9, metalness: 0 });

    // Back panel
    const back = new THREE.Mesh(
        new THREE.ExtrudeGeometry(roundedRectShape(W, H, 0.12), { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }),
        paper
    );
    back.castShadow = true; back.receiveShadow = true;
    envelope.add(back);

    // Front pocket (lower ~60%), slightly forward
    const front = new THREE.Mesh(
        new THREE.ExtrudeGeometry(roundedRectShape(W - 0.04, H * 0.62, 0.1), { depth: 0.05, bevelEnabled: false }),
        paper
    );
    front.position.set(0, -H * 0.19, 0.09);
    front.castShadow = true; front.receiveShadow = true;
    envelope.add(front);

    // Letter — rises out of the pocket and unfurls.
    letterTex = makeLetterTexture();
    const letter = new THREE.Mesh(
        new THREE.PlaneGeometry(W - 0.5, H - 0.3),
        new THREE.MeshStandardMaterial({ map: letterTex, color: 0xffffff, roughness: 0.9, metalness: 0, side: THREE.DoubleSide })
    );
    const letterRoot = new THREE.Group();
    letterRoot.position.set(0, -1.15, 0.04); // tucked fully inside the pocket when closed
    letter.position.set(0, (H - 0.3) / 2 - 0.2, 0);
    letter.rotation.x = -0.9;        // tucked back in the pocket
    letter.scale.y = 0.5;            // folded
    letterRoot.add(letter);
    envelope.add(letterRoot);

    // Flap — triangle hinged at the top edge.
    const flapShape = new THREE.Shape();
    flapShape.moveTo(-W / 2, 0);
    flapShape.lineTo(W / 2, 0);
    flapShape.lineTo(0, -1.15);
    flapShape.lineTo(-W / 2, 0);
    const flap = new THREE.Mesh(
        new THREE.ExtrudeGeometry(flapShape, { depth: 0.05, bevelEnabled: false }),
        paperBack
    );
    flap.castShadow = true;
    const flapPivot = new THREE.Group();
    flapPivot.position.set(0, H / 2, 0.05);
    flapPivot.add(flap);
    envelope.add(flapPivot);

    // Wax seal — two halves + a heart, at the flap tip when closed.
    const seal = new THREE.Group();
    seal.position.set(0, -0.95, 0.12);
    const waxMat = () => new THREE.MeshStandardMaterial({ color: 0xc98a5e, emissive: 0x612d12, emissiveIntensity: 0.4, roughness: 0.5, metalness: 0.2, transparent: true, opacity: 1 });
    const half = (start) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 24, 1, false, start, Math.PI), waxMat());
        m.rotation.x = Math.PI / 2;
        m.castShadow = true;
        return m;
    };
    const sealL = half(Math.PI / 2);
    const sealR = half(-Math.PI / 2);
    const heart = new THREE.Mesh(
        new THREE.ExtrudeGeometry(heartShape(0.22), { depth: 0.04, bevelEnabled: false }),
        new THREE.MeshStandardMaterial({ color: 0xe8b48f, emissive: 0x7a4a22, emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.3, transparent: true, opacity: 1 })
    );
    heart.position.set(0, -0.05, 0.05);
    seal.add(sealL, sealR, heart);
    flapPivot.add(seal); // seal rides on the flap (closed position)

    // Build the open timeline (paused).
    tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.inOut' }, onComplete: finish });
    // crack
    tl.to(sealL.position, { x: -0.35, y: -1.25, duration: 0.45, ease: 'power2.in' }, 0)
      .to(sealL.rotation, { z: 0.7, duration: 0.45 }, 0)
      .to(sealR.position, { x: 0.35, y: -1.25, duration: 0.45, ease: 'power2.in' }, 0)
      .to(sealR.rotation, { z: -0.7, duration: 0.45 }, 0)
      .to([sealL.material, sealR.material, heart.material], { opacity: 0, duration: 0.4 }, 0.15)
      .to(heart.scale, { x: 0.2, y: 0.2, z: 0.2, duration: 0.4 }, 0.15)
      // flap opens
      .to(flapPivot.rotation, { x: -2.5, duration: 0.7 }, 0.28)
      // letter rises + unfurls
      .to(letterRoot.position, { y: 0.95, duration: 0.75, ease: 'power2.out' }, 0.85)
      .to(letter.rotation, { x: 0, duration: 0.75, ease: 'power2.out' }, 0.85)
      .to(letter.scale, { y: 1, duration: 0.75, ease: 'power2.out' }, 0.85)
      // camera draws in
      .to(camera.position, { z: 4.7, duration: 0.55, ease: 'power2.inOut' }, 1.35);

    btn.onclick = null;                          // detach inline openSurprise()
    btn.addEventListener('click', beginReveal);  // pointer + keyboard (button)
    window.addEventListener('resize', onResize);
    window.addEventListener('pagehide', dispose);

    // Draw the first frame BEFORE revealing the canvas, then fade it in over the
    // dark candlelit placeholder — the envelope emerges, never "pops" in blank.
    renderer.render(scene, camera);
    requestAnimationFrame(() => { if (!disposed) overlay.classList.add('env-ready'); });

    renderLoop();
}

function onResize() {
    if (!renderer || disposed) return;
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

function renderLoop() {
    raf = requestAnimationFrame(renderLoop);
    timer.update();
    const t = timer.getElapsed();
    // candle flicker
    if (keyLight) keyLight.intensity = 2.4 + Math.sin(t * 9) * 0.07 + Math.sin(t * 23) * 0.04;
    // gentle invite float until the gesture
    if (envelope && !hasBegun) {
        envelope.rotation.y = Math.sin(t * 0.8) * 0.08;
        envelope.position.y = Math.sin(t * 1.1) * 0.04;
    }
    renderer.render(scene, camera);
}

// ---- Gesture & handoff ----------------------------------------------------
function beginReveal() {
    if (hasBegun || disposed) return;
    hasBegun = true;
    // Gesture-critical: music + motion permission, synchronously.
    if (typeof window.primeExperience === 'function') window.primeExperience();
    // Hard safety: never trap the user behind the envelope.
    safetyTimer = setTimeout(finish, 3000);
    if (tl) tl.play(); else finish();
}

function finish() {
    if (finished || disposed) return;
    finished = true;
    clearTimeout(safetyTimer);
    if (typeof window.revealCard === 'function') window.revealCard();
    moveFocus();
    disposeTimer = setTimeout(dispose, 1000); // after the overlay CSS transition
}

function moveFocus() {
    const main = document.getElementById('main-container');
    if (main) {
        main.setAttribute('tabindex', '-1');
        try { main.focus({ preventScroll: true }); } catch (e) {}
    }
}

// ---- Teardown -------------------------------------------------------------
function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    clearTimeout(safetyTimer);
    clearTimeout(disposeTimer);
    if (tl) { tl.kill(); tl = null; }
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pagehide', dispose);
    if (btn) btn.removeEventListener('click', beginReveal);
    if (scene) {
        scene.traverse((o) => {
            if (o.geometry) o.geometry.dispose();
            const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
            mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
        });
    }
    if (letterTex) letterTex.dispose();
    if (renderer) {
        renderer.dispose();
        try { renderer.forceContextLoss(); } catch (e) {}
    }
    renderer = scene = camera = envelope = keyLight = letterTex = null;
}

boot();
