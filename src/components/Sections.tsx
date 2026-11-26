import { site } from "../content/site";
import { GAMES } from "../content/games";
import { UX_PROJECTS } from "../content/uiux";
import { FILMS } from "../content/films";
import { ExperienceStage } from "./ExperienceStage";
import { BeyondStage } from "./BeyondStage";
import { EducationStats } from "./EducationStats";
import type { StopId } from "../content/timeline";

type Reg = (id: StopId) => (el: HTMLElement | null) => void;

/** One layer per film stop. Each fades and rises in as the camera arrives (--v from 0 to 1). */
export function Sections({ register }: { register: Reg }) {
  const h = site.home;
  const a = site.about;
  return (
    <>
      {/* 01 HOME — the approved panel */}
      <section ref={register("home")} className="layer layer--home" aria-label="Home">
        <div className="home-panel">
          <h1 className="home-panel__headline">
            <span>{h.headlineA}</span>
            <span>
              {h.headlineB} <em>{h.headlineEm}</em>
            </span>
          </h1>
          <div className="home-panel__copy">
            <span className="dash" aria-hidden="true" />
            <p className="home-panel__statement">
              {h.statement.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </p>
          </div>
          <div className="home-panel__copy">
            <span className="dash" aria-hidden="true" />
            <p className="home-panel__desc">{h.description}</p>
          </div>
          <ol className="home-panel__index">
            {h.index.map((i) => (
              <li key={i.label}>
                <a href={`#${i.to}`} data-to={i.to}>
                  <span className="n">{i.n}</span>
                  <span className="l">{i.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
        <a className="scroll-cue" href="#about" data-to="about" aria-label="Scroll to begin">
          <svg viewBox="0 0 24 14" width="24" height="14" aria-hidden="true">
            <path d="M1 1l11 11L23 1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </a>
      </section>

      {/* 02 ABOUT */}
      <section ref={register("about")} className="layer layer--about" aria-labelledby="about-title">
        <div className="card card--left">
          <p className="kicker">{a.kicker}</p>
          <h2 id="about-title" className="title">
            {a.titleA} <em>{a.titleB}</em>
          </h2>
          {a.bio.map((p) => (
            <p key={p} className="body">
              {p}
            </p>
          ))}
          <dl className="facts">
            {a.facts.map((f) => (
              <div key={f.k}>
                <dt>{f.k}</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="photos">
          {(a.photos.length ? a.photos : a.photoSlots.map((s) => ({ src: "", alt: s }))).map((p, i) => (
            <figure key={i} className={`photo photo--${i + 1}${p.src ? "" : " is-empty"}`}>
              {p.src ? <img src={p.src} alt={p.alt} /> : <figcaption>{p.alt}</figcaption>}
            </figure>
          ))}
        </div>
      </section>

      {/* 03 MY WORK — overview */}
      <section ref={register("work")} className="layer layer--work" aria-labelledby="work-title">
        <div className="card card--low">
          <p className="kicker">{site.work.kicker}</p>
          <h2 id="work-title" className="title">
            {site.work.title}
          </h2>
          <p className="body">{site.work.line}</p>
          <ul className="chips">
            {(["aifilm", "games", "uiux", "electronics"] as const).map((b) => (
              <li key={b}>
                <a href={`#${b}`} data-to={b}>
                  {site.bays[b].title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* the four rooms */}
      {(["aifilm", "games", "uiux", "electronics"] as const).map((b) => (
        <section key={b} ref={register(b)} className={`layer layer--bay layer--${b}`} aria-labelledby={`${b}-title`}>
          <div className="card card--bay">
            <p className="kicker">03 — My Work · {b === "aifilm" ? `${FILMS.length} films` : b === "games" ? `${GAMES.length} games` : b === "uiux" ? `${UX_PROJECTS.length} projects` : site.bays[b].count}</p>
            <h2 id={`${b}-title`} className="title">
              {site.bays[b].title}
            </h2>
            <p className="body">{site.bays[b].text}</p>
            {b === "aifilm" || b === "games" || b === "uiux" || b === "electronics" ? (
              <button type="button" className="enter enter--open" data-room={b}>
                <span>{site.enterLabel}</span>
                <small>{b === "games" ? site.enterGames : b === "uiux" ? site.enterUiux : b === "electronics" ? site.enterElectronics : site.enterFilms}</small>
                <i aria-hidden="true" />
              </button>
            ) : (
              <button type="button" className="enter" aria-disabled="true" title={site.enterSoon}>
                <span>{site.enterLabel}</span>
                <small>{site.enterSoon}</small>
              </button>
            )}
          </div>
        </section>
      ))}

      {/* 04 EXPERIENCE */}
      <section ref={register("experience")} className="layer layer--experience" aria-labelledby="exp-title">
        <div className="card card--left card--high">
          <p className="kicker">{site.experience.kicker}</p>
          <h2 id="exp-title" className="title">
            {site.experience.title}
          </h2>
          <p className="meta">{site.experience.org}</p>
          <p className="body">{site.experience.line}</p>
        </div>
        <ExperienceStage />
      </section>

      {/* 05 EDUCATION */}
      <section ref={register("education")} className="layer layer--education" aria-labelledby="edu-title">
        <div className="edu-wrap">
          <div className="edu-pair">
          <div className="card edu-card edu-card--left">
            <p className="kicker" id="edu-title">
              {site.education.kicker}
            </p>
            <ol className="timeline">
              {site.education.rows.map((r) => (
                <li key={r.title}>
                  <span className="when">{r.when}</span>
                  <span className="what">{r.title}</span>
                  <span className="where">{r.place}</span>
                </li>
              ))}
            </ol>
            <p className="kicker edu-sub">{site.education.leadKicker}</p>
            <p className="edu-lead">{site.education.leadRole}</p>
            <p className="edu-note">{site.education.leadText}</p>
            <p className="edu-lang">{site.education.languages.join("  ·  ")}</p>
          </div>

          <div className="card edu-card edu-card--right">
            <p className="kicker">{site.education.skillsKicker}</p>
            <div className="skill-groups">
              {site.education.skills.map((g, gi) => (
                <div className="skill-group" key={g.group} style={{ ["--i" as string]: gi }}>
                  <h3>{g.group}</h3>
                  <ul className="chips chips--plain">
                    {g.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="kicker edu-sub">{site.education.projectsKicker}</p>
            <ul className="edu-projects">
              {site.education.projects.map((p) => (
                <li key={p.title}>
                  <b>{p.title}</b>
                </li>
              ))}
            </ul>
          </div>
          </div>

          <EducationStats />
        </div>
      </section>

      {/* 06 BEYOND WORK */}
      <section ref={register("beyond")} className="layer layer--beyond" aria-labelledby="beyond-title">
        <div className="card card--top">
          <p className="kicker">{site.beyond.kicker}</p>
          <h2 id="beyond-title" className="title">
            {site.beyond.title}
          </h2>
          <p className="body">{site.beyond.line}</p>
          <ul className="chips chips--plain">
            {site.beyond.sports.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <BeyondStage />
      </section>

      {/* 07 CONTACT */}
      <section ref={register("contact")} className="layer layer--contact" aria-labelledby="contact-title">
        <div className="card card--sky">
          <p className="kicker">{site.contact.kicker}</p>
          <h2 id="contact-title" className="title title--big">
            {site.contact.title}
          </h2>
          <a className="email" href={`mailto:${site.contact.email}`}>
            {site.contact.email}
          </a>
          <ul className="links">
            {site.contact.links.map((l) =>
              l.href ? (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                </li>
              ) : (
                <li key={l.label} className="is-todo">
                  {l.label}
                </li>
              ),
            )}
          </ul>
          <a className="cta" href={`mailto:${site.contact.email}`}>
            {site.contact.cta}
          </a>
        </div>
        <footer className="foot">{site.contact.footer}</footer>
      </section>
    </>
  );
}
