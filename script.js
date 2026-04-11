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

const catGif = document.getElementById('cat-gif')
const yesBtn = document.getElementById('yes-btn')
const noBtn = document.getElementById('no-btn')
const music = document.getElementById('bg-music')

music.volume = 0.3;

function openSurprise() {
    // Hide the overlay
    const overlay = document.getElementById('surprise-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }

    // Start the music exactly when the user clicks!
    music.currentTime = 26;
    music.muted = false;
    music.play().catch(() => { });
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
    window.location.href = 'yes.html'
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

function swapGif(src) {
    catGif.style.opacity = '0'
    setTimeout(() => {
        catGif.src = src
        catGif.style.opacity = '1'
    }, 200)
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
    yesBtn.style.fontSize = `${Math.min(currentSize * sizeMultiplier, maxFontSize)}px`;

    const padY = parseFloat(window.getComputedStyle(yesBtn).paddingTop) || 18;
    const padX = parseFloat(window.getComputedStyle(yesBtn).paddingLeft) || 45;
    const maxPadYRun = window.innerWidth < 600 ? 40 : 80;
    const maxPadXRun = window.innerWidth < 600 ? 70 : 200;
    yesBtn.style.padding = `${Math.min(padY + 4, maxPadYRun)}px ${Math.min(padX + 8, maxPadXRun)}px`;

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
