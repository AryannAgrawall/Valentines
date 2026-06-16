// Smoothly resume state if loaded from Safari/Mobile Back-Forward Cache
window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        // Instead of reloading, just attempt to resume playing the music if it was playing
        if (musicPlaying) {
            music.play().catch(() => { });
        }
    }
});

// Handle back button smoothly
window.addEventListener('popstate', (event) => {
    const hash = window.location.hash;

    if (hash === '#yes') {
        // She pressed back from the final selection screen, back to the options screen
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('yes-container').style.display = 'block';

        // Restore the options menu
        document.getElementById('options-menu').style.display = 'flex';
        const fm = document.getElementById('final-msg');
        fm.innerHTML = 'Now the most important question... What are we gonna do afterall?';
        // Revert to the default (token) message colour by dropping the success class.
        fm.classList.remove('is-confirmed');

    } else if (hash === '' || hash === '#') {
        // She pressed back from the options screen, all the way to the first page
        document.getElementById('yes-container').style.display = 'none';
        document.getElementById('main-container').style.display = 'block';
        music.currentTime = 26; // reset music to verse
        if (musicPlaying) music.play().catch(() => { });
    }
});

const gifStages = [
    "https://media.tenor.com/EBV7OT7ACfwAAAAj/u-u-qua-qua-u-quaa.gif",    // 0 normal
    "https://media1.tenor.com/m/uDugCXK4vI4AAAAd/chiikawa-hachiware.gif",  // 1 confused
    "https://media.tenor.com/f_rkpJbH1s8AAAAj/somsom1012.gif",             // 2 pleading
    "https://media.tenor.com/OGY9zdREsVAAAAAj/somsom1012.gif",             // 3 sad
    "https://media1.tenor.com/m/WGfra-Y_Ke0AAAAd/chiikawa-sad.gif",       // 4 sadder
    "https://media.tenor.com/CivArbX7NzQAAAAj/somsom1012.gif",             // 5 devastated
    "https://media.tenor.com/5_tv1HquZlcAAAAj/chiikawa.gif",               // 6 very devastated
    "https://media1.tenor.com/m/uDugCXK4vI4AAAAC/chiikawa-hachiware.gif"  // 7 crying runaway
]

const noMessages = [
    "No",
    "Are you sure? 🥺",
    "I'll let you win all the arguments! 🫣",
    "I'll buy u hairpins! 🌸",
    "Come on, at least for coffee? ☕",
    "Please? 🥺",
    "I'll take aesthetic photos of you! 📸",
    "You can't escape me anyway 😜"
]

const yesTeasePokes = [
    "try saying no first... I bet you want to know what happens 😏",
    "go on, hit no... just once 👀",
    "trust me, you're missing out 😈",
    "click no, I dare you 😏"
]

let yesTeasedCount = 0

let noClickCount = 0
let runawayEnabled = false
let musicPlaying = true

const catGif = document.getElementById('cat-gif');
catGif.addEventListener('contextmenu', e => e.preventDefault());
// Prevent right‑click download on any media element (audio, video, img)
document.addEventListener('contextmenu', e => {
  if (e.target.matches('audio, video, img')) {
    e.preventDefault();
  }
});
const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');
const music = document.getElementById('bg-music');

music.volume = 0.3;

// --- Design-token palette: single source of truth for JS-driven colours so
// nothing hardcodes a rogue green/pink. Reads the CSS custom properties. ---
function palette() {
    const s = getComputedStyle(document.documentElement);
    const v = (n, fallback) => (s.getPropertyValue(n).trim() || fallback);
    return {
        rose: v('--rose', '#ff8fa3'),
        roseDeep: v('--rose-deep', '#e0607e'),
        roseSoft: v('--rose-soft', '#ffb3c1'),
        gold: v('--gold', '#e8b48f'),
        mint: v('--mint', '#2fd27d'),
        white: '#ffffff',
    };
}

