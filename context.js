// --- CONTEXT ENGINE ---
// Handles dynamic UI changes based on time-of-day

const hours = new Date().getHours();
const mainQuestion = document.getElementById('main-question');
if (mainQuestion) {
    if (hours >= 20 || hours < 5) {
        mainQuestion.textContent = "I know it's late, but I couldn't stop thinking about asking you this... 🥺";
    } else if (hours >= 5 && hours < 11) {
        mainQuestion.textContent = "Good morning! ☀️ I couldn't wait any longer to ask you this... 🥺";
    }
}
