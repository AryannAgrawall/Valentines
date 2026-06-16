// =========================================================
// Luxury atmosphere layer — TASK 3
// Canvas 2D only. No WebGL, no shaders, no particle engine.
// Floating warm dust + a few soft embers, illuminated as if by candlelight.
// Goal: support the mood, never attract attention. Target < 1ms/frame.
//
//   - sits behind everything (z-index:0, prepended to <body>), pointer-events:none
//   - prefers-reduced-motion → a single static frame, no animation
//   - pauses on document.hidden, resumes on visible
//   - listeners disposed on pagehide (no leaks)
// =========================================================
(function () {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canvas = document.createElement('canvas');
    canvas.id = 'atmosphere';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1;
    let raf = 0;
    let last = 0;
    let disposed = false;
    let mo = null;
    let resizeRaf = 0;

    // Pointer parallax (optional, max 8px, very soft) — skipped on touch.
    let pointerX = 0.5, pointerY = 0.5;       // normalized target
    let offX = 0, offY = 0;                    // eased current offset (px)
    const MAX_OFFSET = 8;

    // ---- Soft sprite cache (radial gradient dots) -------------------------
    function sprite(rgb) {
        const size = 64;
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, 'rgba(' + rgb + ',1)');
        grad.addColorStop(0.4, 'rgba(' + rgb + ',0.5)');
        grad.addColorStop(1, 'rgba(' + rgb + ',0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, size, size);
        return c;
    }
    const SP_WHITE = sprite('255,246,238'); // warm white
    const SP_GOLD = sprite('232,180,143');  // --gold
    const SP_ROSE = sprite('255,143,163');  // --rose

    const rand = (a, b) => a + Math.random() * (b - a);

    // ---- Particle layers --------------------------------------------------
    // travelSec = seconds to cross the viewport height (slower = farther back).
    let far = [], mid = [], embers = [], bokeh = [];

    // Cached full-screen gradients (rebuilt on resize): a warm candle pool that
    // breathes, and an edge vignette that darkens the corners to pool the light
    // inward. Static color stops; the pool's intensity is animated via globalAlpha.
    let poolGrad = null, vignGrad = null;

    function makeDust(layer) {
        const cfg = layer === 'far'
            ? { rMin: 1.0, rMax: 2.0, aMin: 0.07, aMax: 0.16, tMin: 28, tMax: 40, par: 0.3 }
            : { rMin: 1.8, rMax: 3.4, aMin: 0.12, aMax: 0.24, tMin: 20, tMax: 30, par: 0.6 };
        const travel = rand(cfg.tMin, cfg.tMax);
        return {
            x: rand(0, W), y: rand(0, H),
            r: rand(cfg.rMin, cfg.rMax),
            a: rand(cfg.aMin, cfg.aMax),
            vy: -(H / travel),                 // px per second, drifting up
            sway: rand(3, 9), swayPhase: rand(0, Math.PI * 2), swaySpeed: rand(0.03, 0.09),
            par: cfg.par, sprite: SP_WHITE,
        };
    }

    function makeEmber() {
        const travel = rand(16, 26);
        const s = [SP_GOLD, SP_ROSE, SP_WHITE][Math.floor(Math.random() * 3)];
        return {
            x: rand(0, W), y: rand(0, H),
            r: rand(2.4, 4.2),
            a: rand(0.18, 0.32),
            vy: -(H / travel),
            sway: rand(5, 12), swayPhase: rand(0, Math.PI * 2), swaySpeed: rand(0.04, 0.1),
            par: 1.0, sprite: s,
            // Candle flicker: a fast, deep alpha pulse so embers feel alive.
            flickPhase: rand(0, Math.PI * 2), flickSpeed: rand(0.6, 1.4), flickAmt: rand(0.25, 0.5),
        };
    }

    // Large, very soft, out-of-focus orbs — the "bokeh" luxury cue. Few, faint,
    // slow, and most affected by pointer parallax (they read as foreground).
    function makeBokeh() {
        const travel = rand(45, 75);
        const s = [SP_GOLD, SP_ROSE, SP_WHITE][Math.floor(Math.random() * 3)];
        return {
            x: rand(0, W), y: rand(0, H),
            r: rand(12, 22), scale: 6,
            a: rand(0.04, 0.085),
            vy: -(H / travel),
            sway: rand(8, 18), swayPhase: rand(0, Math.PI * 2), swaySpeed: rand(0.015, 0.04),
            par: 1.2, sprite: s,
            flickPhase: rand(0, Math.PI * 2), flickSpeed: rand(0.15, 0.3), flickAmt: rand(0.15, 0.3),
        };
    }

    function build() {
        far = Array.from({ length: 16 }, () => makeDust('far'));
        mid = Array.from({ length: 13 }, () => makeDust('mid'));
        embers = Array.from({ length: 7 }, makeEmber);
        bokeh = Array.from({ length: 3 }, makeBokeh);
    }

    function buildGradients() {
        // Warm pool sits slightly below centre, as if rising from candles off-frame.
        const cx = W / 2, cy = H * 0.52, pr = Math.max(W, H) * 0.62;
        poolGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pr);
        poolGrad.addColorStop(0, 'rgba(232,180,143,0.11)');
        poolGrad.addColorStop(0.5, 'rgba(232,180,143,0.04)');
        poolGrad.addColorStop(1, 'rgba(232,180,143,0)');
        const vr = Math.max(W, H) * 0.78;
        vignGrad = ctx.createRadialGradient(W / 2, H / 2, vr * 0.45, W / 2, H / 2, vr);
        vignGrad.addColorStop(0, 'rgba(8,4,12,0)');
        vignGrad.addColorStop(1, 'rgba(8,4,12,0.42)');
    }

    function resize() {
        // Dust is soft/blurry — a DPR-1 backing store is visually identical and
        // roughly 4x cheaper on fill rate than retina. Keeps this well under budget.
        dpr = 1;
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!far.length) build();
        buildGradients();
    }

    function step(p, dt, t) {
        p.y += p.vy * dt;
        p.swayPhase += p.swaySpeed * dt;
        if (p.flickSpeed) p.flickPhase += p.flickSpeed * dt;
        const dr = p.r * (p.scale || 5) / 2;   // respawn by the soft draw radius
        if (p.y < -dr) {                       // respawn at the bottom, re-randomized
            p.y = H + dr;
            p.x = rand(0, W);
        }
    }

    function drawParticle(p, t) {
        const x = p.x + Math.sin(p.swayPhase) * p.sway + offX * p.par;
        const y = p.y + offY * p.par;
        let a = p.a;
        if (p.flickSpeed) a *= 1 + Math.sin(p.flickPhase) * p.flickAmt; // candle flicker
        ctx.globalAlpha = a;
        const d = p.r * (p.scale || 5); // sprite draw diameter (soft halo wider than core)
        ctx.drawImage(p.sprite, x - d / 2, y - d / 2, d, d);
    }

    function renderAll(t, dt) {
        ctx.clearRect(0, 0, W, H);
        // ease pointer offset
        offX += ((pointerX - 0.5) * 2 * MAX_OFFSET - offX) * 0.05;
        offY += ((pointerY - 0.5) * 2 * MAX_OFFSET - offY) * 0.05;

        ctx.globalCompositeOperation = 'lighter'; // additive glow over the dusk
        // Warm candle pool, breathing slowly underneath the motes.
        if (poolGrad) {
            ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 0.5);
            ctx.fillStyle = poolGrad;
            ctx.fillRect(0, 0, W, H);
        }
        for (const p of bokeh) { step(p, dt, t); drawParticle(p, t); }
        for (const p of far) { step(p, dt, t); drawParticle(p, t); }
        for (const p of mid) { step(p, dt, t); drawParticle(p, t); }
        for (const p of embers) { step(p, dt, t); drawParticle(p, t); }

        // Edge vignette — darken the corners so the eye pools toward the warm centre.
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        if (vignGrad) {
            ctx.fillStyle = vignGrad;
            ctx.fillRect(0, 0, W, H);
        }
    }

    function frame(now) {
        if (disposed) return;
        const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
        last = now;
        renderAll(now / 1000, dt);
        raf = requestAnimationFrame(frame);
    }

    function start() {
        if (raf || disposed) return;
        last = 0;
        raf = requestAnimationFrame(frame);
    }
    function stop() {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    function onVisibility() {
        if (document.hidden) stop();
        else if (!mo) start(); // a pending observer means we're still waiting for the overlay
    }
    function onResize() {
        if (resizeRaf) return;                       // coalesce resize bursts → one realloc
        resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; resize(); });
    }
    function onPointer(e) {
        pointerX = e.clientX / W;
        pointerY = e.clientY / H;
    }
    function dispose() {
        disposed = true;
        stop();
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
        if (mo) { mo.disconnect(); mo = null; }
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('pointermove', onPointer);
        window.removeEventListener('pagehide', dispose);
    }

    // ---- Boot -------------------------------------------------------------
    resize();
    window.addEventListener('resize', onResize);
    window.addEventListener('pagehide', dispose);

    if (reduce) {
        // Static atmosphere: render a single frame, no motion.
        renderAll(0, 0);
        return;
    }

    // Pointer parallax only where a fine pointer exists (skip touch).
    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
        window.addEventListener('pointermove', onPointer, { passive: true });
    }
    document.addEventListener('visibilitychange', onVisibility);

    // The atmosphere is occluded by the intro overlay, so don't animate until the
    // envelope has been opened (overlay gets .hidden). Saves work and avoids any
    // main-thread contention with the envelope's WebGL during the intro.
    const overlayEl = document.getElementById('surprise-overlay');
    const overlayUp = () => overlayEl && !overlayEl.classList.contains('hidden');
    if (overlayUp()) {
        mo = new MutationObserver(() => {
            if (!overlayUp()) { mo.disconnect(); mo = null; if (!document.hidden) start(); }
        });
        mo.observe(overlayEl, { attributes: true, attributeFilter: ['class'] });
    } else {
        start();
    }
})();
