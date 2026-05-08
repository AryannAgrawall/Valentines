// --- ANALYTICS ENGINE ---
// Handles reporting to the backend API (Serverless Function)

const sessionStartTime = Date.now();

// Sends a live action notification for jumps or shakes
function sendLiveNotification(message) {
    fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            type: 'live', 
            data: { message } 
        })
    }).catch(() => {});
}

// Sends the final report card when a date is selected
function sendFinalReport(choice, noClickCount, yesTeasedCount) {
    fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'final',
            data: {
                choice,
                noClickCount,
                yesTeasedCount,
                sessionStartTime
            }
        })
    }).catch(() => { /* Silent catch */ });
}