// --- TASK 1: Yes-button growth, bounded to the card ---
// Asymptotic growth — each call closes a fraction of the REMAINING headroom, so
// the button keeps growing but slows smoothly as it nears the cap (no abrupt
// stop). A measured clamp then guarantees it never exceeds the card width.
let yesGrow = 0;
let yesBase = null;
function growYesButton(step) {
    if (!yesBase) {
        const cs = getComputedStyle(yesBtn);
        yesBase = { font: parseFloat(cs.fontSize), padY: parseFloat(cs.paddingTop), padX: parseFloat(cs.paddingLeft) };
    }
    yesGrow = yesGrow + (1 - yesGrow) * step; // approaches but never reaches 1

    const card = yesBtn.closest('.container') || document.getElementById('main-container');
    const ccs = getComputedStyle(card);
    const innerW = card.clientWidth - parseFloat(ccs.paddingLeft) - parseFloat(ccs.paddingRight);
    const small = window.innerWidth < 600;

    // Caps scale with the card so the button stays inside the composition.
    const maxFont = Math.min(small ? 56 : 96, innerW * 0.17);
    const maxPadX = Math.min(small ? 54 : 110, innerW * 0.11);
    const maxPadY = small ? 34 : 60;

    const font = yesBase.font + (maxFont - yesBase.font) * yesGrow;
    const padX = yesBase.padX + (maxPadX - yesBase.padX) * yesGrow;
    const padY = yesBase.padY + (maxPadY - yesBase.padY) * yesGrow;
    yesBtn.style.fontSize = font + 'px';
    yesBtn.style.padding = padY + 'px ' + padX + 'px';

    // Hard guarantee: never wider than the card content box.
    const maxW = innerW * 0.92;
    if (yesBtn.offsetWidth > maxW) {
        const k = maxW / yesBtn.offsetWidth;
        yesBtn.style.fontSize = (font * k) + 'px';
        yesBtn.style.padding = (padY * k) + 'px ' + (padX * k) + 'px';
    }

    // Climax glow once it is dominant and we're in the runaway endgame.
    if (runawayEnabled && yesGrow > 0.85) {
        yesBtn.classList.add('yes-glow-active');
    }
}

// Cache for fetched audio blobs
const audioCache = new Map();

async function loadAudio(url) {
  if (audioCache.has(url)) return audioCache.get(url);
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const objUrl = URL.createObjectURL(blob);
    audioCache.set(url, objUrl);
    return objUrl;
  } catch (e) {
    console.error('Failed to load audio', url, e);
    return url; // fallback to original URL
  }
}

// Load audio (and initial GIF) on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  const musicUrl = await loadAudio('music/this_love taylor swift.mp3');
  music.src = musicUrl;
  music.addEventListener('contextmenu', e => e.preventDefault());
  if (gifStages.length > 0) {
    const firstUrl = await loadGif(gifStages[0]);
    catGif.src = firstUrl;
  }
});

// Cache for fetched audio blobs
// Duplicate audio loader and init removed – single loadAudio implementation above handles fetching audio as a Blob URL.

// Preserve music playback position when page is hidden or user switches tabs
let savedMusicTime = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (!music.paused) {
      savedMusicTime = music.currentTime;
      music.pause();
    }
  } else {
    if (musicPlaying) {
      music.currentTime = savedMusicTime || 0;
      music.play().catch(() => {});
    }
  }
});
// Stop music entirely when the user navigates away or closes the tab
window.addEventListener('pagehide', () => {
  if (!music.paused) {
    music.pause();
  }
  savedMusicTime = 0;
});

// Gesture-critical side effects (music start + motion permission). Must run
// synchronously inside a user gesture so autoplay/permission prompts aren't
// blocked. Split out so the 3D envelope (P4) can run these on tap and defer the
// overlay hide until its open animation finishes.
function primeExperience() {
    // Ensure background music is loaded (already set on DOMContentLoaded) and start at promised position
    music.currentTime = 26;
    music.muted = false;
    music.play().catch(() => {});

    // Try to attach motion permissions via our sensors module
    if (typeof requestMotionPermissions === 'function') {
        requestMotionPermissions();
    }
}

