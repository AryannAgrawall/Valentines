// --- ANALYTICS ENGINE ---
// Handles discord webhooks and reporting

const discordWebhookUrl = "https://discordapp.com/api/webhooks/1494786196809977857/o_qfgO9hyh6iV5ecZgTTaLHOg4mDta-evxqU9t5Qme9OiXLAGC0_Kv-vQoT1NbKvKd1q";
const sessionStartTime = Date.now();

// Sends a live action notification for jumps or shakes
function sendLiveNotification(message) {
    fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `🚨 ${message}` })
    }).catch(() => {});
}

// Sends the final report card when a date is selected
function sendFinalReport(choice, noClickCount, yesTeasedCount) {
    const timeTakenSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
    
    // 1. Format Time easier to read
    let timeStr = `${timeTakenSeconds} seconds`;
    if (timeTakenSeconds > 60) {
        const mins = Math.floor(timeTakenSeconds / 60);
        const secs = timeTakenSeconds % 60;
        timeStr = `${mins}m ${secs}s`;
    }

    // 2. Behavior Interpretations
    let hesitationAnalysis = "";
    if (timeTakenSeconds < 15) hesitationAnalysis = "Zero hesitation! She knew what she wanted. 🏃‍♀️💨";
    else if (timeTakenSeconds < 40) hesitationAnalysis = "Decent speed, she was definitely excited! 🥰";
    else hesitationAnalysis = "She took her sweet time exploring the screen! 🧐";

    let noButtonAnalysis = "";
    if (noClickCount === 0) noButtonAnalysis = "100% loyal, she didn't even touch the 'No' button! 🥺❤️";
    else if (noClickCount < 5) noButtonAnalysis = `She tried escaping ${noClickCount} times just to read the guilt-trip texts! 😂`;
    else noButtonAnalysis = `She fought hard (${noClickCount} escapes!), but the runaway button defeated her! 😈`;
    
    let teaseAnalysis = "";
    if (yesTeasedCount > 0) teaseAnalysis = `She got caught in the teasing trap ${yesTeasedCount} times! 🤭`;
    else teaseAnalysis = "She successfully avoided your early 'Yes' teasing trap! 🧠";

    const discordMessage = {
        embeds: [{
            title: "💌 Official Valentine Report Card!",
            color: 0xff007f, // Pink color
            description: `**Yo!** She clicked YES and the date is set for: **${choice}**! 🍕📸☕\n\nHere is her behavioral analysis:`,
            fields: [
                { name: "⏱️ Decision Speed", value: `**${timeStr}**\n*${hesitationAnalysis}*`, inline: false },
                { name: "🐾 The 'No' Button", value: `**${noClickCount} clicks**\n*${noButtonAnalysis}*`, inline: false },
                { name: "👀 The 'Yes' Trap", value: `**${yesTeasedCount} triggers**\n*${teaseAnalysis}*`, inline: false }
            ],
            footer: { text: "Valentine's App Analytics Engine | Secured Report" },
            timestamp: new Date().toISOString()
        }]
    };

    fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordMessage)
    }).catch(() => { /* Silent catch */ });
}
