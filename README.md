# Valentine's Day Interactive Page

> ***Because even the smallest of efforts matter.***

A fun, interactive Valentine's Day page where the "Yes" button grows bigger every time they click "No" — with falling hearts, cute GIFs, music, and playful toast messages. Built with pure HTML, CSS, and JavaScript.


---

## Want to Use This to Impress the Girl you like?

You've got two options — pick whatever works for you.

---

### Option 1: Fork It and Make It Yours

Want your own version you can customize? Follow these steps:

### 1. Fork the repo
- fork it for yourself so you can do all the changes

#### 2. Enable GitHub Pages/ Host on vercel
- In your forked repo, directly host it via github pages, or host it for free on vercel

#### 3. Personalize It
- Edit the pages that fits your context very well with her, to make sure she gets the familiarity and is connected to you.

---

### Option 2: Vibe Code Your Own From Scratch

- Want something completely unique? Use AI to build it. Do anything that suits the purpose well, something that ignites a spark between the two of you!!.


## Note on Webhooks & API Safety

This project includes a secret **Discord Webhook** feature in `yes-script.js` to notify you immediately about the selected activity.

Because this project is a purely frontend application (HTML/CSS/JS) without a secure backend server, **Environmental Variables (`.env`) cannot truly hide secrets**. Any API Keys or Webhook URLs in your JavaScript can be viewed by anyone who inspects the website code. 

**Best Practices for using this feature:**
1. **The Professional Way (Not built-in):** If this were a scalable public app, you would build a custom Backend Server (Node.js/Python) to securely hold your keys and make the Discord API requests on behalf of the user. 
2. **The Fun & Practical Way (Recommended for this project):** Since this is a temporary personal project meant just for your Valentine:
   - Paste your Discord Webhook URL directly into `yes-script.js`. and push it on github.
   - **Important:** As soon as she makes her choice, go into your Discord Server Settings and **Delete the Webhook immediately**. This ensures safety!

---

## Project Structure
```
v-day/
├── index.html       # Main page — "Will you be my Valentine?"
├── yes.html         # Celebration page after they say Yes
├── script.js        # Main page logic (button growth, GIF swaps, toasts)
├── yes-script.js    # Celebration page animations
├── style.css        # All the styling and animations
└── music/           # Background music
```

---

***Do whatever you want with it. Make someone smile.***