// Hides the intro overlay → triggers the P2 reveal of the card beneath.
// Idempotent: safe to call from the 3D timeline, the safety timeout, or fallback.
function revealCard() {
    const overlay = document.getElementById('surprise-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// Unchanged behaviour: the inline onclick + reduced-motion/fallback path.
function openSurprise() {
    revealCard();
    primeExperience();
}

// Expose for the envelope module (loaded as an ES module, separate scope).
window.primeExperience = primeExperience;
window.revealCard = revealCard;
window.openSurprise = openSurprise;

function toggleMusic() {
    if (musicPlaying) {
        music.pause()
        musicPlaying = false
        document.getElementById('music-toggle').textContent = '🔇'
    } else {
        music.muted = false
        music.play()
        musicPlaying = true
        document.getElementById('music-toggle').textContent = '🔊'
    }
}

function handleYesClick() {
    if (!runawayEnabled) {
        // Tease her to try No first
        const msg = yesTeasePokes[Math.min(yesTeasedCount, yesTeasePokes.length - 1)]
        yesTeasedCount++
        showTeaseMessage(msg)
        return
    }

    // Switch to YES view within the same page
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('yes-container').style.display = 'block';

    // Push state for back button handling
    history.pushState({ view: 'yes' }, '', '#yes');

    // Play confetti and jump music to finale
    launchConfetti();
    music.currentTime = 67; // finale at 1:07
    if (!musicPlaying) toggleMusic();
}

function showTeaseMessage(msg) {
    let toast = document.getElementById('tease-toast')
    toast.textContent = msg
    toast.classList.add('show')
    clearTimeout(toast._timer)
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2500)
}

function handleNoClick() {
    noClickCount++

    // Cycle through guilt-trip messages
    const msgIndex = Math.min(noClickCount, noMessages.length - 1)
    noBtn.textContent = noMessages[msgIndex]

    // Grow the Yes button bigger each time — bounded to the card (TASK 1).
    growYesButton(0.34);

    // Shrink No button to contrast
    if (noClickCount >= 2) {
        const noSize = parseFloat(window.getComputedStyle(noBtn).fontSize)
        noBtn.style.fontSize = `${Math.max(noSize * 0.85, 10)}px`
    }

    // Swap cat GIF through stages
    const gifIndex = Math.min(noClickCount, gifStages.length - 1)
    swapGif(gifStages[gifIndex])

    // Runaway starts at click 5
    if (noClickCount >= 5 && !runawayEnabled) {
        enableRunaway()
        runawayEnabled = true
    }
}

// --- Optimized GIF loading (network fetch + caching) ---
const gifCache = new Map();

async function loadGif(url) {
  if (gifCache.has(url)) return gifCache.get(url);
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const objUrl = URL.createObjectURL(blob);
    gifCache.set(url, objUrl);
    return objUrl;
  } catch (e) {
    console.error('Failed to load GIF', url, e);
    return url; // fallback to original URL
  }
}

// (The first-stage GIF is set in the DOMContentLoaded handler above, alongside
// the audio load — no duplicate initialiser needed here.)

// Updated swapGif to use async loading and caching
async function swapGif(src) {
  const gifUrl = await loadGif(src);
  catGif.style.opacity = '0';
  setTimeout(() => {
    catGif.src = gifUrl;
    catGif.style.opacity = '1';
  }, 200);
}


function enableRunaway() {
    noBtn.addEventListener('mouseover', runAway)
    noBtn.addEventListener('touchstart', runAway, { passive: true })
}

function runAway() {
    // Grow YES every time they try to hover NO — bounded to the card (TASK 1).
    growYesButton(0.16);

    const margin = 20
    const btnW = noBtn.offsetWidth
    const btnH = noBtn.offsetHeight
    const maxX = window.innerWidth - btnW - margin
    const maxY = window.innerHeight - btnH - margin

    const randomX = Math.random() * maxX + margin / 2
    const randomY = Math.random() * maxY + margin / 2
    noBtn.style.position = 'fixed'
    noBtn.style.left = `${randomX}px`;
    noBtn.style.top = `${randomY}px`;
    noBtn.style.zIndex = '50';
}

