/* ==========================================================================
   GAMES — the games in the Game Development room (the Play-Games-style shelf).
   The order here is the order of the library list (first = shown first).

   To add a game: put hero.webp (wide, ~1920 px), thumb.webp (480 px) and
   s1.webp … sN.webp (screenshots, ~960 px) in public/games/<slug>/, then add
   an entry below. Leave `url` out until the game has a public link: the
   Play button then shows "Link coming soon" instead.
   ========================================================================== */

export type Game = {
  slug: string;
  title: string;
  genre: string;
  /** one short line under the title */
  tagline: string;
  description: string;
  /** three short facts shown as a row: [value, label] */
  facts: [string, string][];
  /** the game's page: "Play" opens it inside the room (and "Open in a new tab" there) */
  url?: string;
  /** number of screenshots (s1.webp … sN.webp) */
  shots: number;
  /** where the hero picture is anchored, e.g. "50% 40%" */
  focus?: string;
};

export const GAMES: Game[] = [
  {
    slug: "impossible-path",
    title: "The Impossible Path",
    genre: "Isometric puzzle",
    tagline: "Turn the tower. Find the way.",
    description:
      "An isometric puzzle of impossible architecture. Rotate whole towers and the world around them to join stairs, bridges and lifts, and guide a small traveller through 50 levels in five worlds.",
    facts: [
      ["50", "Levels"],
      ["Browser", "Platform"],
      ["Puzzle", "Genre"],
    ],
    url: "https://endlessuniverse-kmg9.vercel.app/",
    shots: 3,
    focus: "50% 38%",
  },
  {
    slug: "pocket-universe",
    title: "Pocket Universe",
    genre: "Creative sandbox",
    tagline: "A tiny world of your own.",
    description:
      "Build a floating island, one piece at a time: shape the land, plant forests, raise cottages and add a little magic. Switch day to night, then fly through your world in cinematic mode. Your universes save to the cloud.",
    facts: [
      ["Sandbox", "Genre"],
      ["Browser", "Platform"],
      ["Cloud", "Saves"],
    ],
    url: "https://pocket-universe-sable.vercel.app/",
    shots: 3,
    focus: "50% 50%",
  },
  {
    slug: "the-curator",
    title: "The Curator",
    genre: "Gallery puzzle",
    tagline: "Every shadow holds a secret.",
    description:
      "A quiet 3D museum puzzle. Move the stone sculptures until their shadows, cast by the skylight, lie exactly on the etched circle on the floor. Gallery 01, First Light, is playable.",
    facts: [
      ["Gallery 01", "Playable"],
      ["3D", "Browser"],
      ["Puzzle", "Genre"],
    ],
    url: `${import.meta.env.BASE_URL}games/the-curator/play/index.html`,
    shots: 3,
    focus: "50% 55%",
  },
];

export const gamePath = (g: Game, file: string) => `${import.meta.env.BASE_URL}games/${g.slug}/${file}`;
