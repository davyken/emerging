import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLibraries, getLibraryItems, getThumbUrl } from '../../services/plexApi'
import { useAuthStore } from '../../store/authStore'
import type { PlexMedia } from '../../types/plex'
import { useMealImages } from '../../hooks/useMealImages'
import { useLanguage } from '../../i18n/LanguageContext'

const MOCK_FILMS = [
  { id: 'f1', title: 'Stellar Void', year: 2025, rating: 8.2, genre: 'Sci-Fi', g: 'linear-gradient(160deg,#0a1628,#1a4a8c,#0d2040)' },
  { id: 'f2', title: 'Midnight Echoes', year: 2025, rating: 7.9, genre: 'Thriller', g: 'linear-gradient(160deg,#1a0a00,#5a2500,#2a1200)' },
  { id: 'f3', title: 'Velocity Prime', year: 2025, rating: 8.5, genre: 'Action', g: 'linear-gradient(160deg,#1a0000,#5a0000,#2a0000)' },
  { id: 'f4', title: 'Ancient Relics', year: 2024, rating: 7.8, genre: 'Drama', g: 'linear-gradient(160deg,#001a10,#004a2d,#001f14)' },
  { id: 'f5', title: 'The Algorithm', year: 2025, rating: 8.1, genre: 'Sci-Fi', g: 'linear-gradient(160deg,#0a0a1a,#2a2a6a,#0a0a3a)' },
  { id: 'f6', title: 'Red Horizon', year: 2025, rating: 8.7, genre: 'Action', g: 'linear-gradient(160deg,#1a0800,#5a1a00,#2a0e00)' },
  { id: 'f7', title: 'The Threshold', year: 2025, rating: 8.3, genre: 'Sci-Fi', g: 'linear-gradient(160deg,#080818,#18184a,#08081a)' },
  { id: 'f8', title: 'Dusk Drifter', year: 2025, rating: 7.6, genre: 'Drama', g: 'linear-gradient(160deg,#1a1000,#4a2d00,#2a1800)' },
  { id: 'f9', title: 'Orbital Ones', year: 2024, rating: 7.9, genre: 'Sci-Fi', g: 'linear-gradient(160deg,#001818,#004a4a,#001f1f)' },
  { id: 'f10', title: 'Shadow Protocol', year: 2025, rating: 8.0, genre: 'Thriller', g: 'linear-gradient(160deg,#0a0a0a,#2a1a00,#1a0f00)' },
  { id: 'f11', title: 'Neon Requiem', year: 2024, rating: 8.4, genre: 'Drama', g: 'linear-gradient(160deg,#0a001a,#2a005a,#0a0030)' },
  { id: 'f12', title: 'Echo Chamber', year: 2025, rating: 7.7, genre: 'Horror', g: 'linear-gradient(160deg,#050505,#1a0808,#0a0303)' },
  { id: 'f13', title: 'Cascade Effect', year: 2025, rating: 8.6, genre: 'Action', g: 'linear-gradient(160deg,#001a1a,#005a3a,#001a14)' },
  { id: 'f14', title: 'Fractured Sky', year: 2024, rating: 7.5, genre: 'Sci-Fi', g: 'linear-gradient(160deg,#100810,#401040,#200820)' },
  { id: 'f15', title: 'Last Signal', year: 2025, rating: 8.8, genre: 'Thriller', g: 'linear-gradient(160deg,#0a0800,#302000,#1a1000)' },
  { id: 'f16', title: 'Void Runner', year: 2025, rating: 8.1, genre: 'Action', g: 'linear-gradient(160deg,#001020,#003060,#001030)' },
]

export function Films() {
  const token = useAuthStore((s) => s.token) ?? ''
  const { img } = useMealImages()
  const { t } = useLanguage()
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [items, setItems] = useState<PlexMedia[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const libs = await getLibraries(token)
        const movieLib = (libs ?? []).find(l => l.type === 'movie') ?? (libs ?? [])[0]
        if (movieLib) {
          const all = await getLibraryItems(token, movieLib.key)
          setItems(all)
        }
      } catch {}
      setLoaded(true)
    }
    load()
  }, [token])

  const displayItems = items.length > 0 ? items : null

  return (
    <div className="min-h-full p-6" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-black text-white mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>{t.films.title}</h1>
        <div className="flex gap-2 flex-wrap">
          {t.films.categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setCategoryIndex(idx)}
              className="text-xs font-medium px-4 py-1.5 rounded-full transition-all"
              style={{
                background: categoryIndex === idx ? 'var(--color-gold)' : 'rgba(255,255,255,0.07)',
                color: categoryIndex === idx ? '#000' : '#888',
                border: categoryIndex === idx ? 'none' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8 cursor-pointer" style={{ height: '220px', background: 'linear-gradient(135deg,#0a1628,#1a4a8c,#c46a00,#8b4000)' }}>
        {img(30) && <img src={img(30)} alt="Featured" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
        <div className="relative z-10 h-full flex flex-col justify-end p-6">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded mb-2 self-start" style={{ background: 'var(--color-gold)', color: '#000' }}>{t.films.featured}</span>
          <h2 className="text-2xl font-black text-white mb-1">Stellar Void</h2>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>2025 · Sci-Fi · ⭐ 8.2 · 2h 14m</p>
          <div className="flex gap-3">
            <Link to="/watch/f1" className="flex items-center gap-2 font-bold px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--color-gold)', color: '#000' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
              {t.films.playNow}
            </Link>
            <Link to="/media/f1" className="font-semibold px-4 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>
              {t.films.moreInfo}
            </Link>
          </div>
        </div>
      </div>

      {/* Films grid */}
      {!loaded ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
          {(displayItems ?? MOCK_FILMS).map((item, i) => {
            const isReal = 'ratingKey' in item
            const id = isReal ? (item as PlexMedia).ratingKey : (item as typeof MOCK_FILMS[0]).id
            const title = isReal ? (item as PlexMedia).title : (item as typeof MOCK_FILMS[0]).title
            const year = isReal ? (item as PlexMedia).year : (item as typeof MOCK_FILMS[0]).year
            const rating = isReal ? (item as PlexMedia).rating : (item as typeof MOCK_FILMS[0]).rating
            const gradient = MOCK_FILMS[i % MOCK_FILMS.length].g
            const thumbSrc = isReal && (item as PlexMedia).thumb ? getThumbUrl(token, (item as PlexMedia).thumb!) : img(31 + i)
            return (
              <Link key={id} to={`/media/${id}`} className="group cursor-pointer block">
                <div className="rounded-xl overflow-hidden relative" style={{ aspectRatio: '2/3', background: gradient }}>
                  {thumbSrc && <img src={thumbSrc} alt={title} className="w-full h-full object-cover" loading="lazy" />}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.9)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21" /></svg>
                    </div>
                  </div>
                  {rating && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--color-gold)' }}>★ {Number(rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-white mt-2 truncate">{title}</p>
                {year && <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>{year}</p>}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
