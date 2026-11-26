import { asset } from '../lib/asset'
import type { Project } from './types'

/*
  PROJECT DATA
  ------------------------------------------------------------------
  Every fact below comes from one of four sources, noted per field:
    [Report]  the project's research report (public/docs/…)
    [Video]   the real prototype footage (public/media/…)
    [You]     something you told me directly
  Anything not covered by those is a { placeholder: '…' } and shows on
  the site in amber until you replace it with real text.
  Media and documents live in /public — swap a file, keep the path.
*/

export const projects: Project[] = [
  {
    slug: 'smart-home',
    number: '001',
    fileId: 'HS-ARC-001',
    title: 'Smart Home Automation',
    shortTitle: 'Smart Home',
    // [Report] title page subtitle
    subtitle: 'An ESP32-driven offline control framework with Bluetooth SPP and Hinglish intent parsing.',
    meta: [
      { label: 'Year', value: '2025–26' },
      { label: 'Type', value: 'Academic research project' },
      { label: 'Institution', value: 'Bhaskaracharya College of Applied Sciences, University of Delhi' },
      { label: 'Supervisor', value: 'Dr. Inderbir Kaur' },
      { label: 'Platform', value: 'ESP32 · Bluetooth Classic SPP' },
      { label: 'Validation', value: 'Wokwi simulation · breadboard prototype' },
    ],
    heroImage: asset('media/smart-home-poster.jpg'),
    heroAlt: 'Breadboard prototype of the smart home controller beside a laptop showing firmware and serial output',
    // [Report] Abstract, Ch. I
    overview: [
      'An offline smart-home controller that runs entirely on one ESP32. A command typed or spoken on a phone reaches the board over Bluetooth Classic, where a keyword parser reads English and Hinglish and switches a relay.',
      'Alongside commands, the board reads temperature and motion and can switch the appliance by itself. No cloud service is involved in any decision.',
    ],
    // [Report] Ch. I A–C
    problem: [
      'Typical smart homes route every command through a cloud service, which the report cites at 200–800 ms of delay, streams occupancy and temperature data off-site, and stops working when the internet does.',
      'Natural-language control is also built for English. Many Indian users mix Hindi and English in one phrase ("agar garmi hai toh fan on kar do"), which those systems cannot read without cloud translation.',
    ],
    // [Report] Ch. I D
    objectives: [
      'Non-blocking firmware that handles DHT11 readings, PIR sensing, Bluetooth SPP and relay switching together.',
      'A substring-matching parser for English and Hinglish commands.',
      'A state machine that settles conflicts between automatic and user-directed control predictably.',
      'Measured response time, sensor timing, memory and power.',
    ],
    // [Report] Ch. III Table II–III, Ch. IV
    diagram: {
      caption: 'Four-layer architecture from the report. The cloud layer is optional and not used for any real-time action.',
      source: 'Report ch. III · Tables II–III',
      nodes: [
        { id: 'phone', label: 'Phone app', sub: 'typed or spoken → text', col: 0 },
        { id: 'dht', label: 'DHT11', sub: 'GPIO 15 · temp / humidity', col: 0 },
        { id: 'pir', label: 'HC-SR501 PIR', sub: 'GPIO 19 · motion', col: 0 },
        { id: 'spp', label: 'Bluetooth SPP', sub: 'ASCII serial link', col: 1, row: 0 },
        {
          id: 'esp',
          label: 'ESP32 edge node',
          col: 2,
          lines: ['Hinglish trigger table', 'Occupied AND hot → relay', '24–26 °C hysteresis', 'Override M · 300 s expiry'],
        },
        { id: 'relay', label: 'Relay', sub: 'GPIO 2 · optocoupler', col: 3 },
        { id: 'load', label: 'Appliance', sub: 'fan or light', col: 3 },
        { id: 'cloud', label: 'Cloud', sub: 'optional · future', col: 3, optional: true },
      ],
      edges: [
        { from: 'phone', to: 'spp', label: 'ASCII' },
        { from: 'spp', to: 'esp', label: 'RX buffer' },
        { from: 'dht', to: 'esp', label: 'every 2 s' },
        { from: 'pir', to: 'esp', label: 'HIGH ≈ 2.5 s' },
        { from: 'esp', to: 'relay', label: 'digitalWrite' },
        { from: 'relay', to: 'load' },
        { from: 'esp', to: 'cloud', dashed: true },
      ],
    },
    // [Report] Table III, Ch. III–V
    hardware: [
      { name: 'ESP32-WROOM-32', role: 'Edge processor: dual-core Xtensa LX6, up to 240 MHz, built-in Bluetooth Classic', link: '—' },
      { name: 'DHT11', role: 'Ambient temperature and humidity', link: 'GPIO 15 · single-wire' },
      { name: 'HC-SR501 PIR', role: 'Occupancy (motion) detection', link: 'GPIO 19 · digital in' },
      { name: 'Relay module', role: 'Appliance switch, optocoupler-isolated, coil on the 5 V rail', link: 'GPIO 2 · digital out' },
      { name: 'Smartphone', role: 'Command entry (Bluetooth terminal; phone speech-to-text for voice)', link: 'Bluetooth SPP' },
      { name: 'UART0', role: 'Serial monitor for debugging and logging', link: 'GPIO 1 / 3' },
    ],
    software: [
      { name: 'Firmware', role: 'Non-blocking main loop on the Arduino core, timed with millis()' },
      { name: 'NLP resolver', role: 'Lowercase + trim, then .indexOf() checks against the trigger table, longest phrases first' },
      { name: 'State machine', role: 'Manual override flag M with three exits: "auto", 300 s timeout, power cycle' },
      { name: 'DHT library', role: 'Single-wire temperature and humidity reads every 2,000 ms' },
      { name: 'Wokwi', role: 'ESP32 simulation used for the latency, jitter and memory tests' },
    ],
    // [Report] Ch. III D, Ch. V
    workflow: [
      { title: 'Command in', detail: 'The user types or speaks on the phone; speech is turned into text by the phone.' },
      { title: 'Over Bluetooth', detail: 'The text travels as ASCII over Bluetooth Classic SPP into the ESP32 receive buffer.' },
      { title: 'Cleaned', detail: 'The string is lowercased and stripped of extra spaces.' },
      { title: 'Resolved', detail: 'It is checked against the trigger table, longest phrases first. The first match sets the relay state and raises the override flag; an unknown phrase changes nothing.' },
      { title: 'Arbitrated and switched', detail: 'The command state, the override flag and the sensor state are compared, and the result is written to GPIO 2.' },
      { title: 'Sensing in parallel', detail: 'Every 2 s the board reads DHT11 and PIR. With no override active, the relay turns on only when the room is occupied and the temperature is above the band.' },
    ],
    stages: [
      { title: 'Input', detail: 'Phone command, or a DHT11 / PIR reading' },
      { title: 'Transport', detail: 'Bluetooth Classic SPP, plain ASCII' },
      { title: 'Resolve', detail: 'English / Hinglish trigger table on the ESP32' },
      { title: 'Arbitrate', detail: 'Override flag M versus occupied-and-hot rule' },
      { title: 'Actuate', detail: 'Relay on GPIO 2' },
      { title: 'Feedback', detail: '"status" / "batao" returns readings over Bluetooth' },
    ],
    media: {
      explained: {
        orientation: 'landscape',
        pendingNote: 'AI-explained walkthrough of the architecture and logic.',
      },
      inAction: {
        src: asset('media/smart-home-in-action.mp4'),
        poster: asset('media/smart-home-poster.jpg'),
        orientation: 'landscape',
      },
    },
    // [Report] Ch. VII
    results: [
      {
        title: 'Command execution latency',
        source: 'Wokwi simulation · Table VIII',
        columns: ['Command', 'Bytes', 'Total (ms)', 'Relay'],
        rows: [
          ['"auto"', '5', '7.8', 'override cleared'],
          ['"thand"', '6', '9.1', 'HIGH → LOW'],
          ['"garmi"', '6', '9.2', 'LOW → HIGH'],
          ['"fan on"', '7', '10.4', 'LOW → HIGH'],
          ['"andhera"', '8', '11.3', 'LOW → HIGH'],
          ['unknown phrase', '10', '13.7', 'no change'],
          ['"light on karo"', '14', '18.4', 'LOW → HIGH'],
          ['"bahut garmi hai"', '16', '20.8', 'LOW → HIGH'],
        ],
      },
      {
        title: 'Sensor polling jitter',
        source: 'Wokwi simulation · Table IX · target under 5 ms',
        columns: ['Load', 'Mean interval (ms)', 'Max deviation (ms)', 'Std dev (ms)'],
        rows: [
          ['Idle, no commands', '2001.2', '1.8', '0.6'],
          ['1 command / s', '2002.1', '3.4', '1.1'],
          ['5 commands / s', '2003.7', '4.9', '1.8'],
        ],
      },
      {
        title: 'Memory, power and accuracy',
        source: 'Wokwi simulation; power measured on the prototype with a USB power meter',
        columns: ['Measure', 'Result'],
        rows: [
          ['Static memory after start-up', '48.8 KB · 9.4% of 520 KB'],
          ['Peak during command parsing', '1.6 KB · 0.3%, fully recovered after'],
          ['Drift after 1 hour', '0.3 KB (Bluetooth stack buffers)'],
          ['Power, relay on / idle', '698 mW / 259 mW'],
          ['Parser accuracy', '97 of 100 commands; 3 misses from the typo "garni"; 0 false switches'],
        ],
      },
    ],
    // [Report] Ch. IX
    limitations: [
      'One ESP32 and one relay; no coordination between rooms yet.',
      'A PIR sensor stops seeing a person who sits still, so the automatic rule can switch off an occupied room.',
      'Voice commands depend on the phone’s speech-to-text, which may itself use the cloud.',
      'Latency and jitter come from simulation and still need confirming on real hardware.',
    ],
    evidence: {
      documented: [
        'Architecture, GPIO map, trigger table and control equations',
        'Simulated latency, jitter, memory and accuracy results',
        'Power figures measured on the prototype',
      ],
      visible: [
        'A breadboard prototype beside a laptop showing firmware and serial output',
        'A flame brought close to the board, and LEDs on the board switching',
        'A phone used alongside the prototype',
      ],
      unspecified: [
        'Exact commands sent during the recording',
        'Latency measured on the physical board',
        'What is said in the video’s audio',
      ],
    },
    report: {
      title: 'Smart Home Automation — Academic Project Report',
      pdf: asset('docs/smart-home-report.pdf'),
      pages: 54,
      format: 'PDF',
      authors: 'Himank Shreshtha',
      supervisor: 'Dr. Inderbir Kaur',
      toc: [
        { title: 'Abstract', page: 9 },
        { title: 'Introduction', page: 11 },
        { title: 'Literature review', page: 15 },
        { title: 'System architecture', page: 21 },
        { title: 'Mathematical formulation', page: 27 },
        { title: 'Software methodology: NLP and sensor fusion', page: 30 },
        { title: 'Performance metrics', page: 34 },
        { title: 'Results and analysis', page: 37 },
        { title: 'Comparison analysis', page: 41 },
        { title: 'Limitations', page: 44 },
        { title: 'Future work', page: 46 },
        { title: 'Conclusion', page: 48 },
        { title: 'References', page: 50 },
      ],
    },
    // [Report] declaration names Himank Shreshtha as the author. Edit freely.
    contributions: [
      'Author of the research report, under the supervision of Dr. Inderbir Kaur.',
      'Designed the four-layer edge architecture and the GPIO allocation.',
      'Built the Hinglish trigger table and the non-blocking firmware with its override logic.',
      'Ran the Wokwi tests for latency, polling jitter, memory and parser accuracy.',
      'Assembled the breadboard prototype and filmed its demonstration, on my own.',
    ],
    attribution: {
      reportAuthor: 'Himank Shreshtha',
      contributors: [{ name: 'Himank Shreshtha', role: 'Author and developer' }],
      note: 'Supervised by Dr. Inderbir Kaur, Department of Electronic Science, Bhaskaracharya College of Applied Sciences.',
    },
  },

  {
    slug: 'smart-kitchen',
    number: '002',
    fileId: 'HS-ARC-002',
    title: 'Smart Kitchen Parameters Checker',
    shortTitle: 'Smart Kitchen',
    // [Report] title + objectives
    subtitle: 'An IoT kitchen-safety monitor for gas, smoke, temperature and humidity, with automatic ventilation and phone alerts.',
    meta: [
      { label: 'Year', value: '2026' },
      { label: 'Type', value: 'Academic project' },
      { label: 'Institution', value: 'Bhaskaracharya College of Applied Sciences, University of Delhi' },
      { label: 'Supervisor', value: 'Dr. Inderbir Kaur' },
      { label: 'Platform', value: 'ESP8266 NodeMCU · Wi-Fi · Blynk' },
      { label: 'Validation', value: 'Working prototype · test-chamber trials' },
    ],
    heroImage: asset('media/smart-kitchen-poster.jpg'),
    heroAlt: 'Smart kitchen prototype on a cardboard base, with a phone showing a “GAS LEAK DETECTED!” notification',
    // [Report] Abstract, Ch. 3.1
    overview: [
      'A low-cost safety monitor for the kitchen. It watches LPG and combustible gas, smoke, temperature and humidity at the same time, and acts on its own when a reading turns dangerous: an alarm sounds and an exhaust fan switches on.',
      'Readings and alerts also reach a phone through the Blynk app and are logged to ThingSpeak, but the local alarm and fan never wait for the internet.',
    ],
    // [Report] Ch. 1.1–1.2
    problem: [
      'Kitchen gas leaks and fires are a common household hazard, and commercial smart-safety devices cost ₹3,500–25,000, which puts them out of reach for many Indian homes.',
      'Most published systems watch a single parameter and only warn; few take action, such as ventilating, on their own.',
    ],
    // [Report] Ch. 1.3 primary objectives
    objectives: [
      'Monitor LPG / combustible gas, temperature, humidity and smoke together.',
      'Respond automatically to hazardous levels with a buzzer alarm and exhaust-fan control.',
      'Connect to the cloud for remote monitoring, data logs and real-time phone alerts.',
      'Keep the cost low enough for a middle-class Indian household.',
    ],
    // [Report] Ch. 3.2–3.10, Appendix code
    diagram: {
      caption: 'Monitoring and control loop from the report. Safety actions run locally; the cloud path only reports.',
      source: 'Report ch. 3.2–3.10',
      nodes: [
        { id: 'mq2', label: 'MQ-2', sub: 'LPG / combustible gas', col: 0 },
        { id: 'mq135', label: 'MQ-135', sub: 'smoke / air quality', col: 0 },
        { id: 'dht', label: 'DHT11', sub: 'D4 · temp / humidity', col: 0 },
        { id: 'mux', label: 'CD4051 mux', sub: 'both MQ sensors → A0', col: 1, row: 0.5 },
        {
          id: 'mcu',
          label: 'ESP8266 NodeMCU',
          col: 2,
          lines: ['Moving-average filter', 'Gas alert 400 ppm', 'Temp 55 °C · RH 85%', 'Three alert levels'],
        },
        { id: 'buzzer', label: 'Buzzer', sub: 'D5 · pattern per hazard', col: 3 },
        { id: 'fan', label: 'Relay → exhaust fan', sub: 'D6 · 220 V AC', col: 3 },
        { id: 'cloud', label: 'Blynk + ThingSpeak', sub: 'Wi-Fi · alerts and logs', col: 3 },
      ],
      edges: [
        { from: 'mq2', to: 'mux', label: 'analog' },
        { from: 'mq135', to: 'mux', label: 'analog' },
        { from: 'mux', to: 'mcu', label: 'A0, in turn' },
        { from: 'dht', to: 'mcu', label: 'single-wire' },
        { from: 'mcu', to: 'buzzer', label: '≤ 100 ms' },
        { from: 'mcu', to: 'fan', label: '≈ 142 ms' },
        { from: 'mcu', to: 'cloud', dashed: true, label: 'every 10 s' },
      ],
    },
    // [Report] Ch. 3.2, Table 4.1 (bill of materials), firmware pin defines
    hardware: [
      { name: 'ESP8266 NodeMCU v1.0', role: 'Controller with built-in Wi-Fi', link: '—' },
      { name: 'MQ-2', role: 'LPG and combustible gas', link: 'Analog, via CD4051 → A0' },
      { name: 'MQ-135', role: 'Smoke / air quality', link: 'Analog, via CD4051 → A0' },
      { name: 'CD4051', role: 'Analog multiplexer, so both MQ sensors share the single ADC', link: 'Select lines' },
      { name: 'DHT11', role: 'Temperature and humidity', link: 'D4 · single-wire' },
      { name: '5 V active buzzer', role: 'Local alarm', link: 'D5 via transistor' },
      { name: '5 V single-channel relay', role: 'Switches the 220 V exhaust fan', link: 'D6' },
    ],
    software: [
      { name: 'Firmware', role: 'ESP8266 Arduino core; sensor loop with moving-average filtering and three-tier thresholds' },
      { name: 'Blynk', role: 'Phone dashboard and push alerts; values sent every 10 s, immediately on a hazard' },
      { name: 'ThingSpeak', role: 'Four-field data log by HTTP, one update every 15 s' },
      { name: 'Calibration', role: 'MQ-2 R0 baseline in clean air; DHT11 offset against a reference thermometer' },
    ],
    // [Report] Ch. 3.8–3.10
    workflow: [
      { title: 'Sample', detail: 'The NodeMCU reads MQ-2 and MQ-135 in turn through the multiplexer, and DHT11 directly.' },
      { title: 'Filter', detail: 'A moving average smooths each reading to avoid false alarms from cooking fumes and steam.' },
      { title: 'Compare', detail: 'Readings are checked against the thresholds: gas 400 ppm (advisory from 80%), 55 °C, 85% RH, smoke level.' },
      { title: 'Advisory', detail: 'Between 80% and 100% of a limit: a single buzzer sound and a cloud alert.' },
      { title: 'Warning', detail: 'Above the limit: continuous buzzer, the exhaust fan switches on, and a high-priority alert goes out.' },
      { title: 'Emergency', detail: 'If the limit is still exceeded after 30 s, a second alert is sent.' },
      { title: 'Report', detail: 'Readings go to Blynk for the phone and to ThingSpeak for the log. Without Wi-Fi, local alarms and the fan keep working.' },
    ],
    stages: [
      { title: 'Sense', detail: 'MQ-2, MQ-135 (via CD4051) and DHT11' },
      { title: 'Filter', detail: 'Moving average on the NodeMCU' },
      { title: 'Decide', detail: 'Thresholds and three alert levels' },
      { title: 'Act', detail: 'Buzzer pattern, relay → exhaust fan' },
      { title: 'Notify', detail: 'Blynk phone alert, ThingSpeak log' },
    ],
    media: {
      explained: {
        orientation: 'landscape',
        pendingNote: 'AI-explained walkthrough of the sensing loop and alert levels.',
      },
      inAction: {
        src: asset('media/smart-kitchen-in-action.mp4'),
        poster: asset('media/smart-kitchen-poster.jpg'),
        orientation: 'portrait',
      },
    },
    // [Report] Ch. 5
    results: [
      {
        title: 'Gas detection',
        source: '0.5 m³ test chamber · 10 trials per level · Ch. 5.1',
        columns: ['LPG (ppm)', 'Mean response (s)', 'Detection'],
        rows: [
          ['300 · 80% of limit', '4.2 ± 0.8', '100% advisory'],
          ['400 · alert limit', '2.8 ± 0.5', '100% full alert'],
          ['500', '1.9 ± 0.3', '100%'],
          ['700', '1.2 ± 0.2', '100%'],
        ],
      },
      {
        title: 'Automatic response',
        source: 'Ch. 5.3–5.4',
        columns: ['Measure', 'Result'],
        rows: [
          ['Buzzer after a threshold crossing', 'within one control loop (100 ms)'],
          ['Exhaust fan switch-on', '142 ± 18 ms'],
          ['Fan clearing the chamber, 400 → under 200 ppm', '45 ± 8 s'],
          ['Smoke advisory (incense, 10 trials)', '6.2 ± 1.4 s, all detected'],
          ['False smoke alerts during cooking (20 trials)', '0'],
          ['Blynk phone alert delivery (30 tests)', '2.3 ± 0.6 s'],
        ],
      },
      {
        title: 'Accuracy, reliability and cost',
        source: 'Ch. 5.2, 5.5–5.7',
        columns: ['Measure', 'Result'],
        rows: [
          ['Temperature vs reference, 20–50 °C', '0.7 °C mean abs. error'],
          ['Humidity vs reference, 30–80% RH', '3.1% RH mean abs. error'],
          ['Wi-Fi availability over 7 days', 'above 99.97%; 3 drops, each restored in under 30 s'],
          ['ThingSpeak uploads over 48 h', '11,498 of 11,520 (99.8%)'],
          ['Uptime over 30 days', '99.4%'],
          ['Parts cost', '₹945'],
        ],
      },
    ],
    // [Report] Ch. 6.3
    limitations: [
      'Tested in one environment; performance across other kitchens and cooking styles is unknown.',
      'No motorised gas-valve shut-off, so a large leak can outpace the fan.',
      'IoT security (dashboard access, thresholds, data in transit) is not addressed.',
      'MQ-2 cannot tell gases apart, and MQ sensors drift and need periodic recalibration.',
    ],
    evidence: {
      documented: [
        'Sensors, thresholds, alert levels and cloud data flow',
        'Test-chamber, smoke, response and connectivity results',
        'Bill of materials and cost comparison',
      ],
      visible: [
        'The prototype on a cardboard base: breadboard, sensors and indicator LEDs',
        'A multi-channel relay board with lit indicators',
        'The Blynk app opening on a phone, then a dashboard with ON / OFF buttons and live readings',
        'A phone notification reading “GAS LEAK DETECTED!”, which appears to arrive through Telegram',
      ],
      unspecified: [
        'Telegram alerts and a multi-channel relay are not described in the report',
        'Which outputs the app’s ON / OFF buttons control',
        'What is said in the video’s audio',
      ],
    },
    // [Your file] IoT_Based_Smart_Kitchen_Parameter_Himank_Shreshtha.pdf — portfolio
    // edition in your name: 4 pages of front matter, then the original academic
    // report reproduced unchanged as an appendix
    report: {
      title: 'IoT-Based Smart Kitchen Parameter — Portfolio Edition',
      pdf: asset('docs/smart-kitchen-report.pdf'),
      pages: 69,
      format: 'Portfolio edition, with the original academic report reproduced as an appendix',
      creditLabel: 'Portfolio edition',
      authors: 'Himank Shreshtha · project collaborator',
      supervisor: 'Dr. Inderbir Kaur',
      toc: [
        { title: 'Cover', page: 1 },
        { title: 'Project identity and attribution', page: 2 },
        { title: 'System overview', page: 3 },
        { title: 'Contributor statement', page: 4 },
        { title: 'Original report: abstract', page: 6 },
        { title: 'Introduction', page: 14 },
        { title: 'Literature review', page: 19 },
        { title: 'System design and architecture', page: 30 },
        { title: 'Implementation', page: 39 },
        { title: 'Results and performance', page: 44 },
        { title: 'Discussion', page: 49 },
        { title: 'Conclusion and future work', page: 53 },
        { title: 'References', page: 57 },
        { title: 'Appendix A: circuit diagrams', page: 62 },
        { title: 'Appendix B: source code', page: 66 },
      ],
    },
    // [Your file] names you a project collaborator; [You] assembled and filmed the prototype yourself.
    contributions: [
      'Project collaborator, as recorded in the Smart Kitchen portfolio edition.',
      'Assembled the working prototype and filmed its demonstration, on my own.',
    ],
    attribution: {
      reportAuthorLabel: 'Portfolio edition',
      reportAuthor: 'Himank Shreshtha',
      contributors: [{ name: 'Himank Shreshtha', role: 'Project collaborator · assembled and filmed the prototype' }],
      note: 'Supervised by Dr. Inderbir Kaur, Department of Electronic Science, Bhaskaracharya College of Applied Sciences. The PDF reproduces the original academic report unchanged, with its own declarations and certificate.',
    },
  },
]

/* Video for "Watch it run": the how-it-works explainer once it is added,
   otherwise the real prototype footage. */
export const demoVideo = (p: Project) =>
  p.media.explained.src
    ? { video: p.media.explained, label: `${p.shortTitle} · how it works` }
    : { video: p.media.inAction, label: `${p.shortTitle} · in action` }

export const getProject = (slug: string) => projects.find((p) => p.slug === slug)
