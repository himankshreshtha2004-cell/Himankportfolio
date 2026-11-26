/* Shared motion tokens. Exponential ease-out for entrances, springs for
   anything the pointer drives, so interrupted gestures never jump. */
export const easeOut = [0.22, 1, 0.36, 1] as const
export const easeInOut = [0.65, 0, 0.35, 1] as const
export const spring = { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 } as const
export const softSpring = { type: 'spring', stiffness: 170, damping: 24, mass: 1 } as const
