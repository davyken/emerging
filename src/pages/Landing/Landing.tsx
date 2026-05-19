import { Link } from 'react-router-dom'

const SIMILAR = [
  { id: '1', title: 'Stellar Void', year: '2025', rating: '8.2', gradient: 'linear-gradient(135deg,#0a1628,#1a3a5c,#0d2b4a)' },
  { id: '2', title: 'Nea Chroma', year: '2025', rating: '7.8', gradient: 'linear-gradient(135deg,#1a0a28,#3d1a5c,#2a0d4a)' },
  { id: '3', title: 'Dusk Drifter', year: '2025', rating: '8.5', gradient: 'linear-gradient(135deg,#1a1000,#4a2d00,#2a1800)' },
  { id: '4', title: 'Orbital Ones', year: '2024', rating: '7.9', gradient: 'linear-gradient(135deg,#001a10,#004a2d,#001f14)' },
  { id: '5', title: 'Red Horizon', year: '2025', rating: '8.1', gradient: 'linear-gradient(135deg,#1a0500,#4a1500,#2a0800)' },
  { id: '6', title: 'The Threshold', year: '2025', rating: '8.7', gradient: 'linear-gradient(135deg,#0a0a1a,#1a1a4a,#0a0a2a)' },
]

const CAST = [
  { name: 'Adrian Pierce', role: 'Garde Ultime' },
  { name: 'Elena Thorne', role: 'Lyra Brokenaya' },
  { name: 'Marcus Sterling', role: 'Le Grand Conflit' },
  { name: 'Sarah Lawden', role: 'Nova Protea' },
]

function NavBar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center gap-6 px-8 h-14"
      style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
    >
      <img src="/logo.png" alt="EmergingStream" className="flex-shrink-0" style={{ height: '28px', width: 'auto' }} />
      <nav className="flex items-center gap-5 flex-1">
        {['Accueil', 'Films', 'Séries TV', 'Direct TV', 'Ma Liste'].map((item, i) => (
          <a
            key={item}
            href="#"
            className="text-sm font-medium transition-colors"
            style={{ color: i === 1 ? 'var(--color-gold)' : 'rgba(255,255,255,0.7)', borderBottom: i === 1 ? '2px solid var(--color-gold)' : 'none', paddingBottom: '2px' }}
          >
            {item}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Recherchez des titres..."
            className="text-sm text-white pl-8 pr-3 py-1.5 rounded-lg outline-none w-44"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" /></svg>
        </button>
        <button className="text-gray-400 hover:text-white transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
        </button>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--color-gold)', color: '#000' }}>U</div>
        <Link
          to="/login"
          className="text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          style={{ background: 'var(--color-gold)', color: '#000' }}
        >
          Connexion
        </Link>
      </div>
    </header>
  )
}

