# Undokai 2026 Game Rules

This static site contains the landing page, four game cards, and the Typhoon Race guide (Game 1). It has no package dependencies.

## Preview locally

Run `python3 -m http.server 8000 --directory dist` from the project folder and open http://localhost:8000. The YouTube embed shows "Error 153" if you open `dist/index.html` directly from disk, because YouTube needs the page to be served over HTTP.

## Deploy on Vercel

1. Put `vercel.json`, `README.md`, and the `dist` folder at the root of a Git repository.
2. Import that repository as a new Vercel project. Select **Other** if asked for a framework. The included `vercel.json` sets the output directory to `dist` and skips installation and build.
3. Deploy. The Typhoon Race deep link is your deployed homepage URL followed by `#typhoon-race`.

Alternatively, run `vercel --prod` from the project folder with the Vercel CLI.

## Update the game guide

- Edit the `games` array at the top of `dist/guide.js` to update game names. Give a game an `href` to make its card a link. Cards without one show as "Coming soon".
- Edit the `steps` array in the same file to update the Typhoon Race "How to play" cards. All cards show at once; clicking a card plays its animation, and clicking it again stops it.
- Below the cards, the **Whole course · top view** panel plays a full round in all three lanes on its own, pausing while it is scrolled off screen. Its **Slower / Faster** buttons step through the speeds in the `speeds` array (0.25× to 3×). Its captions are in the `coursePhases` array in `dist/guide.js`, the cone positions are in `CONES`, and the team colours are in `teamColors`.
- Edit the **Rules**, **Points**, and **To be announced** sections in `dist/index.html` for the full rules. Remove items from **To be announced** once they are decided.
- To change the video, edit the `data-src` of the `race-video` iframe in `dist/index.html`. The video loads only when the Typhoon Race page is open.
