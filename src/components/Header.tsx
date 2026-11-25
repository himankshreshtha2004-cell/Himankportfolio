import { useEffect, useState } from "react";
import { site } from "../content/site";
import { STOPS, type StopId } from "../content/timeline";

/** The approved header: name on the left, the approved labels on the right. */
export function Header({ active }: { active: StopId }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`site-header${open ? " is-open" : ""}`}>
      <a className="brand" href="#top" data-to="home" aria-label={`${site.name}, back to the start`}>
        {site.brand}
      </a>
      <nav className="nav" aria-label="Primary">
        <ul>
          {site.nav.map((n) => (
            <li key={n.label}>
              <a href={`#${n.to}`} data-to={n.to} aria-current={active === n.to ? "true" : undefined}>
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <a className="nav__cta" href="#contact" data-to={site.navCta.to} aria-current={active === "contact" ? "true" : undefined}>
          {site.navCta.label}
        </a>
      </nav>
      <button className="menu-btn" type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}>
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <span className="menu-btn__icon" aria-hidden="true" />
      </button>
      <div id="mobile-menu" className="mobile-menu" hidden={!open} onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
        <ol>
          {STOPS.map((s) => (
            <li key={s.id} className={s.parent ? "is-sub" : undefined}>
              <a href={`#${s.id}`} data-to={s.id}>
                {!s.parent && <span className="mobile-menu__n">{s.n}</span>}
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </header>
  );
}
