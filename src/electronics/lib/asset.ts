/* The archive's media and PDFs live in public/electronics/. This turns a path like "media/x.mp4" into an address that works at any site base. */
export const asset = (p: string) => `${import.meta.env.BASE_URL}electronics/${p}`