export function Landing() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', color: 'white' }}>
      <NavBar />

      {/* HERO */}
      <section
        className="relative w-full pt-14"
        style={{ minHeight: '85vh' }}
      >
        {/* Sci-fi landscape background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 120% 60% at 70% 0%, #2a1400 0%, #6b3000 15%, #c46200 25%, #8b4000 35%, #3d1800 50%, #1a0800 65%, #0a0a0a 85%)
            `,
          }}
        />
        {/* Tower silhouettes */}
        <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: 'none' }}>
          {[
            { left: '45%', height: '55%', width: '18px', bottom: '30%' },
            { left: '52%', height: '65%', width: '12px', bottom: '30%' },
            { left: '60%', height: '48%', width: '22px', bottom: '30%' },
            { left: '66%', height: '58%', width: '14px', bottom: '30%' },
            { left: '72%', height: '42%', width: '20px', bottom: '30%' },
          ].map((t, i) => (
            <div key={i} className="absolute" style={{ left: t.left, bottom: t.bottom, width: t.width, height: t.height, background: 'linear-gradient(to top, #0a0500 0%, #1a0d00 60%, transparent 100%)', borderRadius: '2px 2px 0 0' }} />
          ))}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, #0a0a0a 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 px-10 pt-24 pb-16 max-w-2xl">
          <div className="flex gap-2 mb-3 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <span style={{ background: 'var(--color-gold)', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '10px' }}>LONG MÉTRAGE</span>
            <span>⭐ 9.1</span><span>·</span><span>2025</span><span>·</span><span>2h44</span>
          </div>
          <h1 className="text-5xl font-black mb-4 leading-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            AEON: ASCENSION
          </h1>
          <div className="flex flex-wrap gap-2 mb-5">
            {['Sci-Fi', 'Syfy', 'Action'].map(g => (
              <span key={g} className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>{g}</span>
            ))}
            <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: 'var(--color-teal)', color: '#000' }}>Regarder Maintenant</span>
          </div>
          <p className="text-sm leading-relaxed mb-8 max-w-xl" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Dans un futur où les étoiles sont explorées par tour les rampers, un navigateur
            direct-shot mener un équipage de pris aux confins de la galaxie pour
            empêcher l'effondrement du temps lui-même. Voici l'événement
            cinématographique définitif de la décennie.
          </p>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 font-bold px-6 py-3 rounded-lg text-sm transition-colors" style={{ background: 'var(--color-gold)', color: '#000' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
              REGARDER MAINTENANT
            </button>
            <button className="flex items-center gap-2 font-semibold px-6 py-3 rounded-lg text-sm transition-colors" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
              + MA LISTE
            </button>
            <button className="flex items-center justify-center w-11 h-11 rounded-lg transition-colors" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            </button>
          </div>
        </div>
      </section>

      {/* DISTRIBUTION + 4K */}
      <section className="px-10 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-base font-bold mb-6" style={{ color: 'var(--color-gold)' }}>
            | Distribution
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {CAST.map((c) => (
              <div key={c.name} className="flex flex-col items-center text-center gap-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: 'linear-gradient(135deg,#2a1a00,#4a3000)', border: '2px solid rgba(201,168,76,0.3)' }}>
                  {c.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{c.name}</p>
                  <p className="text-xs" style={{ color: '#666' }}>{c.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Détails */}
          <div className="mt-10">
            <h2 className="text-base font-bold mb-5" style={{ color: 'var(--color-gold)' }}>| Détails</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'RÉALISATION', value: 'ERWIN VANDANAS' },
                { label: 'SCÉNARISTE', value: 'JAY QUARRIE' },
                { label: 'MUSIQUE', value: 'THORIN STEEL' },
                { label: 'NOTE', value: 'PA-13' },
              ].map((d) => (
                <div key={d.label}>
                  <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: '#555' }}>{d.label}</p>
                  <p className="text-sm font-semibold text-white">{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4K Card */}
        <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-bold text-white">Disponible en 4K</p>
          <p className="text-xs leading-relaxed" style={{ color: '#888' }}>
            Regardez Aeon: Ascension en Ultra Haute Définition avec Dolby Vision et bénéficiez d'une expérience cinéma ultime à la maison.
          </p>
          <button className="w-full font-bold py-2.5 rounded-lg text-sm mt-2 transition-colors" style={{ background: 'var(--color-teal)', color: '#000' }}>
            S'ABONNER 4K UHD
          </button>

          <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-bold text-white mb-2">Critiques récentes</p>
            <div className="flex gap-0.5 mb-2">
              {[1,2,3,4].map(i => <span key={i} style={{ color: 'var(--color-gold)' }}>★</span>)}
              <span style={{ color: '#444' }}>★</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#777' }}>
              "Un chef-d'œuvre cinématographique absolu qui redéfinit la science-fiction moderne."
            </p>
          </div>
        </div>
      </section>

      {/* SIMILAR CONTENT */}
      <section className="px-10 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Contenus similaires</h2>
          <button className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-gold)' }}>VOIR PLUS →</button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {SIMILAR.map((m) => (
            <div key={m.id} className="cursor-pointer group">
              <div className="rounded-xl overflow-hidden mb-2" style={{ aspectRatio: '2/3', background: m.gradient }}>
                <div className="w-full h-full flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                </div>
              </div>
              <p className="text-xs font-semibold text-white truncate">{m.title}</p>
              <p className="text-[10px]" style={{ color: '#555' }}>{m.year} · ⭐ {m.rating}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-10 py-12 mt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <img src="/logo.png" alt="EmergingStream" className="mb-3" style={{ height: '30px', width: 'auto' }} />
            <p className="text-xs leading-relaxed" style={{ color: '#555' }}>
              La destination ultime pour des expériences cinématographiques premium. Diffusez les dernières blockbusters et les séries originales exclusives en 4K UHD.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#888' }}>Explorer</p>
            {['Films', 'Séries TV', 'Direct TV'].map(l => (
              <a key={l} href="#" className="block text-xs mb-2 transition-colors hover:text-white" style={{ color: '#555' }}>{l}</a>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#888' }}>Support</p>
            {["Centre d'aide", 'Nous contacter', 'Appareils'].map(l => (
              <a key={l} href="#" className="block text-xs mb-2 transition-colors hover:text-white" style={{ color: '#555' }}>{l}</a>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#888' }}>Légal</p>
            {["Conditions d'utilisation", 'Politique de confidentialité', 'Cookies'].map(l => (
              <a key={l} href="#" className="block text-xs mb-2 transition-colors hover:text-white" style={{ color: '#555' }}>{l}</a>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
          <p className="text-[10px]" style={{ color: '#444' }}>© 2025 EmergingStream Global Entertainment. Tous droits réservés.</p>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest" style={{ color: '#333' }}>※ ≋ ψ PIRAGRAM</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
