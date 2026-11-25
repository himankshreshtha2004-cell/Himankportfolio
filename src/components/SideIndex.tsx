import { STOPS } from "../content/timeline";

/** Always-visible index on the right: every section, one click away. The four My Work rooms sit under My Work. */
export function SideIndex({ active }: { active: number }) {
  const cur = STOPS[active];
  const curTop = cur.parent ?? cur.id;
  return (
    <nav className="side-index" aria-label="Sections">
      <ol>
        {STOPS.map((s) => {
          const isCur = s.id === cur.id || (!s.parent && s.id === curTop);
          return (
            <li key={s.id} className={`${s.parent ? "is-sub" : ""}${isCur ? " is-current" : ""}`}>
              <a href={`#${s.id}`} data-to={s.id} aria-current={s.id === cur.id ? "true" : undefined}>
                {!s.parent && <span className="side-index__n">{s.n}</span>}
                <span className="side-index__l">{s.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
