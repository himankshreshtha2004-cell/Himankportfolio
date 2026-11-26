import { useEffect, useRef, useState } from "react";
import { site } from "../content/site";

/** Four numbers from the resume; they count up each time the section arrives. */
export function EducationStats() {
  const root = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0); // 0 → 1

  useEffect(() => {
    const layer = root.current?.closest<HTMLElement>(".layer");
    if (!layer) return;
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return setT(1);
      const t0 = performance.now() + 250;
      const tick = (now: number) => {
        const k = Math.max(0, Math.min(1, (now - t0) / 1400));
        setT(1 - Math.pow(1 - k, 3));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      setT(0);
      raf = requestAnimationFrame(tick);
    };
    const read = () => {
      if (layer.dataset.on === "true") run();
      else {
        cancelAnimationFrame(raf);
        setT(0);
      }
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(layer, { attributes: true, attributeFilter: ["data-on"] });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="edu-stats" ref={root} role="list" aria-label="In numbers">
      {site.education.stats.map((s) => (
        <div className="edu-stat" role="listitem" key={s.label}>
          <b>
            {s.prefix}
            {Math.round(s.value * t)}
            {s.suffix}
          </b>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
