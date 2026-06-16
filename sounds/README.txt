These two sounds are CUSTOM-GENERATED to match the site's warm, candlelit mood:

  chime.wav        — a soft music-box arpeggio (C6-E6-G6-C7) with a gentle reverb
                     tail. Plays when she clicks "Yes".
  seal-break.wav   — a soft paper/envelope open (low flap + warm crinkle, no harsh
                     tear). Plays when the envelope opens.

They were created by .agents/gen-sounds.mjs (pure Node, no dependencies).
To re-tune them, edit that script and run:  node .agents/gen-sounds.mjs

Want to use your own instead? Just replace these two files (keep the names), or
drop in .mp3 versions and update the two paths in script.js (sealSfx / chimeSfx).
Good free, no-attribution sources:
  - https://pixabay.com/sound-effects/search/music%20box/
  - https://pixabay.com/sound-effects/search/paper/
