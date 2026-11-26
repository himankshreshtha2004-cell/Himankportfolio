/* ==========================================================================
   ELECTRONICS ROOM — "Step inside" the Electronics bay.

   Same tunnel as the other rooms; inside, Himank's electronics UI (the
   folder, the project pages, the research reports, the footage) is part of
   this site's own code (src/electronics), not a frame or a link.
   Close, Esc (when nothing inside the UI is open) or the browser's Back leave.
   ========================================================================== */
import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { RINGS, tunnelIn, tunnelOut } from "./tunnel";

// the archive is its own chunk: it is only fetched when this room opens
const ElectronicsApp = lazy(() => import("../electronics/App"));

type Props = {
  apiRef: React.MutableRefObject<{ close: () => void } | null>;
  onExit: () => void;
  onRequestClose: () => void;
};

export function ElectronicsRoom({ apiRef, onExit, onRequestClose }: Props) {
  const [ready, setReady] = useState(false); // the room has finished opening: only then is the archive loaded
  const panel = useRef<HTMLDivElement>(null);
  const tunnel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const leaving = useRef(false);

  useLayoutEffect(() => {
    void tunnelIn(panel.current!, tunnel.current!).then(() => {
      setReady(true);
      closeBtn.current?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
    });
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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // while the archive has something open (a report, a video, the project tray) Esc closes that first
      if (panel.current?.querySelector('[data-elec-root] [role="dialog"], [data-elec-root] [data-esc-busy]')) return;
      e.preventDefault();
      onRequestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRequestClose]);

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

      <div className="room room--elec" ref={panel} role="dialog" aria-modal="true" aria-labelledby="room-title">
        <header className="elec__top">
          <p className="elec__brand">
            <span id="room-title">[ ELECTRONICS ]</span>
            <small>03 — My Work · project archive</small>
          </p>
          <button ref={closeBtn} type="button" className="room__close" onClick={onRequestClose}>
            <span>Close</span>
            <i aria-hidden="true" />
          </button>
        </header>
        <div className="elec__stage">
          {ready && (
            <Suspense fallback={<p className="elec__wait" role="status">Opening…</p>}>
              <ElectronicsApp />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
