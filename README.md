# Undokai 2026 Game Rules

This static site contains the landing page, four game buttons, and the Typhoon Race guide. It has no package dependencies.

## Preview locally

Open `dist/index.html` in a browser, or run `python3 -m http.server 8000 --directory dist` from the project folder and open http://localhost:8000.

## Deploy on Vercel

1. Extract this ZIP. Put `vercel.json`, `README.md`, and the `dist` folder at the root of a Git repository.
2. Import that repository as a new Vercel project. Select **Other** if asked for a framework. The included `vercel.json` sets the output directory to `dist` and skips installation and build.
3. Deploy. The Typhoon Race deep link is your deployed homepage URL followed by `#typhoon-race`.

Alternatively, run `vercel --prod` from the extracted project folder with the Vercel CLI.

## Update the game guide

- Edit the `games` array at the top of `dist/guide.js` to update game names. Setting a game’s `href` to its published guide opens it directly.
- Edit the `steps` array in the same file to update Typhoon Race’s walkthrough copy. Edit the **Typhoon Race rules** section in `dist/index.html` for the full rules.
- For a local video, place the MP4 in `dist/assets` and set `raceVideo.src` to its relative path, such as `assets/typhoon-race.mp4`. Leave `raceVideo.kind` as `"mp4"`. Set `raceVideo.captions` to a relative WebVTT path if you have captions.
- For a hosted YouTube video, set `raceVideo.kind` to `"embed"` and set `raceVideo.src` to its YouTube embed URL. The recording will appear below the full rules. The walkthrough remains available above it.
