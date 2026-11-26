import { asset } from '../lib/asset'
import type { LinkField } from './types'

/*
  PROFILE DATA
  Your name, introduction, about text and links. Values written as
  { placeholder: '…' } appear in amber on the site until you fill them.
*/

export const profile = {
  name: 'Himank Shreshtha',
  monogram: 'HS',
  identity: 'Physical Computing × AI',
  identityLines: ['Physical Computing', '× AI'],
  archiveYear: '2026',
  // Your introductory lines (from your brief), editable
  description: 'Exploring the intersection of intelligent systems, physical interaction, and real-world problem solving.',
  supporting: 'A collection of research-driven projects combining hardware, software, automation, and intelligent technologies.',

  // The About section's text lives in src/data/about.ts

  github: 'https://github.com/himankshreshtha2004-cell',

  contact: {
    statement: 'Have a system in mind? Let’s make it respond.',
    links: [
      { label: 'Email', href: 'mailto:himankshreshtha2004@gmail.com' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/himank-shreshtha-232b79440' },
      { label: 'GitHub', href: 'https://github.com/himankshreshtha2004-cell', icon: 'github' },
      { label: 'Resume', href: asset('docs/himank-shreshtha-resume.pdf') },
    ] as LinkField[],
    email: 'himankshreshtha2004@gmail.com',
  },
}
