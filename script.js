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
        document.getElementById('final-msg').innerHTML = 'Now the most important question... What are we gonna do afterall?';
        document.getElementById('final-msg').style.color = '#e91e8c'; // Original CSS color
        document.getElementById('final-msg').style.textShadow = 'none';

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

function openSurprise() {
    // Hide the overlay
    const overlay = document.getElementById('surprise-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }

    // Ensure background music is loaded (already set on DOMContentLoaded) and start at promised position
    music.currentTime = 26;
    music.muted = false;
    music.play().catch(() => {});

    // Try to attach motion permissions via our sensors module
    if (typeof requestMotionPermissions === 'function') {
        requestMotionPermissions();
    }
}

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

    // Grow the Yes button bigger each time
    const currentSize = parseFloat(window.getComputedStyle(yesBtn).fontSize)
    const sizeMultiplier = window.innerWidth < 600 ? 1.15 : 1.35;
    const maxFontSize = window.innerWidth < 600 ? 60 : 100;
    yesBtn.style.fontSize = `${Math.min(currentSize * sizeMultiplier, maxFontSize)}px`;
    const maxPadYNo = window.innerWidth < 600 ? 30 : 60;
    const maxPadXNo = window.innerWidth < 600 ? 60 : 120;
    const padY = Math.min(18 + noClickCount * 5, maxPadYNo);
    const padX = Math.min(45 + noClickCount * 10, maxPadXNo);
    yesBtn.style.padding = `${padY}px ${padX}px`;

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

// Set initial GIF on page load using the first stage URL
document.addEventListener('DOMContentLoaded', async () => {
  if (gifStages.length > 0) {
    const firstUrl = await loadGif(gifStages[0]);
    catGif.src = firstUrl;
  }
});

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
    // Grow YES button every time they try to hover NO!
    const currentSize = parseFloat(window.getComputedStyle(yesBtn).fontSize);
    const sizeMultiplier = window.innerWidth < 600 ? 1.05 : 1.15;
    const maxFontSize = window.innerWidth < 600 ? 70 : 120;
    const newSize = Math.min(currentSize * sizeMultiplier, maxFontSize);
    yesBtn.style.fontSize = `${newSize}px`;

    const padY = parseFloat(window.getComputedStyle(yesBtn).paddingTop) || 18;
    const padX = parseFloat(window.getComputedStyle(yesBtn).paddingLeft) || 45;
    const maxPadYRun = window.innerWidth < 600 ? 40 : 80;
    const maxPadXRun = window.innerWidth < 600 ? 70 : 200;
    const newPadY = Math.min(padY + 4, maxPadYRun);
    const newPadX = Math.min(padX + 8, maxPadXRun);
    yesBtn.style.padding = `${newPadY}px ${newPadX}px`;

    if (newSize >= maxFontSize && newPadY >= maxPadYRun && newPadX >= maxPadXRun) {
        yesBtn.classList.add('yes-glow-active');
    }

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
    const colors = ['#ff69b4', '#ff1493', '#ff85a2', '#ffb3c1', '#ff0000', '#ff6347', '#fff', '#ffdf00'];
    const duration = 6000;
    const end = Date.now() + duration;

    // Initial big burst
    confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.3 },
        colors
    });

    // Continuous side cannons
    const interval = setInterval(() => {
        if (Date.now() > end) {
            clearInterval(interval);
            return;
        }

        confetti({
            particleCount: 40,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors
        });

        confetti({
            particleCount: 40,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors
        });
    }, 300);
}

function selectFood(choice) {
    const menu = document.getElementById('options-menu');
    const msg = document.getElementById('final-msg');

    // Trigger explicit report via our analytics module
    if (typeof sendFinalReport === 'function') {
        sendFinalReport(choice, noClickCount, yesTeasedCount);
    }

    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00e676', '#ff007f']
    });

    // Push new state so pressing "back" will return to the options page
    history.pushState({ view: 'final' }, '', '#final');

    menu.style.display = 'none';
    msg.innerHTML = `Awesome! Get ready for <strong>${choice}</strong>. Can't wait! ❤️`;
    msg.style.color = '#00e676';
    msg.style.textShadow = '0 0 10px rgba(0, 230, 118, 0.5)';
}
