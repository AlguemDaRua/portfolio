import PaintThemeToggle from "../components/PaintThemeToggle";

export default function Page() {
  return (
    <PaintThemeToggle>
      <main className="demo-content">
        <span className="eyebrow">LIGHT ⇄ DARK · LIVE TEST</span>
        <h1>Paint over the interface.</h1>
        <p className="demo-lede">
          Try the switch. The paint spreads behind this whole sample UI, and the visible details automatically flip to a contrasting color.
        </p>

        <div className="demo-actions">
          <button className="demo-button" type="button">Primary action <span aria-hidden="true">↗</span></button>
          <a className="demo-link" href="#components">Text link <span aria-hidden="true">↓</span></a>
          <span className="state-chip"><i aria-hidden="true" /> THEME SAVES</span>
        </div>

        <section className="demo-grid" id="components" aria-label="Theme contrast samples">
          <article className="demo-card">
            <div className="card-top"><span className="eyebrow">01 / SURFACE</span><span className="card-code">A—01</span></div>
            <h2>Surfaces &amp; borders</h2>
            <p>Cards, outlines, separators, and small labels are part of the same contrast change—not just the headline.</p>
            <div className="sample-row"><span>Interface detail</span><span className="sample-value">VISIBLE</span></div>
            <div className="sample-row"><span>Paint direction</span><span className="sample-value">RANDOM</span></div>
          </article>

          <article className="demo-card">
            <div className="card-top"><span className="eyebrow">02 / CONTROL</span><span className="card-icon" aria-hidden="true">✳</span></div>
            <h2>One persistent switch</h2>
            <p>The light or dark choice is saved, while reduced-motion settings skip the animation.</p>
            <div className="sample-progress" aria-label="Example progress"><span /></div>
            <div className="sample-row"><span>Light / dark</span><span className="sample-value">READY</span></div>
          </article>
        </section>

        <footer className="demo-footer"><span>PAINT TEST / 01</span><span>Click Light or Dark to replay</span></footer>
      </main>
    </PaintThemeToggle>
  );
}
