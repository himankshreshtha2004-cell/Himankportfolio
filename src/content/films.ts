/* ==========================================================================
   AI FILMS — the films in the AI Filmmaking room (the card stack).
   The order here is the order of the stack (first = front card).

   To add a film:
     python3 scripts/make_film_assets.py my-film.mp4 my-film --cover 12.5
   (--cover = the second to use as the cover; see the script for --focus/--zoom),
   then add an entry below with the same slug.

   year / kind are optional: leave them out when you don't want them shown.
   ========================================================================== */

export type Film = {
  slug: string;
  title: string;
  year?: number;
  duration: string;
  /** shown above the title; "AI film" when not set */
  kind?: string;
  description: string;
};

export const FILMS: Film[] = [
  {
    slug: "shiv-shakti",
    title: "Shiv Shakti",
    year: 2026,
    duration: "0:30",
    description: "Shiva in meditation among the stars; Shakti rises out of fire, and the two become one before the cosmos opens.",
  },
  {
    slug: "karna-arjun",
    title: "Karna vs Arjun",
    duration: "1:43",
    description: "Two chariots, two archers, one desert battlefield — arrows of light meet in mid-air in a duel from the Mahabharata.",
  },
  {
    slug: "ananta",
    title: "Ananta",
    year: 2026,
    duration: "0:33",
    description: "Vishnu wakes on the cosmic ocean as demons rise from the deep — a mythic battle told in fire, storm and starlight.",
  },
  {
    slug: "narayanastra",
    title: "Ashwathama's Narayanastra",
    year: 2025,
    duration: "3:37",
    description: "Ashwathama releases the Narayanastra on the battlefield of Kurukshetra — a Mahabharata episode told in gold, fire and storm.",
  },
  {
    slug: "ardhanari",
    title: "Ardhanari",
    year: 2026,
    duration: "0:18",
    description: "Shiva and Shakti, shot like a lost 70s reel — glitter, skin and light, until the two become one.",
  },
  {
    slug: "chhau",
    title: "Chhau",
    year: 2026,
    duration: "0:26",
    description: "Masks, drums and a ring of fire — the Chhau dance, reimagined in firelight.",
  },
  {
    slug: "the-waterfall",
    title: "The Waterfall",
    year: 2026,
    duration: "0:21",
    description: "A soldier and a woman meet at the foot of a waterfall: a first encounter told in mist and light.",
  },
  {
    slug: "two-worlds",
    title: "Two Worlds",
    year: 2026,
    duration: "0:55",
    kind: "Wedding invitation film",
    description: "A wedding invitation film for Rohan & Reetika — two separate journeys, one story.",
  },
  {
    slug: "indian-museum",
    title: "Indian Museum, Kolkata",
    duration: "3:35",
    kind: "Freelance · animated explainer",
    description: "An animated explainer on archaeology — digging, the layers of the earth and the objects they hold — made as freelance work for the Indian Museum, Kolkata.",
  },
  {
    slug: "gail-christmas",
    title: "GAIL Tower — Christmas",
    duration: "0:26",
    kind: "Projection film",
    description: "Christmas visuals for a tower façade: snowfall, a lit tree, Santa's sleigh and a gift that opens into “Merry Christmas”.",
  },
];

export const filmPath = (f: Film, file: "film.mp4" | "preview.mp4" | "poster.webp" | "card.webp") => `films/${f.slug}/${file}`;

/** "AI film · 2026 · 0:33" */
export const filmMeta = (f: Film) => [f.kind ?? "AI film", f.year, f.duration].filter(Boolean).join(" · ");
