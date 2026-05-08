# Valentine's Day Interactive Experience 💌

> ***Because even the smallest of efforts matter.***

This isn't just a webpage—it's a high-level interactive experience designed to ask that special someone out. It features a runaway "No" button, dynamic GIF transitions, custom music synchronization, and advanced behavioral analytics.

---

## What makes this special?

- **Interactive Runaway Button:** A "No" button that grows more elusive and triggers size-scaling in the "Yes" button.
- **Cinematic Experience:** Background music that transitions from a gentle verse to a grand finale when they say "Yes."
- **Motion Sensor Support:** Built-in support for device sensors—if they shake the phone or jump, the site reacts!
- **Behavioral Analytics:** Generates a "Report Card" based on how they interacted with the site (Decision speed, loyalty score, etc.).
- **Anti-Cheat System:** Prevents users from zooming or using shortcuts to bypass the runaway button.

---

## Security & Privacy 

Unlike basic projects, this one is **Production-Ready and Secure**. 

We use **Vercel Serverless Functions** (a backend-as-a-service) to handle Discord notifications. This means:
1. **Server-Side Logic:** All the "behavioral analysis" happens on a secure server, not in the browser.
2. **Spam Protection:** Since the webhook is hidden, it cannot be intercepted or spammed by anyone visiting the site.

---


## Personalize
Edit the messages in `script.js` and `api/notify.js` to match your own jokes and memories with your Valentine.

---

## Project Structure
```
Valentines/
├── api/             # Secure Backend (Serverless Functions)
│   └── notify.js    # Handles Discord notifications securely
├── index.html       # The main question page
├── yes.html         # The celebration & date selection page
├── analytics.js     # Communication with the backend
├── script.js        # Main interaction logic & animations
├── sensors.js       # Motion & gesture detection logic
├── style.css        # Premium styling & glassmorphism
└── music/           # Audio assets
```

---

***Make someone smile. Built with love and secure code.***
