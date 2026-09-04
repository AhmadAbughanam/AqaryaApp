import {useEffect} from 'react';
import {Link} from 'react-router-dom';
import {AppImages} from '../../assets/images';
import {useAuth} from '../../store/AuthContext';

const LAYERS = [
  {
    n: '01',
    name: 'Identity',
    body: 'SANAD digital identity gates any action that carries legal or financial weight. Browsing stays open.',
  },
  {
    n: '02',
    name: 'Source',
    body: 'Every listing is tied to an authoritative record, with one registry reference per parcel.',
  },
  {
    n: '03',
    name: 'Service',
    body: 'Structured buy, sell, rent and lease flows that run with the competent authorities, not around them.',
  },
  {
    n: '04',
    name: 'Audit',
    body: 'A tamper-evident timeline of every approval, offer and change to the record.',
  },
];

const GAPS = [
  {
    t: 'Unverified sources',
    b: 'No direct link between an advert and a source-authenticated owner or licensed agent.',
  },
  {
    t: 'A broken journey',
    b: 'Search, calls, office visits, paperwork and payment each live on a separate channel.',
  },
  {
    t: 'Scattered records',
    b: 'Ownership, registration and payments sit with different bodies, with no single operational view.',
  },
];

const NOT = [
  'Not an ads marketplace',
  'Never holds client funds',
  'Not an investment platform',
  'Does not replace the land registry',
];

const STATS = [
  {v: '≈500k', l: 'dunum — total Umrah area'},
  {v: '40k', l: 'dunum — phase one'},
  {v: '2026–29', l: 'core build period'},
];

export function LandingPage() {
  const {role} = useAuth();
  const demoTo = role ? (role === 'admin' ? '/admin' : '/app') : '/login';
  const demoLabel = role ? 'Resume the demo' : 'Try the live demo';

  useEffect(() => {
    document.title = 'Aqarya — the digital land record for Jordan';
  }, []);

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-nav__inner">
          <span className="lp-mark">Aqarya</span>
          <Link className="lp-navcta" to={demoTo}>
            Open demo
          </Link>
        </div>
      </header>

      <section className="lp-hero">
        <img aria-hidden="true" className="lp-hero__map" src={AppImages.backgrounds.jordanMap} alt="" />
        <div className="lp-wrap lp-hero__inner">
          <span className="lp-tag">Umrah pilot · 2026</span>
          <h1>The digital land record for Jordan.</h1>
          <p>
            One verified path from search to signed contract — identity, source and an
            audit trail in a single flow.
          </p>
          <div className="lp-hero__cta">
            <Link className="button button--primary" to={demoTo}>
              {demoLabel} →
            </Link>
            <a className="lp-textlink" href="#how">
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <span className="eyebrow">The gap</span>
          <h2>The journey is split across channels that don&rsquo;t share data.</h2>
          <div className="lp-grid lp-grid--3">
            {GAPS.map(item => (
              <article className="lp-card" key={item.t}>
                <h3>{item.t}</h3>
                <p>{item.b}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--tint" id="how">
        <div className="lp-wrap">
          <span className="eyebrow">The layer</span>
          <h2>Aqarya makes the source verifiable before anything is published.</h2>
          <div className="lp-grid lp-grid--2">
            {LAYERS.map(layer => (
              <article className="lp-layer" key={layer.n}>
                <span className="lp-layer__n">{layer.n}</span>
                <div>
                  <h3>{layer.name}</h3>
                  <p>{layer.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-not">
        <div className="lp-wrap lp-not__inner">
          {NOT.map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap lp-credential">
          <div>
            <span className="eyebrow">Source-authenticated</span>
            <h2>Every property carries a verifiable record.</h2>
            <p className="lp-lead">
              Ownership and identity are checked against the registry, then the record is
              sealed. Payment and registration stay with the competent authorities.
            </p>
          </div>
          <article className="lp-record">
            <span className="lp-record__seal">✦</span>
            <span className="eyebrow">Verified property record</span>
            <ul>
              <li>
                <i />Property check <b>Verified</b>
              </li>
              <li>
                <i />Identity check <b>Verified</b>
              </li>
              <li>
                <i />Record <b>Sealed</b>
              </li>
            </ul>
            <div className="lp-record__meta mono">AQ-7F8DD31F · aqarya-vrf-sale-001</div>
          </article>
        </div>
      </section>

      <section className="lp-section lp-section--tint">
        <div className="lp-wrap">
          <span className="eyebrow">Umrah</span>
          <h2>Designed from zero, for a city built from zero.</h2>
          <p className="lp-lead">
            State-owned land under phased development — a chance to set one standard for the
            record before old systems accumulate.
          </p>
          <div className="lp-stats">
            {STATS.map(stat => (
              <div key={stat.l}>
                <strong>{stat.v}</strong>
                <span>{stat.l}</span>
              </div>
            ))}
          </div>
          <p className="lp-cite">Sources: Council of Ministers; JCDCF — 2025.</p>
        </div>
      </section>

      <section className="lp-cta">
        <div className="lp-wrap lp-cta__inner">
          <h2>See it working.</h2>
          <p>
            A demonstration build. Enter with SANAD as a citizen, or as an admin — no
            password.
          </p>
          <Link className="button button--primary" to={demoTo}>
            {demoLabel} →
          </Link>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap lp-foot__inner">
          <span className="lp-mark">Aqarya</span>
          <p>
            Demonstration build · 2026. A proposal for discussion — SANAD, the land registry
            and payment channels are represented, not connected.
          </p>
        </div>
      </footer>
    </div>
  );
}
