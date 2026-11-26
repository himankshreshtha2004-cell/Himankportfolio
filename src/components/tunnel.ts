/* The tunnel that opens and closes a room (same motion as the AI Films room). */
export const RINGS = 11;
export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const cancel = (el: Element) => el.getAnimations().forEach((x) => x.cancel());

/** push into the bay, rush through the rings, and let the panel grow out of the light */
export function tunnelIn(panel: HTMLElement, tunnel: HTMLElement): Promise<void> {
  const cv = document.querySelector<HTMLCanvasElement>("canvas.film");
  const rings = Array.from(tunnel.querySelectorAll<HTMLElement>(".tunnel__ring"));
  const part = (c: string) => tunnel.querySelector<HTMLElement>(c)!;
  const reduce = reducedMotion();
  if (cv) {
    cv.style.transformOrigin = "50% 48%";
    cv.animate(
      [
        { transform: "scale(1)", filter: "blur(0px) brightness(1)" },
        { transform: "scale(1.3)", filter: "blur(1px) brightness(0.92)", offset: 0.35 },
        { transform: "scale(3.2)", filter: "blur(14px) brightness(0.35)" },
      ],
      { duration: reduce ? 1 : 1900, easing: "cubic-bezier(0.42, 0, 0.25, 1)", fill: "forwards" },
    );
  }
  if (!reduce) {
    rings.forEach((r, i) =>
      r.animate(
        [
          { transform: "translate(-50%, -50%) scale(0.05)", opacity: 0 },
          { opacity: 1, offset: 0.3 },
          { transform: "translate(-50%, -50%) scale(2.6)", opacity: 0 },
        ],
        { duration: 1150, delay: 260 + i * 95, easing: "cubic-bezier(0.6, 0.04, 0.9, 0.4)", fill: "both" },
      ),
    );
    part(".tunnel__streaks").animate(
      [
        { transform: "scale(0.5) rotate(0deg)", opacity: 0 },
        { opacity: 0.9, offset: 0.4 },
        { transform: "scale(2.2) rotate(8deg)", opacity: 0 },
      ],
      { duration: 1650, delay: 250, easing: "cubic-bezier(0.5, 0, 0.75, 0.3)", fill: "both" },
    );
    part(".tunnel__vignette").animate([{ opacity: 0 }, { opacity: 1, offset: 0.55 }, { opacity: 0.7 }], {
      duration: 2100,
      easing: "ease-in-out",
      fill: "forwards",
    });
    part(".tunnel__light").animate(
      [
        { transform: "translate(-50%, -50%) scale(0.1)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(0.6)", opacity: 1, offset: 0.6 },
        { transform: "translate(-50%, -50%) scale(1.6)", opacity: 0 },
      ],
      { duration: 1300, delay: 1000, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "both" },
    );
  }
  const a = panel.animate(
    reduce
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [
          { transform: "scale(0.08)", opacity: 0, borderRadius: "80px", filter: "brightness(1.6)" },
          { transform: "scale(0.1)", opacity: 1, borderRadius: "80px", filter: "brightness(1.6)", offset: 0.1 },
          { transform: "scale(1)", opacity: 1, borderRadius: "22px", filter: "brightness(1)" },
        ],
    { duration: reduce ? 200 : 1200, delay: reduce ? 0 : 1350, easing: "cubic-bezier(0.37, 0, 0.1, 1)", fill: "both" },
  );
  return a.finished.then(() => undefined).catch(() => undefined);
}

/** the same tunnel, backwards; resolves once the bay is back */
export async function tunnelOut(panel: HTMLElement, tunnel: HTMLElement): Promise<void> {
  const cv = document.querySelector<HTMLCanvasElement>("canvas.film");
  const rings = Array.from(tunnel.querySelectorAll<HTMLElement>(".tunnel__ring"));
  const part = (c: string) => tunnel.querySelector<HTMLElement>(c)!;
  const reduce = reducedMotion();
  panel.getAnimations().forEach((x) => x.cancel());
  const out = panel.animate(
    reduce
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [
          { transform: "scale(1)", opacity: 1, borderRadius: "22px", filter: "brightness(1)" },
          { transform: "scale(0.1)", opacity: 1, borderRadius: "80px", filter: "brightness(1.6)", offset: 0.88 },
          { transform: "scale(0.08)", opacity: 0, borderRadius: "80px", filter: "brightness(1.6)" },
        ],
    { duration: reduce ? 150 : 800, easing: "cubic-bezier(0.6, 0, 0.8, 0.2)", fill: "forwards" },
  );
  if (!reduce) {
    rings.forEach((r, i) => {
      cancel(r);
      r.animate(
        [
          { transform: "translate(-50%, -50%) scale(2.6)", opacity: 0 },
          { opacity: 1, offset: 0.7 },
          { transform: "translate(-50%, -50%) scale(0.05)", opacity: 0 },
        ],
        { duration: 1000, delay: 450 + (RINGS - 1 - i) * 65, easing: "cubic-bezier(0.1, 0.6, 0.4, 0.96)", fill: "both" },
      );
    });
    const st = part(".tunnel__streaks");
    cancel(st);
    st.animate(
      [
        { transform: "scale(2.2) rotate(8deg)", opacity: 0 },
        { opacity: 0.8, offset: 0.5 },
        { transform: "scale(0.5) rotate(0deg)", opacity: 0 },
      ],
      { duration: 1200, delay: 450, easing: "cubic-bezier(0.2, 0.6, 0.4, 1)", fill: "both" },
    );
    const vg = part(".tunnel__vignette");
    cancel(vg);
    vg.animate([{ opacity: 0.7 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], { duration: 1900, easing: "ease-in-out", fill: "forwards" });
  }
  let back: Animation | null = null;
  if (cv) {
    cancel(cv);
    back = cv.animate(
      [
        { transform: "scale(3.2)", filter: "blur(14px) brightness(0.35)" },
        { transform: "scale(1.35)", filter: "blur(1px) brightness(0.9)", offset: 0.7 },
        { transform: "scale(1)", filter: "blur(0px) brightness(1)" },
      ],
      { duration: reduce ? 1 : 1400, delay: reduce ? 0 : 600, easing: "cubic-bezier(0.2, 0, 0.2, 1)", fill: "both" },
    );
  }
  await Promise.all([out.finished.catch(() => undefined), back?.finished.catch(() => undefined)]);
  if (cv) {
    cancel(cv);
    cv.style.transformOrigin = "";
  }
}
