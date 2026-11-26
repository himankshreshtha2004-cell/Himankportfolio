/* ==========================================================================
   UI/UX ROOM — the projects on the vertical wheel (first = shown first). The two electronics projects live in their own room (ElectronicsRoom).
   Covers are one sprite (7 tiles), public/uiux/covers.webp: every cover is the same size
   and sits side by side in this order (cover = index in this list).

   bg: the two colours the room is washed with while this project is in front
   (the colours blend as the wheel turns); accent: dial numbers and rings.
   ========================================================================== */

export type UxProject = {
  slug: string;
  title: string;
  kind: string;
  description: string;
  tags: string[];
  bg: [string, string];
  accent: string;
  /** dark background: the text switches to light ink */
  dark?: boolean;
};

export const UX_PROJECTS: UxProject[] = [
  {
    slug: "bawaal",
    title: "Bawaal by Chef Lalit",
    kind: "Restaurant ordering website",
    description:
      "A full online ordering site for a Delhi burger, wrap and momo restaurant: a 53-item menu with veg and non-veg filters, a cart that follows you across devices, delivery priced by distance, online payment, a rider page and loyalty tokens, with an admin panel for live orders and sales.",
    tags: ["Next.js", "Supabase", "Razorpay"],
    bg: ["#f8ddd3", "#f1c3b4"],
    accent: "#b3261e",
  },
  {
    slug: "scenecraft",
    title: "SceneCraft",
    kind: "AI film pre-production studio",
    description:
      "Turns an idea into a planned storyboard: scenes, shots, camera, characters and places. Then it hands you ready-to-paste prompts for Higgsfield or Sora, one shot at a time.",
    tags: ["React", "TypeScript", "AI prompts"],
    bg: ["#dfe0f2", "#c9cbe6"],
    accent: "#4b4fa8",
  },
  {
    slug: "film-with-himank",
    title: "Film with Himank",
    kind: "AI film portfolio",
    description:
      "A cinematic home for his AI films: a short intro, then film cards float around his photo like a music player. Spin them by hand, pick one and it plays.",
    tags: ["HTML · CSS · JS", "AI films", "Netlify"],
    bg: ["#2b211d", "#14100e"],
    accent: "#ff9a62",
    dark: true,
  },
  {
    slug: "mindspace",
    title: "Mindspace",
    kind: "Spatial mind-mapping",
    description:
      "An infinite canvas for thoughts, goals and projects. Ideas link by relationship, groups roll up their progress, and everything saves itself in the browser.",
    tags: ["React", "TypeScript", "Framer Motion"],
    bg: ["#e9dff4", "#d6c6ea"],
    accent: "#7a3fb8",
  },
  {
    slug: "folio",
    title: "Folio",
    kind: "UI/UX portfolio",
    description:
      "A portfolio of interactive prototypes. Each project opens as a live experience, with its format, inputs and screens listed beside it.",
    tags: ["Portfolio", "Interactive prototypes"],
    bg: ["#1b2140", "#0d1124"],
    accent: "#9fb4ff",
    dark: true,
  },
  {
    slug: "interactive-studio",
    title: "Interactive Studio",
    kind: "Technical portfolio · exhibit electronics",
    description:
      "A portfolio of six museum exhibits he wired as a technical intern. Press an exhibit to see it drawn on a shared display, follow a visitor's action through sense, decide and respond, and slide through ten years of a gallery running.",
    tags: ["HTML · CSS · JS", "Exhibit drawings", "Olive palette"],
    bg: ["#e6d9bd", "#d3c49c"],
    accent: "#55652f",
  },
  {
    slug: "krishi-dharohar",
    title: "Krishi Dharohar",
    kind: "Museum kiosk · interactive exhibit",
    description:
      "A portrait touch kiosk on the agricultural heritage of India. Place a crop card on the scanner and the map and figures for rice, wheat, pulses, oilseeds or sugarcane come alive, in Hindi and English.",
    tags: ["RFID cards", "1080 × 1920", "Hindi · English"],
    bg: ["#e0ecd2", "#c9dfae"],
    accent: "#3f7d2a",
  },
];

export const uxCover = (i: number) => ({
  backgroundImage: `url(${import.meta.env.BASE_URL}uiux/covers.webp)`,
  backgroundSize: `${UX_PROJECTS.length * 100}% 100%`,
  backgroundPosition: `${(i / (UX_PROJECTS.length - 1)) * 100}% 0`,
});
