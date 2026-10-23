// Loader UI. The CSS (`sl-*` classes + keyframes) is inlined in index.html so
// the very first splash paints before any JS loads; these components re-use it.

const LINK_A = "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71";
const LINK_B = "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71";

// Full-screen / in-page branded loader (animated chain link inside a glowing ring).
export function BrandLoader({ message = "Loading your vault…", inline = false }) {
  return (
    <div
      className={`sl-loader${inline ? " sl-loader--inline" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="sl-orb">
        <div className="sl-tile">
          <svg className="sl-link" viewBox="0 0 24 24" aria-hidden="true">
            <g className="sl-base">
              <path d={LINK_A} />
              <path d={LINK_B} />
            </g>
            <g className="sl-draw">
              <path pathLength="100" d={LINK_A} />
              <path pathLength="100" d={LINK_B} />
            </g>
          </svg>
        </div>
      </div>

      <div className="sl-brand">
        Link<span>Vault</span>
      </div>

      <div className="sl-bar">
        <i />
      </div>

      <p className="sl-msg">{message}</p>
    </div>
  );
}

// Slim glowing bar under the navbar while data syncs in the background.
export function TopProgress({ active }) {
  return (
    <div className={`sl-topbar${active ? " is-on" : ""}`} aria-hidden="true">
      <i />
    </div>
  );
}

function SkeletonCard({ index, row }) {
  const delay = { animationDelay: `${Math.min(index, 8) * 60}ms` };

  if (row) {
    return (
      <div className="sl-skel flex items-center gap-3" style={{ ...delay, padding: 12 }}>
        <div className="sl-sk w-10 h-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="sl-sk h-3 w-2/5" />
          <div className="sl-sk h-2.5 w-1/4" />
        </div>
        <div className="sl-sk h-6 w-16 hidden sm:block" style={{ borderRadius: 999 }} />
      </div>
    );
  }

  return (
    <div className="sl-skel" style={delay}>
      <div className="flex items-center gap-3">
        <div className="sl-sk w-10 h-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="sl-sk h-3 w-3/4" />
          <div className="sl-sk h-2.5 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="sl-sk h-2.5 w-full" />
        <div className="sl-sk h-2.5 w-5/6" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="sl-sk h-5 w-14" style={{ borderRadius: 999 }} />
        <div className="sl-sk h-5 w-12" style={{ borderRadius: 999 }} />
      </div>
    </div>
  );
}

// Shimmering placeholder cards that match the real grid/list layout.
export function LinkSkeletons({ layout = "grid", count = 8 }) {
  const row = layout !== "grid";

  return (
    <div
      role="status"
      aria-label="Loading your links"
      className={
        row
          ? "flex flex-col gap-2"
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      }
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} index={i} row={row} />
      ))}
    </div>
  );
}
