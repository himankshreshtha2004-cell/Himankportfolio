import { useEffect, useRef, useState } from "react";
import { site } from "../content/site";
import { CABINS, WALL } from "../content/experience";

/** Four cabin hotspots over the film frame + the projection wall that answers them. */
export function ExperienceStage() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [cab, setCab] = useState<number | null>(null);
  const [ex, setEx] = useState(0);
  const [tab, setTab] = useState<"how" | "hard">("how");

  useEffect(() => {
    const layer = root.current?.closest<HTMLElement>(".layer");
    if (!layer) return;
    const read = () => setActive(layer.dataset.on === "true");
    read();
    const mo = new MutationObserver(read);
    mo.observe(layer, { attributes: true, attributeFilter: ["data-on"] });
    return () => mo.disconnect();
  }, []);

  // closing the section resets it, so the wall is idle again on return
  useEffect(() => {
    if (!active) {
      setCab(null);
      setEx(0);
      setTab("how");
    }
  }, [active]);

  // the intro card steps aside while a cabin is open and returns when none is
  useEffect(() => {
    const layer = root.current?.closest<HTMLElement>(".layer");
    if (layer) layer.dataset.picked = cab === null ? "false" : "true";
  }, [cab]);

  useEffect(() => {
    if (cab === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCab(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cab]);

  const pick = (i: number) => {
    if (cab === i) {
      setCab(null);
      return;
    }
    setCab(i);
    setEx(0);
    setTab("how");
  };
  const cabin = cab === null ? null : CABINS[cab];
  const exhibit = cabin ? cabin.exhibits[ex] : null;

  return (
    <div className="exp" ref={root} data-open={cabin ? "true" : "false"}>
      <div className="exp-stage">
        {CABINS.map((c, i) => {
          const pts = c.poly.map(([px, py]) => [((px - c.box.x) / c.box.w) * 100, ((py - c.box.y) / c.box.h) * 100]);
          const clip = `polygon(${pts.map(([a, b]) => `${a.toFixed(2)}% ${b.toFixed(2)}%`).join(", ")})`;
          const svgPts = pts.map(([a, b]) => `${a.toFixed(2)},${b.toFixed(2)}`).join(" ");
          return (
            <div
              key={c.id}
              className={`exp-cabw${cab === i ? " is-on" : ""}`}
              style={{ left: `${c.box.x}%`, top: `${c.box.y}%`, width: `${c.box.w}%`, height: `${c.box.h}%` }}
            >
              <button
                type="button"
                className="exp-cab"
                style={{ clipPath: clip }}
                aria-pressed={cab === i}
                aria-label={`${c.label}: ${c.exhibits.map((e) => e.name).join(", ")}`}
                onClick={() => pick(i)}
              >
                <svg className="exp-cab__shape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <polygon className="exp-cab__glow" points={svgPts} />
                  <polygon className="exp-cab__edge" points={svgPts} />
                </svg>
              </button>
              <span className="exp-cab__tag" aria-hidden="true">
                <span className="exp-cab__n">{c.n}</span>
                <span className="exp-cab__l">{c.label}</span>
                <i className="exp-cab__arr" />
              </span>
            </div>
          );
        })}
        <div className="exp-wall" style={{ left: `${WALL.x}%`, top: `${WALL.y}%`, width: `${WALL.w}%`, height: `${WALL.h}%` }} aria-hidden="true">
          <div className="exp-intro">
            <p className="kicker">{site.experience.kicker}</p>
            <h3 className="exp-intro__title">{site.experience.title}</h3>
            <p className="exp-intro__org">{site.experience.org}</p>
            <p className="exp-intro__line">{site.experience.line}</p>
          </div>
          {CABINS.flatMap((c) => c.exhibits).map((e) => (
            <img key={e.id} src={e.image} alt="" style={{ objectPosition: e.pos }} className={exhibit && exhibit.id === e.id ? "is-on" : ""} loading="lazy" decoding="async" />
          ))}
        </div>
      </div>

      {cabin && (
        <button type="button" className="exp-back" onClick={() => setCab(null)}>
          <span aria-hidden="true">←</span> Back to the four cabins
        </button>
      )}

      {/* phone: the cabins become chips */}
      <div className="exp-chips" role="group" aria-label="Choose a cabin">
        {CABINS.map((c, i) => (
          <button key={c.id} type="button" className={cab === i ? "is-on" : ""} aria-pressed={cab === i} onClick={() => pick(i)}>
            <b>{c.n}</b> {c.label}
          </button>
        ))}
      </div>

      <aside className="exp-info" aria-live="polite">
        {!cabin || !exhibit ? (
          <p className="exp-hint">Choose a cabin. The wall answers.</p>
        ) : (
          <>
            <img className="exp-info__img" src={exhibit.image} alt={exhibit.name} />
            <div className="exp-info__body">
              <p className="kicker">
                {cabin.n} · {cabin.label}
                {cabin.exhibits.length > 1 ? ` · ${ex + 1} of ${cabin.exhibits.length}` : ""}
              </p>
              <h3 className="exp-info__title">{exhibit.name}</h3>
              <p className="exp-info__parts">{exhibit.parts}</p>
              <div className="exp-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={tab === "how"} className={tab === "how" ? "is-on" : ""} onClick={() => setTab("how")}>
                  How it works
                </button>
                <button type="button" role="tab" aria-selected={tab === "hard"} className={tab === "hard" ? "is-on" : ""} onClick={() => setTab("hard")}>
                  What was hard
                </button>
                {cabin.exhibits.length > 1 && (
                  <button
                    type="button"
                    className="exp-next"
                    onClick={() => {
                      setEx((ex + 1) % cabin.exhibits.length);
                      setTab("how");
                    }}
                  >
                    <span>Next: {cabin.exhibits[(ex + 1) % cabin.exhibits.length].name}</span> <b aria-hidden="true">→</b>
                  </button>
                )}
              </div>
              {tab === "how" ? (
                <>
                  <p className="exp-info__text">{exhibit.how}</p>
                  <p className="exp-info__choice">{exhibit.choice}</p>
                </>
              ) : (
                <ul className="exp-hard">
                  {exhibit.hard.map((h) => (
                    <li key={h.title}>
                      <b>{h.title}</b>
                      <span>{h.fix}</span>
                    </li>
                  ))}
                </ul>
              )}
              {cabin.exhibits.length > 1 && (
                <div className="exp-pager">
                  {cabin.exhibits.map((e, k) => (
                    <button key={e.id} type="button" className={k === ex ? "is-on" : ""} aria-label={e.name} onClick={() => { setEx(k); setTab("how"); }} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