// --- ANTI-CHEAT (ZOOM PREVENTION) ---

// Prevent pinch-to-zoom on mobile
document.addEventListener('touchstart', function (e) {
    if (e.touches.length > 1) {
        e.preventDefault();
        showTeaseMessage("Uh-uh-uh, u can't cheat here! 😉");
    }
}, { passive: false });

// Prevent pinch-to-zoom movement
document.addEventListener('touchmove', function (e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Prevent double-tap to zoom on mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', function (e) {
    let now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
        showTeaseMessage("Uh-uh-uh, u can't cheat here! 😉");
    }
    lastTouchEnd = now;
}, { passive: false });

// Prevent Ctrl + Scroll zoom on desktop
document.addEventListener('wheel', function (e) {
    if (e.ctrlKey) {
        e.preventDefault();
        showTeaseMessage("Uh-uh-uh, u can't cheat here! 😉");
    }
}, { passive: false });

// Prevent Ctrl + +/- keys zoom on desktop
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && (e.key === '=' || e.key === '-' || e.key === '+' || e.key === '0')) {
        e.preventDefault();
        showTeaseMessage("Uh-uh-uh, u can't cheat here! 😉");
    }
}, { passive: false });

function launchConfetti() {
    // Palette-matched, romantic rather than carnival — sourced from design tokens.
    const p = palette();
    const colors = [p.rose, p.roseDeep, p.roseSoft, p.gold, p.white, p.mint];
    // Calm physics: softer launch, real gravity, gentle drift, larger slow petals.
    const base = { colors, gravity: 0.8, scalar: 1.1, drift: 0.4, decay: 0.92, ticks: 260 };

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
        // A single, gentle bloom — celebratory but still.
        confetti({ ...base, particleCount: 40, spread: 70, startVelocity: 26, origin: { x: 0.5, y: 0.4 } });
        return;
    }

    // Opening bloom from the heart of the card.
    confetti({ ...base, particleCount: 120, spread: 90, startVelocity: 38, origin: { x: 0.5, y: 0.35 } });

    const duration = 6000;
    const end = Date.now() + duration;
    let tick = 0;

    // Gentle, choreographed afterglow: soft side drifts that ease down over time,
    // with an occasional slow rising puff from below.
    const interval = setInterval(() => {
        const remaining = end - Date.now();
        if (remaining <= 0) {
            clearInterval(interval);
            return;
        }
        tick++;
        const intensity = Math.max(0.3, remaining / duration);
        const count = Math.round(22 * intensity);

        confetti({ ...base, particleCount: count, angle: 60, spread: 50, startVelocity: 32, origin: { x: 0, y: 0.65 } });
        confetti({ ...base, particleCount: count, angle: 120, spread: 50, startVelocity: 32, origin: { x: 1, y: 0.65 } });

        if (tick % 3 === 0) {
            confetti({ ...base, particleCount: 14, spread: 110, startVelocity: 26, origin: { x: 0.5, y: 0.72 } });
        }
    }, 350);
}

function selectFood(choice) {
    const menu = document.getElementById('options-menu');
    const msg = document.getElementById('final-msg');

    // Trigger explicit report via our analytics module
    if (typeof sendFinalReport === 'function') {
        sendFinalReport(choice, noClickCount, yesTeasedCount);
    }

    confetti({
        particleCount: 80,
        spread: 80,
        startVelocity: 32,
        gravity: 0.8,
        scalar: 1.1,
        drift: 0.4,
        decay: 0.92,
        ticks: 240,
        origin: { y: 0.62 },
        colors: (() => { const p = palette(); return [p.mint, p.rose, p.roseSoft, p.gold, p.white]; })()
    });

    // Push new state so pressing "back" will return to the options page
    history.pushState({ view: 'final' }, '', '#final');

    menu.style.display = 'none';
    msg.innerHTML = `Awesome! Get ready for <strong>${choice}</strong>. Can't wait! ❤️`;
    // Success colour comes from a token-driven class, not a hardcoded green.
    msg.classList.add('is-confirmed');
}
