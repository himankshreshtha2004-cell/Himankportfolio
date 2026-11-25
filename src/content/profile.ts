/* ==========================================================================
   PROFILE — facts taken from Himank_Shreshtha_Resume_main.pdf (2026-11-24).
   Source data for later sections (About, Experience, AI Filmmaking, Education,
   Contact). Nothing here is shown on the site until that section is built and
   approved. Phone number intentionally NOT included — add it only if you want
   it public.
   ========================================================================== */
export const profile = {
  name: "Himank Shreshtha",
  positioning: "Creative technologist", // owner's wording for About (2026-11-24)
  resumeHeadline: "AI Artist & Filmmaker | AI Films · Generative Visuals · AI Wedding Invitations · Interactive Media",
  location: "North East Delhi, India",
  email: "himankshreshtha2004@gmail.com",
  links: {
    linkedin: "https://www.linkedin.com/in/himank-shreshtha-232b79440",
    aiFilmPortfolio: "https://filmwithhimank.netlify.app/",
    interactiveExhibits: "https://himank-interactive-studio.netlify.app/",
    uiUx: "https://himank-ui-ux.netlify.app/",
    labs: "https://himank-labs.netlify.app/",
  },
  practice: [
    { title: "AI Art & Film", text: "AI films, wedding invitation videos and generative visuals." },
    { title: "Interactive Exhibits", text: "Museum exhibits where a visitor's touch triggers light, screen and media." },
    { title: "UI & Web Design", text: "Interfaces and web experiences, from layout to interaction." },
    { title: "Physical Computing & IoT", text: "Sensor and automation builds, from prototype to measured result." },
  ],
  /* Experience — employer details stay out of the public site until you approve them for 03 Experience. */
  experience: [
    {
      role: "AI Filmmaker (Freelance)",
      org: "C S Direkt, Famepilot and independent clients",
      period: "2025 – Present",
      points: [
        "Makes AI films on a freelance basis for C S Direkt and Famepilot, from concept and script through Higgsfield and Google Flow generation to the final edit.",
        "Creates AI wedding invitation films and digital wedding cards for clients, designing the look, visuals and motion of each invite.",
        "Generates still and motion visuals with consistent characters, style and mood across every shot of a piece.",
      ],
    },
    {
      role: "Technical Intern",
      org: "C S Direkt Events & Exhibitions Pvt. Ltd., New Delhi",
      period: "2026 – Present",
      points: [
        "Builds the interactive layer of visitor-facing museum and science-centre exhibits, where a press, turn or placement is answered with light, screen or media. Lead project: Champawat Science Centre (UCOST), Uttarakhand.",
        "Connects hardware to media playback (an ESP32 cues a media player via an optocoupler) and bench-tests every trigger before it goes into an exhibit; planned parts lists for seven exhibits.",
      ],
    },
  ],
  projects: [
    {
      title: "LLM/NLP-Driven Smart Home Automation System — ESP32 Edge Framework",
      period: "2025 – 2026",
      context: "Final-year research project, Bhaskaracharya College of Applied Sciences, DU",
      text: "Offline ESP32 controller that understands English and Hinglish commands with no cloud API; 97% command accuracy and sub-21 ms execution.",
      link: "https://himank-labs.netlify.app/#work-smart-home",
    },
    {
      title: "IoT-Based Smart Kitchen Parameters Checker — ESP8266 Monitor",
      period: "2026",
      context: "Academic project, Bhaskaracharya College of Applied Sciences, DU",
      text: "Reads LPG, smoke, temperature and humidity sensors and responds on its own: sounds a buzzer, switches on an exhaust fan and sends Blynk phone alerts.",
      link: "https://himank-labs.netlify.app/#work-smart-kitchen",
    },
  ],
  skills: {
    "AI Video & Image": "AI filmmaking, Higgsfield, Google Flow, generative AI imagery, prompt writing, character and style consistency",
    Creative: "Concept and script, AI wedding invitations and digital cards, visual storytelling, video editing",
    "Interactive & Web": "Interactive exhibits, HTML/CSS, AI-assisted web development (Claude), Netlify",
    "Physical Computing & IoT": "Arduino, ESP32, ESP8266, sensors and RFID, edge computing, Blynk, Wokwi",
  },
  leadership: {
    role: "President (2024–25) and Vice-President (2023–24), Music Society — BCAS, University of Delhi",
    period: "2023 – 2025",
    text: "Led SRIJAN 2025 (500+ attendees, up over 150% from 200+ in 2024), with 75+ individual participants and 60+ team entries, plus G-20-themed performances with Shyamlal College and SPM College.",
  },
  education: [
    { title: "B.Sc. (Hons.) Electronic Science", place: "Bhaskaracharya College of Applied Sciences, University of Delhi", period: "2022 – 2026" },
    { title: "Senior Secondary (CBSE)", place: "Springdales School, New Delhi", period: "2021" },
  ],
  languages: ["English (Fluent)", "Hindi (Native)"],
};
