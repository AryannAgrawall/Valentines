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

    // Secret WhatsApp Webhook Trigger
    const phoneNumber = "[YOUR_PHONE_NUMBER_HERE]"; // e.g., 919876543210 (Country code + number, NO plus sign)
    const apiKey = "[YOUR_API_KEY_HERE]"; // Found from the CallMeBot WhatsApp message
    const message = encodeURIComponent(`Yo! She selected: ${choice} for the Date! ❤️`);
    
    fetch(`https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${message}&apikey=${apiKey}`, {
        mode: 'no-cors' // Use no-cors so the browser doesn't block the background request
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
