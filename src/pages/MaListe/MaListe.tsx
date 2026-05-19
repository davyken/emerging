import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMealImages } from '../../hooks/useMealImages'

const MOCK_SAVED = [
  { id: 'f1', title: 'Stellar Void', year: 2025, type: 'Film', g: 'linear-gradient(160deg,#0a1628,#1a4a8c,#0d2040)' },
  { id: 's1', title: 'Kairo Chronicles', year: 2024, type: 'Série', g: 'linear-gradient(160deg,#100800,#402000,#200e00)' },
  { id: 'f3', title: 'Velocity Prime', year: 2025, type: 'Film', g: 'linear-gradient(160deg,#1a0000,#5a0000,#2a0000)' },
  { id: 's5', title: 'Red Lagos', year: 2025, type: 'Série', g: 'linear-gradient(160deg,#180800,#500000,#280000)' },
]

type ViewMode = 'grid' | 'list'

export function MaListe() {
  const { img } = useMealImages()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [saved, setSaved] = useState(MOCK_SAVED)

  function remove(id: string) {
    setSaved((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="min-h-full p-6" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Ma Liste</h1>
          <p className="text-xs mt-1" style={{ color: '#555' }}>{saved.length} titre{saved.length !== 1 ? 's' : ''} sauvegardé{saved.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className="p-2 rounded-lg transition-colors"
            style={{ background: viewMode === 'grid' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode === 'grid' ? 'white' : '#555' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="p-2 rounded-lg transition-colors"
            style={{ background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode === 'list' ? 'white' : '#555' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {saved.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-white mb-2">Votre liste est vide</h2>
          <p className="text-sm max-w-xs mb-6" style={{ color: '#555' }}>Parcourez le catalogue et ajoutez vos films et séries préférés ici.</p>
          <Link
            to="/accueil"
            className="font-bold px-6 py-2.5 rounded-lg text-sm"
            style={{ background: 'var(--color-gold)', color: '#000' }}
          >
            Parcourir le catalogue
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
          {saved.map((item, i) => (
            <div key={item.id} className="group cursor-pointer relative">
              <Link to={`/media/${item.id}`} className="block">
                <div className="rounded-xl overflow-hidden relative" style={{ aspectRatio: '2/3', background: item.g }}>
                  {img(70 + i) && <img src={img(70 + i)} alt={item.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.9)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21" /></svg>
                    </div>
                  </div>
                </div>
                <p className="text-xs font-medium text-white mt-2 truncate">{item.title}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>{item.year} · {item.type}</p>
              </Link>
              <button
                onClick={() => remove(item.id)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex"
                style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {saved.map((item, i) => (
            <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl group transition-colors" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Link to={`/media/${item.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                <div className="rounded-lg overflow-hidden flex-shrink-0 relative" style={{ width: 48, height: 72, background: item.g }}>
                  {img(70 + i) && <img src={img(70 + i)} alt={item.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#555' }}>{item.year} · {item.type}</p>
                </div>
              </Link>
              <Link to={`/watch/${item.id}`} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0" style={{ background: 'var(--color-gold)', color: '#000' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                Lire
              </Link>
              <button onClick={() => remove(item.id)} className="p-1.5 rounded-lg transition-colors flex-shrink-0" style={{ color: '#555' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
