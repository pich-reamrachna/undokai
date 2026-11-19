# Undokai 2026 Game Rules

This static site contains the landing page, four game cards, and guides for the Typhoon Race (Game 1), Beanbag Toss (Game 2) and Centipede Race (Game 3). It has no package dependencies.

## Preview locally

Run `python3 -m http.server 8000 --directory dist` from the project folder and open http://localhost:8000. A YouTube embed shows "Error 153" if you open `dist/index.html` directly from disk, because YouTube needs the page to be served over HTTP.

## Deploy on Vercel

1. Put `vercel.json`, `README.md`, and the `dist` folder at the root of a Git repository.
2. Import that repository as a new Vercel project. Select **Other** if asked for a framework. The included `vercel.json` sets the output directory to `dist` and skips installation and build.
3. Deploy. Each guide has a deep link: your deployed homepage URL followed by `#typhoon-race`, `#beanbag-toss` or `#centipede-race`.

Alternatively, run `vercel --prod` from the project folder with the Vercel CLI.

## How the code is organised

- `dist/guide.js` holds the shared parts: the home page and its game cards, the pixel-art helpers, the clickable step cards, the top-view panel with its speed buttons, and page switching.
- `dist/typhoon.js`, `dist/beanbag.js` and `dist/centipede.js` each hold one game: its "How to play" steps, the scene drawn on each step card, and its top view. Each file registers its page with `registerGuide()`.
- Each game page is a `<section>` in `dist/index.html` (`#typhoon-race-view`, `#beanbag-toss-view`, `#centipede-race-view`) with the intro, video, How to play, and Rules.

## Update the game guide

- Edit the `games` array at the top of `dist/guide.js` to update game names. Give a game an `href` to make its card a link. Cards without one show as "Coming soon".
- Edit the `steps` array in a game's file to update its "How to play" cards. All cards show at once. Click a card to play or pause its animation. Each card resumes from where it paused.
- Below the cards, each top-view panel plays on its own and pauses while it is scrolled off screen. Its **Slower / Faster** buttons step through the speeds in the `speeds` array (0.25× to 3×). Its captions are in `coursePhases` (Typhoon Race), `fieldPhases` (Beanbag Toss) or `events` (Centipede Race). The team colours are in `teamColors` in `dist/guide.js`.
- Edit the **Rules** and **Points** sections of each page in `dist/index.html` for the full rules. On the Typhoon Race and Centipede Race pages, remove items from **To be announced** once they are decided.

## Videos

- Typhoon Race: edit the `data-src` of the iframe in the Typhoon Race section of `dist/index.html`.
- Beanbag Toss: the clip is `dist/assets/bean-bag.mp4`, played by a `<video>` tag in the Beanbag Toss section of `dist/index.html`. To swap it, replace the file (keep it short, ideally an MP4 under ~20 MB) and update the length label (`0:08`) above the player.
- Centipede Race: the video box shows "Video coming soon". Replace `<div class="video-frame video-empty"><p>Video coming soon</p></div>` in the Centipede Race section with a YouTube iframe (as on the Typhoon Race page) or a `<video>` tag (as on the Beanbag Toss page), and update the "Coming soon" label above it.
- Google Photos links can't be shown inside the page (Google blocks it). Download the video from Google Photos and add it to `dist/assets` instead.
- A YouTube video loads only while its game page is open, and a video file pauses when you leave its page.
