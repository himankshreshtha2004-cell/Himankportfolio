import type { Editable } from './types'

/*
  ABOUT SECTION
  Every word in the About section lives here. Edit freely — the layout and
  the animation adapt to whatever you write. Values written as
  { placeholder: '…' } show in amber on the site until you fill them.

  The hardware lab diagram shows the Smart Home system (Project 001). Its
  tooltip specs are taken from that project's report; keep them in step
  with src/data/projects.ts if the report changes.
*/

export type StageKey = 'sense' | 'decide' | 'respond'
export type PartId = 'dht' | 'pir' | 'esp' | 'relay' | 'device'

export type LabPart = {
  /** label printed under the part in the diagram */
  label: string
  sub?: string
  /** tooltip */
  kicker: string
  title: string
  description: string
  specs: string[]
  stage: StageKey
}

export const about = {
  eyebrow: '01 / About the maker',
  // One entry per line of the headline. `accentLine` is tinted silver-blue.
  headline: ['I make physical', 'systems', 'think.'],
  accentLine: 2,
  lead: 'Exploring how sensors, embedded logic and intelligent interfaces turn real-world inputs into meaningful actions.',
  note: 'What interests me most is the moment an idea becomes something you can touch, test and actually make work.',

  principles: [
    { key: 'sense', num: '01 / Input', label: 'Sense' },
    { key: 'decide', num: '02 / Process', label: 'Decide' },
    { key: 'respond', num: '03 / Action', label: 'Respond' },
  ] as { key: StageKey; num: string; label: string }[],

  lab: {
    title: 'Interactive hardware lab',
    subtitle: 'Physical computing / System overview',
    systemLabel: 'System : 01',
    scaleNote: 'Concept diagram / Not to scale',
    footnote: 'Input // Edge processing // Actuation',
    figure: 'Fig. 01',
    tagline: 'Real components. Meaningful interactions.',
    // The project this diagram is drawn from; linked from the panel footer
    source: { label: 'Project 001 · Smart Home', slug: 'smart-home' },
    status: {
      pre: 'Ready to explore',
      sense: 'Acquiring input',
      decide: 'Processing locally',
      respond: 'Output activated',
      online: 'System / Online',
    },
    flow: {
      pre: 'System idle / Awaiting input',
      sense: '01 / Environmental sensor input',
      decide: '02 / Microcontroller decision',
      respond: '03 / Relay actuation',
      online: 'Input → Process → Output',
    },
    parts: {
      dht: {
        label: 'DHT11',
        sub: 'Temp / Humidity',
        kicker: '01 / Environment sensor',
        title: 'DHT11',
        description: 'Temperature and humidity input.',
        specs: ['GPIO 15 · single-wire', 'Read every 2 s'],
        stage: 'sense',
      },
      pir: {
        label: 'HC-SR501',
        sub: 'Motion detection',
        kicker: '02 / Motion sensor',
        title: 'HC-SR501 PIR',
        description: 'Motion and occupancy detection.',
        specs: ['GPIO 19 · digital in', 'Read every 2 s'],
        stage: 'sense',
      },
      esp: {
        label: 'ESP32',
        sub: 'Edge MCU',
        kicker: '03 / Edge processing',
        title: 'ESP32',
        description: 'Processes input locally and applies the control logic. No cloud service is involved.',
        specs: ['ESP32-WROOM-32 · up to 240 MHz', 'Occupied AND hot → relay'],
        stage: 'decide',
      },
      relay: {
        label: 'Output stage',
        sub: 'Actuation',
        kicker: '04 / Output interface',
        title: 'Relay module',
        description: 'Switches the controlled output based on a decision.',
        specs: ['GPIO 2 · optocoupler-isolated', 'Coil on the 5 V rail'],
        stage: 'respond',
      },
      device: {
        label: 'Device',
        kicker: '05 / Actuation',
        title: 'Appliance',
        description: 'Physical action follows a control decision.',
        specs: ['Fan or light, switched by the relay'],
        stage: 'respond',
      },
    } as Record<PartId, LabPart>,
  },

  profile: {
    number: '02 / The person behind the systems',
    heading: ['Curiosity,', 'made tangible.'],
    text: 'My projects begin with a question about how something should behave, move to a breadboard, and become prototypes that can be tested and improved.',
    process: ['Research', 'Prototype', 'Test', 'Refine'],
    details: [
      {
        label: 'Education',
        lines: ['B.Sc. (Hons.) Electronic Science', 'Bhaskaracharya College of Applied Sciences', 'University of Delhi · 2022–2026'],
      },
      { label: 'Experience', lines: ['Technical Intern, C S Direkt', 'Interactive museum and science-centre exhibits'] },
      { label: 'Interests', tags: ['Physical computing', 'Intelligent systems', 'Embedded prototyping', 'Interactive exhibits'] },
      { label: 'Based in', lines: ['Delhi, India'] },
    ] as { label: string; lines?: Editable[]; tags?: string[] }[],
  },
}
