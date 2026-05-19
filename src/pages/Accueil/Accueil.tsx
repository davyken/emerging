import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getRecentlyAdded, getLibraries, getLibraryItems, getThumbUrl } from '../../services/plexApi'
import { useAuthStore } from '../../store/authStore'
import type { PlexMedia } from '../../types/plex'
import { useMealImages } from '../../hooks/useMealImages'
import { getMealImagePool, getRandomFeaturedShow, type FeaturedShow } from '../../services/mealDbApi'
import { useLanguage } from '../../i18n/LanguageContext'

const GRADIENTS = [
  'linear-gradient(160deg,#0a1a2a,#1a4a6a,#0a2030)',
  'linear-gradient(160deg,#1a0f00,#5a2800,#2a1200)',
  'linear-gradient(160deg,#050a14,#0f2040,#050a1c)',
  'linear-gradient(160deg,#0a1408,#1a3a10,#081008)',
  'linear-gradient(160deg,#1a0a1a,#4a1060,#1a0830)',
  'linear-gradient(160deg,#140800,#4a2000,#200e00)',
  'linear-gradient(160deg,#001414,#003030,#001010)',
  'linear-gradient(160deg,#0a0a14,#20204a,#080818)',
]

const MOCK_TRENDING = [
  { id: 'm1', title: 'Shadow of the Void', gradient: GRADIENTS[0] },
  { id: 'm2', title: 'Midnight Echoes', gradient: GRADIENTS[1] },
  { id: 'm3', title: 'Velocity Prime', gradient: GRADIENTS[2] },
  { id: 'm4', title: 'Ancient Relics', gradient: GRADIENTS[3] },
  { id: 'm5', title: 'The Algorithm', gradient: GRADIENTS[4] },
]

const MOCK_AFRICAN = [
  { id: 'a1', title: 'Fils du Soleil', gradient: 'linear-gradient(180deg,#1a1000,#3a2200,#8b4500)', featured: true },
  { id: 'a2', title: 'Kemet Rising', gradient: 'linear-gradient(160deg,#200000,#600010,#300008)' },
  { id: 'a3', title: 'Ubuntu Protocol', gradient: 'linear-gradient(160deg,#001020,#003060,#001030)' },
  { id: 'a4', title: 'Nile Chronicles', gradient: 'linear-gradient(160deg,#080808,#1a1a1a,#0f0f0f)' },
  { id: 'a5', title: 'Lagos 2099', gradient: 'linear-gradient(160deg,#0a1408,#204010,#102008)' },
  { id: 'a6', title: 'Okoye', gradient: 'linear-gradient(160deg,#1a0a00,#503000,#2a1800)' },
]

const MOCK_RECENT = [
  { id: 'r1', title: 'Abyssal Pulse', year: '4h 23m', rating: 'Thriller', gradient: GRADIENTS[5] },
  { id: 'r2', title: 'Nite Mast', year: '2h', rating: 'Action', gradient: GRADIENTS[6] },
  { id: 'r3', title: 'Temporal Shift', year: '2h 10m', rating: 'Mystery', gradient: GRADIENTS[7] },
]

interface CardProps { id: string; title: string; gradient: string; token?: string; media?: PlexMedia; size?: 'sm' | 'md'; imgSrc?: string }

function PosterCard({ id, title, gradient, token, media, size = 'md', imgSrc }: CardProps) {
  const width = size === 'sm' ? 100 : 120
  const thumbSrc = media?.thumb && token ? getThumbUrl(token, media.thumb) : (imgSrc ?? null)
  return (
    <Link to={media ? `/media/${media.ratingKey}` : `/media/${id}`} className="flex-shrink-0 group cursor-pointer block">
      <div className="rounded-xl overflow-hidden relative" style={{ width, aspectRatio: '2/3', background: gradient }}>
        {thumbSrc && <img src={thumbSrc} alt={title} className="w-full h-full object-cover" loading="lazy" />}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.9)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21" /></svg>
          </div>
        </div>
      </div>
      <p className="text-xs font-medium text-white mt-1.5 truncate" style={{ maxWidth: width }}>{title}</p>
    </Link>
  )
}

