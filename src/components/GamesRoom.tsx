/* ==========================================================================
   GAMES ROOM — "Step inside" the Game Development bay.

   Same tunnel as the AI Films room; inside, the games sit on a dark
   "game library" screen (the way a PC game store shows them): a big banner
   for the chosen game with its title, facts and a Play button, the
   screenshots underneath and the library list on the right.
   Arrow keys / the list change the game; Close, Esc or Back leave.
   ========================================================================== */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { GAMES, gamePath } from "../content/games";
import { RINGS, tunnelIn, tunnelOut } from "./tunnel";

type Props = {
  apiRef: React.MutableRefObject<{ close: () => void } | null>;
  onExit: () => void;
  onRequestClose: () => void;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function GamesRoom({ apiRef, onExit, onRequestClose }: Props) {
  const [active, setActive] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const tunnel = useRef<HTMLDivElement>(null);
  const backBtn = useRef<HTMLButtonElement>(null);
  const leaving = useRef(false);

  useLayoutEffect(() => {
    void tunnelIn(panel.current!, tunnel.current!).then(() =>
      backBtn.current?.focus({ preventScroll: true, focusVisible: false } as FocusOptions),
    );
  }, []);

  const close = useCallback(async () => {
    if (leaving.current) return;
    leaving.current = true;
    await tunnelOut(panel.current!, tunnel.current!);
    onExit();
  }, [onExit]);
  useEffect(() => {
    apiRef.current = { close };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, close]);

  const go = useCallback((i: number) => setActive(Math.max(0, Math.min(GAMES.length - 1, i))), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onRequestClose();
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        if ((e.target as HTMLElement).closest(".gshots")) return;
        e.preventDefault();
        setActive((a) => Math.min(GAMES.length - 1, a + 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        if ((e.target as HTMLElement).closest(".gshots")) return;
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRequestClose]);

  const g = GAMES[active];
  return (
    <div className="room-wrap">
      <div className="tunnel" ref={tunnel} aria-hidden="true">
        <span className="tunnel__vignette" />
        <span className="tunnel__streaks" />
        {Array.from({ length: RINGS }, (_, i) => (
          <span key={i} className="tunnel__ring" />
        ))}
        <span className="tunnel__light" />
      </div>

      <div className="room room--games" ref={panel} role="dialog" aria-modal="true" aria-labelledby="room-title">
        {/* the slim rail on the left */}
        <aside className="grail" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="grail__logo">
            <path d="M5 3.5v17l15-8.5z" fill="currentColor" />
          </svg>
          <span className="grail__sp" />
          <svg viewBox="0 0 24 24" className="grail__ic"><path d="M4 11.5 12 4l8 7.5V20h-5v-6H9v6H4z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          <svg viewBox="0 0 24 24" className="grail__ic"><rect x="4" y="5" width="16" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <svg viewBox="0 0 24 24" className="grail__ic"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </aside>

        <div className="gmain">
          <header className="gtop">
            <button ref={backBtn} type="button" className="gback" onClick={onRequestClose} aria-label="Close the games room">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <p className="gbrand">
              <span id="room-title">[ GAMES ]</span>
              <small>03 — My Work</small>
            </p>
          </header>

          <section className="ghero" key={g.slug} aria-live="polite">
            <img className="ghero__img" src={gamePath(g, "hero.webp")} alt="" style={{ objectPosition: g.focus }} />
            <span className="ghero__shade" aria-hidden="true" />
            <div className="ghero__body">
              <h2 className="ghero__title">{g.title}</h2>
              <p className="ghero__dev">Himank Shreshtha · {g.genre}</p>
              <p className="ghero__tag">{g.tagline}</p>
              <ul className="gfacts">
                {g.facts.map(([v, l]) => (
                  <li key={l}>
                    <b>{v}</b>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
              <div className="gact">
                {g.url ? (
                  <a className="gplay" href={g.url} target="_blank" rel="noopener noreferrer">
                    Play
                  </a>
                ) : (
                  <span className="gplay gplay--off" role="button" aria-disabled="true">
                    Link coming soon
                  </span>
                )}
                <span className="gnote">{g.url ? "Opens the game in a new tab" : "Gallery 01 is built; the public link is on its way"}</span>
              </div>
              <p className="gdesc">{g.description}</p>
            </div>
          </section>

          <div className="gshots" role="group" aria-label={`${g.title} screenshots`} key={`${g.slug}-s`}>
            {Array.from({ length: g.shots }, (_, i) => (
              <img key={i} src={gamePath(g, `s${i + 1}.webp`)} alt={`${g.title} screenshot ${i + 1}`} loading="lazy" />
            ))}
          </div>
        </div>

        <aside className="glib" aria-label="Game library">
          <h3>Game library</h3>
          <ul>
            {GAMES.map((x, i) => (
              <li key={x.slug}>
                <button type="button" aria-current={i === active ? "true" : undefined} onClick={() => go(i)}>
                  <img src={gamePath(x, "thumb.webp")} alt="" />
                  <span className="glib__n">{pad(i + 1)}</span>
                  <span className="glib__t">{x.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
