import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLibraries, getLibraryItems, getThumbUrl } from '../../services/plexApi'
import { useAuthStore } from '../../store/authStore'
import type { PlexMedia } from '../../types/plex'
import { useMealImages } from '../../hooks/useMealImages'
import { useLanguage } from '../../i18n/LanguageContext'

const MOCK_SERIES = [
  { id: 's1', title: 'Kairo Chronicles', seasons: 3, rating: 9.1, genre: 'Sci-Fi', g: 'linear-gradient(160deg,#0a1628,#1a4a8c,#0d2040)', episodes: 24 },
  { id: 's2', title: 'Midnight Protocol', seasons: 2, rating: 8.7, genre: 'Thriller', g: 'linear-gradient(160deg,#100800,#402000,#200e00)', episodes: 16 },
  { id: 's3', title: 'Urban Echoes', seasons: 4, rating: 8.4, genre: 'Drama', g: 'linear-gradient(160deg,#081008,#204020,#101808)', episodes: 40 },
  { id: 's4', title: 'Void Station', seasons: 2, rating: 8.9, genre: 'Sci-Fi', g: 'linear-gradient(160deg,#08080f,#18184a,#08081e)', episodes: 18 },
  { id: 's5', title: 'Red Lagos', seasons: 1, rating: 9.3, genre: 'Drama', g: 'linear-gradient(160deg,#180800,#500000,#280000)', episodes: 8 },
  { id: 's6', title: 'The Network', seasons: 3, rating: 8.2, genre: 'Thriller', g: 'linear-gradient(160deg,#0a0a14,#1a1a40,#0a0a20)', episodes: 30 },
  { id: 's7', title: 'Fracture Lines', seasons: 2, rating: 8.6, genre: 'Drama', g: 'linear-gradient(160deg,#101008,#303018,#181808)', episodes: 20 },
  { id: 's8', title: 'Drift Code', seasons: 1, rating: 7.9, genre: 'Sci-Fi', g: 'linear-gradient(160deg,#001818,#004a4a,#001a1a)', episodes: 10 },
  { id: 's9', title: 'Night Signals', seasons: 5, rating: 8.8, genre: 'Thriller', g: 'linear-gradient(160deg,#060606,#1a1010,#0a0808)', episodes: 50 },
  { id: 's10', title: 'The Inheritance', seasons: 2, rating: 8.3, genre: 'Drama', g: 'linear-gradient(160deg,#0a0800,#302800,#1a1400)', episodes: 16 },
  { id: 's11', title: 'Neon Requiem', seasons: 3, rating: 8.5, genre: 'Sci-Fi', g: 'linear-gradient(160deg,#0a001a,#2a005a,#0a0030)', episodes: 24 },
  { id: 's12', title: 'Ancient Bloodlines', seasons: 2, rating: 9.0, genre: 'Drama', g: 'linear-gradient(160deg,#100008,#400020,#200010)', episodes: 16 },
]

export function Series() {
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
        const showLib = (libs ?? []).find(l => l.type === 'show') ?? (libs ?? [])[1]
        if (showLib) {
          const all = await getLibraryItems(token, showLib.key)
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
        <h1 className="text-xl font-black text-white mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>{t.series.title}</h1>
        <div className="flex gap-2 flex-wrap">
          {t.series.categories.map((cat, idx) => (
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
      <div className="relative rounded-2xl overflow-hidden mb-8 cursor-pointer" style={{ height: '220px', background: 'linear-gradient(135deg,#100800,#402000,#c46a00)' }}>
        {img(50) && <img src={img(50)} alt="Featured" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
        <div className="relative z-10 h-full flex flex-col justify-end p-6">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded mb-2 self-start" style={{ background: 'var(--color-teal)', color: '#000' }}>{t.series.originalSeries}</span>
          <h2 className="text-2xl font-black text-white mb-1">Kairo Chronicles</h2>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>{t.series.seriesInfo}</p>
          <div className="flex gap-3">
            <Link to="/watch/s1" className="flex items-center gap-2 font-bold px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--color-gold)', color: '#000' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
              {t.series.playS1E1}
            </Link>
            <Link to="/media/s1" className="font-semibold px-4 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>
              {t.series.moreInfo}
            </Link>
          </div>
        </div>
      </div>

      {/* Grid */}
      {!loaded ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
          {(displayItems ? displayItems.slice(0, 20) : MOCK_SERIES).map((item, i) => {
            const isReal = 'ratingKey' in item
            const id = isReal ? (item as PlexMedia).ratingKey : (item as typeof MOCK_SERIES[0]).id
            const title = isReal ? (item as PlexMedia).title : (item as typeof MOCK_SERIES[0]).title
            const seasons = isReal ? undefined : (item as typeof MOCK_SERIES[0]).seasons
            const gradient = MOCK_SERIES[i % MOCK_SERIES.length].g
            const thumbSrc = isReal && (item as PlexMedia).thumb ? getThumbUrl(token, (item as PlexMedia).thumb!) : img(51 + i)
            return (
              <Link key={id} to={`/media/${id}`} className="group cursor-pointer block">
                <div className="rounded-xl overflow-hidden relative" style={{ aspectRatio: '2/3', background: gradient }}>
                  {thumbSrc && <img src={thumbSrc} alt={title} className="w-full h-full object-cover" loading="lazy" />}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.9)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21" /></svg>
                    </div>
                  </div>
                  {seasons && (
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.75)', color: 'rgba(255,255,255,0.7)' }}>
                        {seasons} {seasons > 1 ? t.series.seasons : t.series.season}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-white mt-2 truncate">{title}</p>
                {seasons && (
                  <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>
                    {seasons} {seasons > 1 ? t.series.seasonsLabel : t.series.seasonLabel}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
