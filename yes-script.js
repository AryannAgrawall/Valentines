// Smoothly resume state if loaded from Safari/Mobile Back-Forward Cache
window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        if (musicPlaying) {
            const music = document.getElementById('bg-music');
            music.play().catch(() => {});
        }
    }
});

let musicPlaying = false

window.addEventListener('load', () => {
    launchConfetti()

    // Autoplay music (works since user clicked Yes to get here)
    const music = document.getElementById('bg-music')
    music.volume = 0.3
    music.currentTime = 67; // Jump exactly to 1:07 for the grand finale!
    music.play().catch(() => { })
    musicPlaying = true
    document.getElementById('music-toggle').textContent = '🔊'
})

function launchConfetti() {
    const colors = ['#ff69b4', '#ff1493', '#ff85a2', '#ffb3c1', '#ff0000', '#ff6347', '#fff', '#ffdf00']
    const duration = 6000
    const end = Date.now() + duration

    // Initial big burst
    confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.3 },
        colors
    })

    // Continuous side cannons
    const interval = setInterval(() => {
        if (Date.now() > end) {
            clearInterval(interval)
            return
        }

        confetti({
            particleCount: 40,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors
        })

        confetti({
            particleCount: 40,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors
        })
    }, 300)
}

function toggleMusic() {
    const music = document.getElementById('bg-music')
    if (musicPlaying) {
        music.pause()
        musicPlaying = false
        document.getElementById('music-toggle').textContent = '🔇'
    } else {
        music.play()
        musicPlaying = true
        document.getElementById('music-toggle').textContent = '🔊'
    }
}

function selectFood(choice) {
    const menu = document.getElementById('options-menu');
    const msg = document.getElementById('final-msg');

    // Secret Discord Webhook Trigger
    const discordWebhookUrl = "https://discordapp.com/api/webhooks/1494786196809977857/o_qfgO9hyh6iV5ecZgTTaLHOg4mDta-evxqU9t5Qme9OiXLAGC0_Kv-vQoT1NbKvKd1q"; // Get this from Server Settings -> Integrations -> Webhooks
    const discordMessage = {
        content: ` **Yo!** She selected: **${choice}** for the Date! ❤️`
    };

    fetch(discordWebhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(discordMessage)
    }).catch(err => { /* Silent catch so error doesn't show */ });

    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00e676', '#ff007f']
    });

    menu.style.display = 'none';
    msg.innerHTML = `Awesome! Get ready for <strong>${choice}</strong>. Can't wait! ❤️`;
    msg.style.color = '#00e676';
    msg.style.textShadow = '0 0 10px rgba(0, 230, 118, 0.5)';
}
