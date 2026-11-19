# Undokai 2026 Game Rules

This static site contains the landing page and guides for Typhoon Race, Beanbag Toss, Centipede Race, and Dondarm Slerk Cher. It has no package dependencies.

## Preview locally

Run `python3 -m http.server 8000 --directory dist` from the project folder and open http://localhost:8000. A YouTube embed shows "Error 153" if you open `dist/index.html` directly from disk, because YouTube needs the page to be served over HTTP.

## Deploy on Vercel

1. Put `vercel.json`, `README.md`, and the `dist` folder at the root of a Git repository.
2. Import that repository as a new Vercel project. Select **Other** if asked for a framework. The included `vercel.json` sets the output directory to `dist` and skips installation and build.
3. Deploy. Append `#typhoon-race`, `#beanbag-toss`, `#centipede-race`, or `#dondarm-slerk-cher` to the deployed homepage URL to open a guide directly.

Alternatively, run `vercel --prod` from the project folder with the Vercel CLI.

## How the code is organised

- `dist/guide.js` holds the shared parts: the home page and its game cards, the pixel-art helpers, the clickable step cards, the top-view panel with its speed buttons, and page switching.
- `dist/typhoon.js`, `dist/beanbag.js`, `dist/centipede.js`, and `dist/dondarm.js` each hold one game’s step cards and top view. Each file registers its page with `registerGuide()`.
- Each game page has a `<section>` in `dist/index.html` with the intro, video, How to play, and Rules.

## Update the game guide

- Edit the `games` array at the top of `dist/guide.js` to update game names. Give a game an `href` to make its card a link. Cards without one show as "Coming soon".
- Edit the `steps` array in a game's file to update its "How to play" cards. All cards show at once. Click a card to play or pause its animation. Each card resumes from where it paused.
- Below the cards, each top-view panel plays on its own and pauses while it is scrolled off screen. Its **Slower / Faster** buttons step through the speeds in the `speeds` array (0.25× to 3×). Edit the captions in the corresponding game script. The shared animation team names and colors are in `teams` in `dist/guide.js`.
- Edit the **Rules** and **Points** sections of each page in `dist/index.html` for the full rules. Remove items from **To be announced** once they are decided.

## Videos

- Typhoon Race: edit the `data-src` of the iframe in the Typhoon Race section of `dist/index.html`.
- Beanbag Toss: the clip is `dist/assets/bean-bag.mp4`, played by a `<video>` tag in the Beanbag Toss section of `dist/index.html`. To swap it, replace the file (keep it short, ideally an MP4 under ~20 MB) and update the length label (`0:08`) above the player.
- Centipede Race and Dondarm Slerk Cher have video placeholders. Replace the `video-empty` block with a YouTube iframe or a `<video>` tag and update the "Coming soon" label above it.
- Google Photos links can't be shown inside the page (Google blocks it). Download the video from Google Photos and add it to `dist/assets` instead.
- A YouTube video loads only while its game page is open, and a video file pauses when you leave its page.
