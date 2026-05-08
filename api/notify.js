export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
        console.error('DISCORD_WEBHOOK_URL is not set in environment variables');
        return res.status(500).json({ error: 'Configuration error' });
    }

    const { type, data } = req.body;

    try {
        let discordPayload;

        if (type === 'live') {
            discordPayload = {
                content: `🚨 ${data.message}`
            };
        } else if (type === 'final') {
            const { choice, noClickCount, yesTeasedCount, sessionStartTime } = data;
            const timeTakenSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
            
            // 1. Format Time
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

            discordPayload = {
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
        } else {
            return res.status(400).json({ error: 'Invalid notification type' });
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Discord API error:', errorText);
            return res.status(response.status).json({ error: 'Failed to send to Discord' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
