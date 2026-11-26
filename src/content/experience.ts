/** Experience — six C S Direkt exhibits shown through four cabins. Images are concept renders. */
export type Exhibit = {
  id: string;
  name: string;
  parts: string;
  image: string;
  /** object-position on the wall, so the crop keeps the subject */
  pos?: string;
  how: string;
  choice: string;
  hard: { title: string; fix: string }[];
};
export type Cabin = {
  id: string;
  n: string;
  label: string;
  /** hotspot rect over the film frame, % of the stage */
  box: { x: number; y: number; w: number; h: number };
  /** the cabin's real outline (top and bottom edges slant with the camera), % of the stage, clockwise from top-left */
  poly: [number, number][];
  exhibits: Exhibit[];
};

const base = import.meta.env.BASE_URL;

/** an outline in, its bounding box and the outline back */
const shape = (poly: [number, number][]): Pick<Cabin, "box" | "poly"> => {
  const xs = poly.map((q) => q[0]);
  const ys = poly.map((q) => q[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { box: { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }, poly };
};

export const CABINS: Cabin[] = [
  {
    id: "fields",
    n: "01",
    label: "Fields",
    ...shape([[13.05, 40.2], [20.3, 40.1], [23.85, 41.97], [23.85, 67.06], [20.25, 68.8], [13.05, 68.9]]),
    exhibits: [
      {
        id: "drone",
        name: "Irrigation drone diorama",
        parts: "LEDs, buttons, satellite and drone models",
        image: `${base}experience/drone.webp`,
        pos: "50% 62%",
        how: "A farm diorama in four sections, each watered a different way. Press a section's button: the satellite lights first, then that section's drone, and a screen explains the system.",
        choice: "Water is light behind frosted acrylic, so nothing leaks or needs refilling.",
        hard: [
          { title: "A moving drone would not last", fix: "Four fixed drones with one LED each. The sequence still reads as a flight, with no moving parts to maintain." },
          { title: "Water you can show but not spill", fix: "LED strips behind acrylic, switched in sequence, so light runs along the channels." },
        ],
      },
      {
        id: "crop",
        name: "Crop-rotation wheel",
        parts: "Hall sensors, magnets, slip ring, LEDs",
        image: `${base}experience/crop.webp`,
        pos: "50% 48%",
        how: "Visitors turn an acrylic wheel to match each crop with its season. A right match lights the wheel and a panel beside it green.",
        choice: "Hall sensors read magnets in the wheel, so nothing touches or wears out.",
        hard: [
          { title: "Knowing exactly which crop is lined up", fix: "Each position carries its own magnet pattern, read by a row of sensors, with a gentle detent to settle the wheel." },
          { title: "Lights on a wheel that spins forever", fix: "Power passes through a slip ring on the axle, so no wire ever twists." },
        ],
      },
    ],
  },
  {
    id: "farm",
    n: "02",
    label: "Farm stories",
    ...shape([[23.85, 43.82], [27.35, 43.82], [29.5, 44.93], [29.5, 64.45], [27.2, 65.55], [23.85, 65.55]]),
    exhibits: [
      {
        id: "fruit",
        name: "RFID fruit kiosk",
        parts: "RFID reader, ESP32, buttons, media player",
        image: `${base}experience/fruit.webp`,
        pos: "50% 42%",
        how: "Place a 3D-printed fruit on the reader or press its button. One shared screen tells that fruit's story while its backlit picture lights up.",
        choice: "A simple wired trigger to the media player, instead of a network command that could drop.",
        hard: [
          { title: "Two ways in, one screen", fix: "A first-come lock: the first trigger owns the screen until its clip ends." },
          { title: "More inputs than pins", fix: "An I2C expander adds pins, and optocouplers keep the two power supplies apart." },
        ],
      },
      {
        id: "flap",
        name: "Rotating flap panel",
        parts: "Slip ring, LED strip, etched acrylic",
        image: `${base}experience/flap.webp`,
        pos: "50% 50%",
        how: "A row of flaps turns between a photograph and a text plaque about the farmer's friends and foes. An LED inside the acrylic lights the text.",
        choice: "The LED stays on and its power runs through a slip ring, so wires never twist.",
        hard: [
          { title: "Even light in a thin plaque", fix: "An LED strip along the whole edge, with the text etched into the acrylic." },
          { title: "Fewer parts that can fail", fix: "Dropped the per-flap sensor and switching circuit; the LED simply stays on." },
        ],
      },
    ],
  },
  {
    id: "play",
    n: "03",
    label: "Play",
    ...shape([[69.3, 44.85], [71.27, 43.68], [74.2, 43.68], [74.2, 66.0], [71.27, 66.0], [69.3, 64.7]]),
    exhibits: [
      {
        id: "steer",
        name: "Two-player steering game",
        parts: "Potentiometers, USB game-controller boards",
        image: `${base}experience/steer.webp`,
        pos: "50% 40%",
        how: "Two visitors race two cars on a large screen, each with a real steering wheel below it. The design team builds the game; I built the wheels and their link to it.",
        choice: "A potentiometer per wheel, chosen over a magnetic sensor for a steady signal.",
        hard: [
          { title: "Two wheels, two players", fix: "Each wheel feeds its own USB controller board, so the computer sees two ordinary controllers." },
          { title: "Visitors who turn too hard", fix: "End stops, a flexible coupling and a small dead zone in code." },
        ],
      },
    ],
  },
  {
    id: "sound",
    n: "04",
    label: "Sound & motion",
    ...shape([[74.2, 42.07], [77.34, 40.2], [84.4, 40.2], [84.4, 69.0], [77.34, 69.0], [74.2, 67.0]]),
    exhibits: [
      {
        id: "doppler",
        name: "Doppler effect exhibit",
        parts: "Motor, arm, speaker, slip ring",
        image: `${base}experience/doppler.webp`,
        pos: "50% 55%",
        how: "Press start and a speaker spins on a motorised arm behind a clear guard. Its pitch rises as it comes towards you and falls as it moves away.",
        choice: "The rotating mechanism is built in-house rather than bought as a ready-made turntable.",
        hard: [
          { title: "A spinning arm that wants to shake", fix: "A counterweight opposite the speaker and a gentle speed ramp." },
          { title: "Sound to a speaker that never stops turning", fix: "Audio through a slip ring at the hub, and a run timer that rests the motor." },
        ],
      },
    ],
  },
];

export const WALL = { x: 37.15, y: 38.5, w: 25.45, h: 21.0 };
export const STAGE_ASPECT = 16 / 9;
