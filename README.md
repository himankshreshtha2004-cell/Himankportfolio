# Himank Shreshtha — More than one thing

A personal portfolio built as one continuous film. As you scroll, the camera
moves through one building: rooftop (Home) → studio (About) → four work bays
(AI Filmmaking, Game Development, UI/UX Design, Electronics) → gallery hall
(Experience) → archive (Education) → courtyard (Beyond Work) → roof at night
(Contact). The page content sits on top of the film, and the side index jumps
to any section.

One scroll, swipe or arrow key plays the film to the next section, at a steady
film speed, and stops there (Home/End jump to the ends; the side index and the
menu jump anywhere). Long cards on phones scroll on their own first.

Built with React 18, Vite 5 and TypeScript. There is no backend: the build
output is plain static files.

## Publish on GitHub Pages

1. Create a new repository on GitHub (for example `portfolio`).
2. Upload everything in this folder to the repository, keeping the folders as
   they are, including the hidden `.github` folder. Either:
   - **Website:** *Add file → Upload files*, then drag the contents of this
     folder in (under 100 files, each under 25 MB, so one upload is enough); or
   - **Command line:**
     ```bash
     git init && git add . && git commit -m "Portfolio"
     git branch -M main
     git remote add origin https://github.com/<your-username>/<repo>.git
     git push -u origin main
     ```
3. In the repository go to **Settings → Pages → Build and deployment → Source**
   and choose **GitHub Actions**.
4. Open the **Actions** tab. The *Deploy to GitHub Pages* run takes about a
   minute. The site is then live at
   `https://<your-username>.github.io/<repo>/`.

Every later push to `main` publishes again automatically.

> If your file manager hid `.github` and the workflow did not upload: on GitHub
> choose *Add file → Create new file*, name it
> `.github/workflows/deploy.yml`, and paste in the contents of that file.

**Netlify or Vercel instead:** import the repository. Build command
`npm run build`, publish directory `dist`.

## Work on it locally

Needs Node.js 18 or newer.

```bash
npm install
npm run dev       # live preview at http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve the build
```

## Where things are

| What | File |
|---|---|
| All page text (sections, menu, contact links) | `src/content/site.ts` |
| Resume facts (education, projects, email, LinkedIn) | `src/content/profile.ts` |
| Where the film stops for each section, and how long it stays | `src/content/timeline.ts` |
| Section layouts | `src/components/Sections.tsx` |
| Header and side index | `src/components/Header.tsx`, `src/components/SideIndex.tsx` |
| Styles | `src/styles/site.css` |
| Film player (canvas, frame loading) | `src/film/player.ts` |
| Film frames | `public/f/` |

## The film frames

The film is 430 frames (17.9 s at 24 fps) drawn on a canvas as you scroll:

- `public/f/p/` holds 7 small preview sheets that load first, so the film
  plays at once.
- `public/f/hi/` (2560 px), `public/f/mid/` (1600 px, small screens) and
  `public/f/tall/` (1240 × 1440, portrait phones: the part of the frame a phone
  shows, half the decoding work) hold the sharp frames, packed 24 per file. The landing frames of the next
  and previous sections are fetched first (as byte ranges), then the way
  there, then the rest of the film in the background. Frames along the coming
  move are decoded ahead of time, so every section lands sharp. The player
  measures how fast the device decodes: when the film moves faster than that
  (very fast scrolling) it decodes every 2nd or 3rd frame, so the move plays as
  a sharp fast-forward, and the picture only ever steps forward in the
  direction of travel. Add `?debug` to the address to expose `__player.stats()`
  in the browser console.
- `public/f/index.json` records where each frame sits inside its pack.

To use a new cut of the film, rebuild the frames from the master video
(needs ffmpeg and Python 3 with `numpy`, `opencv-python` and `Pillow`):

```bash
python3 scripts/make_frames.py path/to/tower-film.mp4
```

If the cut changes length or timing, update the stop frames in
`src/content/timeline.ts`. The master video itself is not in the repository.

GitHub Pages, Netlify and Vercel serve the `.bin` packs as they are. For a host
that only accepts image files, run `python3 scripts/unpack_frames.py dist`
after the build to split them into one `.webp` per frame.

## Still to come

- "Step inside" galleries for the four work bays (AI films, games, UI/UX
  projects, electronics builds)
- The interactive projection-wall screen in the Experience hall
- Photos for About and Beyond Work, and the GitHub link in Contact
