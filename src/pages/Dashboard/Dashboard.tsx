import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRecentlyAdded, getLibraries, getLibraryItems, getThumbUrl } from '../../services/plexApi'
import { useAuthStore } from '../../store/authStore'
import type { PlexMedia } from '../../types/plex'

const GRADIENTS = [
  'linear-gradient(135deg,#0a1628,#1a4a8c,#0d2b5c)',
  'linear-gradient(135deg,#1a0a00,#4a2500,#2a1200)',
  'linear-gradient(135deg,#001a10,#004a2d,#001f14)',
  'linear-gradient(135deg,#0a0a1a,#2a2a6a,#0a0a3a)',
  'linear-gradient(135deg,#1a0500,#5a1500,#2a0800)',
  'linear-gradient(135deg,#1a1a00,#4a4a00,#2a2a00)',
  'linear-gradient(135deg,#0a1a1a,#004a4a,#001f1f)',
  'linear-gradient(135deg,#1a0a1a,#4a004a,#2a002a)',
]

interface MediaCardProps {
  media: PlexMedia
  token: string
  size?: 'sm' | 'md' | 'lg'
  index?: number
}

function MediaCard({ media, token, size = 'md', index = 0 }: MediaCardProps) {
  const thumb = media.thumb ? getThumbUrl(token, media.thumb) : null
  const gradient = GRADIENTS[index % GRADIENTS.length]

  return (
    <Link to={`/media/${media.ratingKey}`} className="group block cursor-pointer flex-shrink-0">
      <div
        className="rounded-xl overflow-hidden relative"
        style={{
          aspectRatio: '2/3',
          background: thumb ? undefined : gradient,
          width: size === 'sm' ? '110px' : size === 'lg' ? '160px' : '130px',
        }}
      >
        {thumb && <img src={thumb} alt={media.title} className="w-full h-full object-cover" loading="lazy" />}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.9)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21" /></svg>
          </div>
        </div>
      </div>
      <p className="text-xs font-medium text-white mt-2 truncate" style={{ maxWidth: size === 'sm' ? '110px' : size === 'lg' ? '160px' : '130px' }}>{media.title}</p>
      {media.year && <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>{media.year}</p>}
    </Link>
  )
}

interface SectionRowProps {
  title: string
  items: PlexMedia[]
  token: string
}

function SectionRow({ title, items, token }: SectionRowProps) {
  if (items.length === 0) return null
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white">{title}</h2>
        <button className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-gold)' }}>Tout voir</button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {items.slice(0, 12).map((m, i) => (
          <MediaCard key={m.ratingKey} media={m} token={token} index={i} />
        ))}
      </div>
    </section>
  )
}

