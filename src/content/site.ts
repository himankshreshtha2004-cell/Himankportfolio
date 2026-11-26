/* ==========================================================================
   SITE CONTENT — every word on the site. Facts come from the resume
   (profile.ts) or from Himank's own brief; nothing is invented.
   Placeholders are marked TODO and show as empty frames until filled.
   ========================================================================== */
import { profile } from "./profile";
import type { StopId } from "./timeline";

export type Link = { label: string; to: StopId };

export const site = {
  name: "Himank Shreshtha",
  brand: "[ HIMANK SHRESHTHA ]",

  /* the approved header labels, now leading to the film's sections */
  nav: [
    { label: "Work", to: "work" },
    { label: "Services", to: "experience" },
    { label: "Experiments", to: "electronics" },
    { label: "About", to: "about" },
  ] as Link[],
  navCta: { label: "Say hello", to: "contact" } as Link,

  /* 01 HOME — the approved panel, unchanged */
  home: {
    headlineA: "More than",
    headlineB: "one",
    headlineEm: "thing.",
    statement: ["Designed by craft.", "Perfected by function.", "Alive by purpose."],
    description: "A curated space for creative minds and digital experiences that move people.",
    index: [
      { n: "01", label: "Selected Work", to: "work" },
      { n: "02", label: "UI / UX", to: "uiux" },
      { n: "03", label: "Interactive Games", to: "games" },
      { n: "04", label: "Experiments", to: "electronics" },
      { n: "05", label: "About", to: "about" },
      { n: "06", label: "Contact", to: "contact" },
    ] as (Link & { n: string })[],
  },

  /* 02 ABOUT — bio is a draft from the resume: edit it into your own words */
  about: {
    kicker: "02 — About",
    titleA: "Creative",
    titleB: "technologist.",
    bio: [
      "I’m Himank Shreshtha, a creative technologist based in Delhi.",
      "I make AI films and generative visuals, design interfaces for the web, and build the interactive layer of museum exhibits, where a visitor’s press, turn or touch is answered with light, screen and sound.",
    ],
    facts: [
      { k: "Based in", v: "Delhi, India" },
      { k: "Studied", v: "B.Sc. (Hons.) Electronic Science, University of Delhi" },
    ],
    /* TODO: your 2 photos — e.g. { src: "images/about/portrait.webp", alt: "Himank on stage" } */
    photos: [] as { src: string; alt: string }[],
    photoSlots: ["Photo 1", "Photo 2"],
  },

  /* 03 MY WORK — the overview and the four bays */
  work: {
    kicker: "03 — My Work",
    title: "Four rooms, four practices.",
    line: "Scroll on to visit each room, or jump straight to one.",
  },
  bays: {
    aifilm: { title: "AI Filmmaking", count: "15–20 films", text: "AI films, wedding-invitation films and generative visuals, from concept and script to the final edit." },
    games: { title: "Game Development", count: "3 games", text: "Games built for the browser, from the first puzzle sketch to the last level." },
    uiux: { title: "UI/UX Design", count: "7 projects", text: "Interfaces and web experiences, from layout to interaction." },
    electronics: { title: "Electronics", count: "2 projects", text: "An offline ESP32 smart-home controller and an ESP8266 smart-kitchen monitor." },
  } as Record<"aifilm" | "games" | "uiux" | "electronics", { title: string; count: string; text: string }>,
  enterLabel: "Step inside",
  enterSoon: "Opens in the next build step",
  enterFilms: "Watch the films",
  enterGames: "Play the games",
  enterUiux: "Browse the projects",
  enterElectronics: "Open the archive",

  /* 04 EXPERIENCE */
  experience: {
    kicker: "04 — Professional Experience",
    title: "Interactive exhibits.",
    org: "Technical Intern, C S Direkt Events & Exhibitions · 2026 – present",
    line: "Six exhibits in four cabins. Choose one and the projection wall shows it, how it works and what was hard.",
  },

  /* 05 EDUCATION */
  education: {
    kicker: "05 — Education",
    rows: profile.education.map((e) => ({ when: e.period, title: e.title, place: e.place })),
    skillsKicker: "Skills",
    skills: Object.entries(profile.skills).map(([group, text]) => ({ group, items: text.split(",").map((t) => t.trim()) })),
    leadKicker: "Leadership",
    leadRole: profile.leadership.role,
    leadText: profile.leadership.text,
    languages: profile.languages,
    projectsKicker: "Academic builds",
    projects: profile.projects.map((p) => ({ title: p.title.split(" — ")[0], note: p.text })),
    stats: [
      { value: 97, prefix: "", suffix: "%", label: "command accuracy, offline smart-home controller" },
      { value: 21, prefix: "<", suffix: " ms", label: "command execution on an ESP32" },
      { value: 500, prefix: "", suffix: "+", label: "attendees at SRIJAN 2025" },
      { value: 150, prefix: "+", suffix: "%", label: "audience growth over 2024" },
    ],
  },

  /* 06 BEYOND WORK */
  beyond: {
    kicker: "06 — Beyond Work",
    title: "Off the screen.",
    line: "Sports and music. Drag the photos around, flip them, stack them and throw them again.",
    sports: ["Sports", "Music"],
  },

  /* 07 CONTACT — phone number intentionally not published */
  contact: {
    kicker: "07 — Contact",
    title: "Let’s create together.",
    email: profile.email,
    links: [
      { label: "LinkedIn", href: profile.links.linkedin },
      { label: "GitHub", href: "" }, // TODO: your GitHub URL
    ],
    cta: "Say hello",
    footer: `© ${new Date().getFullYear()} Himank Shreshtha`,
  },
};