export function Accueil() {
  const token = useAuthStore((s) => s.token) ?? ''
  const navigate = useNavigate()
  const { img } = useMealImages()
  const { t } = useLanguage()
  const [trending, setTrending] = useState<PlexMedia[]>([])
  const [recent, setRecent] = useState<PlexMedia[]>([])
  const [hero, setHero] = useState<PlexMedia | null>(null)
  const [featuredShow, setFeaturedShow] = useState<FeaturedShow | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [libs, recentItems] = await Promise.all([
          getLibraries(token).catch(() => []),
          getRecentlyAdded(token).catch(() => []),
        ])
        setRecent(recentItems ?? [])
        setHero((recentItems ?? [])[0] ?? null)
        if ((libs ?? []).length > 0) {
          const items = await getLibraryItems(token, (libs ?? [])[0].key).catch(() => [])
          setTrending(items.slice(0, 8))
        }
      } catch {}
    }
    load()
  }, [token])

  useEffect(() => {
    getMealImagePool().then(() => setFeaturedShow(getRandomFeaturedShow()))
  }, [])

  const plexThumb = hero?.thumb ? getThumbUrl(token, hero.thumb) : null
  const heroImage = plexThumb ?? featuredShow?.backdropUrl ?? null
  const heroTitle = hero?.title ?? featuredShow?.title ?? 'THE RISE OF KAIRO'
  const heroSummary = hero?.summary ?? featuredShow?.summary ?? 'In a near-future Lagos, a brilliant architect uncovers a conspiracy that threatens to rewrite the history of the continent. A visual masterpiece of tech and tradition.'
  const heroGenre = featuredShow?.genres[0] ?? 'Original'
  const heroRating = hero?.rating ?? featuredShow?.rating

  return (
    <div className="min-h-full" style={{ background: '#0a0a0a' }}>

      {/* HERO */}
      <div className="relative overflow-hidden" style={{ height: '52vh', minHeight: '340px' }}>
        {heroImage
          ? <img src={heroImage} alt={heroTitle} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center top' }} />
          : <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 130% 80% at 65% 0%, #2a1500 0%, #8b4500 18%, #c46a00 28%, #6b3500 42%, #1a0800 60%, #0a0a0a 80%)' }} />
        }

        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to right, rgba(10,10,10,0.93) 30%, rgba(10,10,10,0.55) 65%, rgba(10,10,10,0.15) 100%)'
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.5) 35%, transparent 70%)'
        }} />

        <div className="relative z-10 h-full flex flex-col justify-end px-4 sm:px-7 pb-6 sm:pb-8">
          <div className="inline-flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: '#2a9a2a', color: 'white' }}>{t.accueil.trendingBadge}</span>
            {heroGenre && <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{heroGenre}</span>}
            {heroRating && <span className="text-[10px] font-bold" style={{ color: 'var(--color-gold)' }}>★ {Number(heroRating).toFixed(1)}</span>}
          </div>
          <h1 className="text-4xl font-black mb-2 leading-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {heroTitle.toUpperCase()}
          </h1>
          <p className="text-sm leading-relaxed mb-5 max-w-sm" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>
            {heroSummary.slice(0, 160)}{heroSummary.length > 160 ? '...' : ''}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(hero ? `/watch/${hero.ratingKey}` : '/watch/demo')}
              className="flex items-center gap-2 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
              style={{ background: 'var(--color-gold)', color: '#000' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
              {t.accueil.playNow}
            </button>
            <button
              onClick={() => navigate(hero ? `/media/${hero.ratingKey}` : '/media/demo')}
              className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {t.accueil.moreInfo}
            </button>
          </div>
        </div>
      </div>

      {/* TRENDING NOW */}
      <div className="px-4 sm:px-7 pt-5 sm:pt-7 pb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">{t.accueil.trendingNow}</h2>
          <Link to="/films" className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-gold)' }}>{t.accueil.viewAll}</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {trending.length > 0
            ? trending.slice(0, 8).map((m, i) => (
                <PosterCard key={m.ratingKey} id={m.ratingKey} title={m.title} gradient={GRADIENTS[i % GRADIENTS.length]} token={token} media={m} />
              ))
            : MOCK_TRENDING.map((m, i) => <PosterCard key={m.id} id={m.id} title={m.title} gradient={m.gradient} imgSrc={img(i)} />)
          }
        </div>
      </div>

      {/* AFRICAN ORIGINALS */}
      <div className="px-4 sm:px-7 pb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">{t.accueil.africanOriginals}</h2>
          <Link to="/films" className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-gold)' }}>{t.accueil.viewAll}</Link>
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:hidden" style={{ scrollbarWidth: 'none' }}>
          {MOCK_AFRICAN.map((m, i) => (
            <Link key={m.id} to={`/media/${m.id}`} className="flex-shrink-0 group cursor-pointer">
              <div className="rounded-xl overflow-hidden relative" style={{ width: 110, aspectRatio: '2/3', background: m.gradient }}>
                {img(10 + i) && <img src={img(10 + i)} alt={m.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
              </div>
              <p className="text-xs text-white mt-1.5 font-medium truncate" style={{ maxWidth: 110 }}>{m.title}</p>
            </Link>
          ))}
        </div>

        {/* Desktop: featured grid */}
        <div className="hidden md:grid gap-3" style={{ gridTemplateColumns: '200px repeat(2, 1fr)', gridTemplateRows: 'auto auto' }}>
          <Link to={`/media/${MOCK_AFRICAN[0].id}`} className="group cursor-pointer" style={{ gridRow: '1 / 3' }}>
            <div className="rounded-xl overflow-hidden relative w-full h-full" style={{ minHeight: '260px', background: MOCK_AFRICAN[0].gradient }}>
              {img(10) && <img src={img(10)} alt={MOCK_AFRICAN[0].title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
            </div>
          </Link>

          {MOCK_AFRICAN.slice(1, 3).map((m, i) => (
            <Link key={m.id} to={`/media/${m.id}`} className="group cursor-pointer">
              <div className="rounded-xl overflow-hidden relative" style={{ aspectRatio: '16/10', background: m.gradient }}>
                {img(11 + i) && <img src={img(11 + i)} alt={m.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.9)' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21" /></svg>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white mt-1.5 font-medium truncate">{m.title}</p>
            </Link>
          ))}

          {MOCK_AFRICAN.slice(3, 5).map((m, i) => (
            <Link key={m.id} to={`/media/${m.id}`} className="group cursor-pointer">
              <div className="rounded-xl overflow-hidden relative" style={{ aspectRatio: '16/10', background: m.gradient }}>
                {img(13 + i) && <img src={img(13 + i)} alt={m.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.9)' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21" /></svg>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white mt-1.5 font-medium truncate">{m.title}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* RECENTLY ADDED */}
      <div className="px-4 sm:px-7 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">{t.accueil.recentlyAdded}</h2>
          <Link to="/films" className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-gold)' }}>{t.accueil.viewAll}</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {recent.length > 0
            ? recent.slice(0, 8).map((m, i) => (
                <PosterCard key={m.ratingKey} id={m.ratingKey} title={m.title} gradient={GRADIENTS[i % GRADIENTS.length]} token={token} media={m} />
              ))
            : MOCK_RECENT.map((m, i) => (
                <div key={m.id} className="flex-shrink-0 cursor-pointer group">
                  <div className="rounded-xl overflow-hidden relative" style={{ width: 120, aspectRatio: '2/3', background: m.gradient }}>
                    {img(20 + i) && <img src={img(20 + i)} alt={m.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
                    <div className="absolute inset-0 p-2 flex flex-col justify-end" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }}>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded self-start" style={{ background: 'var(--color-gold)', color: '#000' }}>{m.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-white mt-1.5 truncate" style={{ maxWidth: 120 }}>{m.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>{m.year}</p>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}