export function Dashboard() {
  const token = useAuthStore((s) => s.token) ?? ''
  const [recent, setRecent] = useState<PlexMedia[]>([])
  const [trending, setTrending] = useState<PlexMedia[]>([])
  const [african, setAfrican] = useState<PlexMedia[]>([])
  const [hero, setHero] = useState<PlexMedia | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [libs, recentItems] = await Promise.all([
          getLibraries(token).catch(() => []),
          getRecentlyAdded(token).catch(() => []),
        ])
        const allItems: PlexMedia[] = recentItems ?? []

        if ((libs ?? []).length > 0) {
          const firstLib = (libs ?? [])[0]
          const libItems = await getLibraryItems(token, firstLib.key).catch(() => [])
          setTrending(libItems.slice(0, 8))
          setAfrican(libItems.slice(8, 16))
        }

        setRecent(recentItems ?? [])
        setHero(allItems[0] ?? null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* HERO */}
      <section className="relative" style={{ minHeight: '55vh' }}>
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 100% 80% at 65% 0%, #2a1600 0%, #7a3a00 20%, #c46200 30%, #6b3000 45%, #1a0a00 65%, #0a0a0a 85%)
            `,
          }}
        />
        {/* Building silhouettes */}
        <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: 'none' }}>
          {[40, 48, 55, 62, 68, 74].map((left, i) => (
            <div key={i} className="absolute bottom-0" style={{ left: `${left}%`, width: `${12 + i * 3}px`, height: `${40 + i * 5}%`, background: 'linear-gradient(to top, #050300 0%, #100800 70%, transparent 100%)', borderRadius: '3px 3px 0 0' }} />
          ))}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, #0a0a0a 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
        </div>

        <div className="relative z-10 px-8 pt-16 pb-12 max-w-xl">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'var(--color-teal)', color: '#000' }}>★ ORIGINAL EN TENDANCE</span>
          </div>
          <h1 className="text-4xl font-black mb-3 leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {hero?.title ?? "L'ASCENSION DE KAIRO"}
          </h1>
          <p className="text-sm leading-relaxed mb-6 max-w-md" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {hero?.summary ?? "Dans un Lagos du futur proche, un architecte brillant découvre une conspiration qui menace de réécrire l'histoire du continent, son chef-d'œuvre allant allier technologie et tradition."}
          </p>
          <div className="flex gap-3">
            <Link
              to={hero ? `/media/${hero.ratingKey}` : '#'}
              className="flex items-center gap-2 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
              style={{ background: 'var(--color-gold)', color: '#000' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
              Regarder
            </Link>
            <button className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}>
              Plus d'info
            </button>
          </div>
        </div>
      </section>

      {/* Content rows */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <>
            {trending.length > 0 ? (
              <SectionRow title="Tendances" items={trending} token={token} />
            ) : (
              <FallbackRow title="Tendances" />
            )}

            {/* Originaux Africains feature */}
            {african.length > 0 ? (
              <AfricanOriginalsSection items={african} token={token} />
            ) : (
              <FallbackAfricanSection />
            )}

            {recent.length > 0 ? (
              <SectionRow title="Ajoutés récemment" items={recent} token={token} />
            ) : (
              <FallbackRow title="Ajoutés récemment" />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function FallbackRow({ title }: { title: string }) {
  const placeholders = ['Shadow of the Void', 'Midnight Echoes', 'Velocity Prime', 'Ancient Relics']
  const grads = ['linear-gradient(135deg,#0a1628,#1a4a8c)', 'linear-gradient(135deg,#1a0a00,#5a2500)', 'linear-gradient(135deg,#001a10,#004a2d)', 'linear-gradient(135deg,#1a1000,#5a4000)']
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white">{title}</h2>
        <button className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-gold)' }}>Tout voir</button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {placeholders.map((t, i) => (
          <div key={t} className="flex-shrink-0">
            <div className="rounded-xl overflow-hidden mb-2" style={{ width: '130px', aspectRatio: '2/3', background: grads[i] }} />
            <p className="text-xs font-medium text-white truncate" style={{ maxWidth: '130px' }}>{t}</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>2025 · ⭐ 8.{i + 1}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function AfricanOriginalsSection({ items, token }: { items: PlexMedia[]; token: string }) {
  const featured = items[0]
  const others = items.slice(1, 4)
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white">Originaux Africains</h2>
        <button className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-gold)' }}>Tout voir</button>
      </div>
      <div className="grid grid-cols-3 gap-3" style={{ gridTemplateRows: 'auto' }}>
        {/* Featured */}
        <Link to={`/media/${featured.ratingKey}`} className="col-span-1 row-span-2 group cursor-pointer">
          <div className="rounded-xl overflow-hidden relative" style={{ aspectRatio: '3/4', background: 'linear-gradient(135deg,#1a0800,#4a2000,#8b4500)' }}>
            {featured.thumb && <img src={getThumbUrl(token, featured.thumb)} alt={featured.title} className="w-full h-full object-cover" loading="lazy" />}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
            <div className="absolute bottom-3 left-3 right-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded mb-1 inline-block" style={{ background: 'var(--color-teal)', color: '#000' }}>SÉRIE TOFU TV</span>
              <p className="text-sm font-bold text-white">{featured.title}</p>
              <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{featured.summary?.slice(0, 80)}</p>
            </div>
          </div>
        </Link>
        {others.map((m, i) => (
          <Link key={m.ratingKey} to={`/media/${m.ratingKey}`} className="group cursor-pointer">
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '16/10', background: GRADIENTS[i + 2] }}>
              {m.thumb && <img src={getThumbUrl(token, m.thumb)} alt={m.title} className="w-full h-full object-cover" loading="lazy" />}
            </div>
            <p className="text-xs font-medium text-white mt-1.5 truncate">{m.title}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

function FallbackAfricanSection() {
  const items = [
    { title: 'Fils du Soleil', desc: "Découvrez l'histoire secrète du grand Mansa Musa dans cette épopée historique à gros budget.", gradient: 'linear-gradient(135deg,#1a0800,#6a3000,#8b4000)', featured: true },
    { title: 'Kemet Rising', gradient: 'linear-gradient(135deg,#1a0500,#5a1000,#2a0a00)', featured: false },
    { title: 'Nile Chronicles', gradient: 'linear-gradient(135deg,#0a1010,#003030,#001515)', featured: false },
    { title: 'Ubuntu Protocol', gradient: 'linear-gradient(135deg,#0a0a1a,#2a2060,#151030)', featured: false },
  ]
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white">Originaux Africains</h2>
        <button className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-gold)' }}>Tout voir</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1 row-span-2 rounded-xl overflow-hidden relative cursor-pointer group" style={{ aspectRatio: '3/4', background: items[0].gradient }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
          <div className="absolute bottom-3 left-3 right-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded mb-1 inline-block" style={{ background: 'var(--color-teal)', color: '#000' }}>SÉRIE TOFU TV</span>
            <p className="text-sm font-bold text-white">{items[0].title}</p>
            <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{items[0].desc}</p>
          </div>
        </div>
        {items.slice(1).map((m) => (
          <div key={m.title} className="cursor-pointer group">
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '16/10', background: m.gradient }} />
            <p className="text-xs font-medium text-white mt-1.5">{m.title}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
