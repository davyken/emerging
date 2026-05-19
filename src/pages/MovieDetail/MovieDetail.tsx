import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMediaDetail, getThumbUrl, getDownloadUrl } from '../../services/plexApi'
import { useAuthStore } from '../../store/authStore'
import type { PlexMedia } from '../../types/plex'
import { useMealImages } from '../../hooks/useMealImages'

type Tab = 'episodes' | 'related' | 'trailers'

const MOCK: PlexMedia = {
  ratingKey: 'demo', key: '/library/metadata/demo', title: 'STELARIS: THE GOLDEN AGE', type: 'show',
  summary: 'In a future where humanity has harnessed the power of dying stars, a lone explorer discovers an ancient celestial artifact that could rewrite the history of the universe. As political factions vie for control, he must decide whether to save civilization or witness its rebirth.',
  rating: 8.9, year: 2024, duration: 8040000, addedAt: 0, updatedAt: 0,
  Genre: [{ tag: 'Sci-Fi' }, { tag: 'Adventure' }, { tag: 'Mystery' }],
  Director: [{ tag: 'Elena Vance' }],
}

const MOCK_EPISODES = [
  { id: '1', num: 1, title: 'The First Contact', duration: '45:00', thumb: 'linear-gradient(135deg,#1a1000,#5a3a00)', desc: 'Joe encounters a...' },
  { id: '2', num: 2, title: 'Echoes of the Void', duration: '52:12', thumb: 'linear-gradient(135deg,#001020,#004060)', desc: 'The crew must navigate...', downloaded: true },
  { id: '3', num: 3, title: 'The Golden Scepter', duration: '48:55', thumb: 'linear-gradient(135deg,#1a0a00,#6a2000)', desc: 'Secret alliances are...' },
  { id: '4', num: 4, title: 'Beyond the Horizon', duration: '50:04', thumb: 'linear-gradient(135deg,#0a0a00,#3a3a00)', desc: "The artifact's true power...", downloaded: true },
]

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

export function MovieDetail() {
  const { ratingKey } = useParams<{ ratingKey: string }>()
  const token = useAuthStore((s) => s.token) ?? ''
  const navigate = useNavigate()
  const { img } = useMealImages()

  const [media, setMedia] = useState<PlexMedia>(MOCK)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('episodes')
  const [showDownload, setShowDownload] = useState(false)
  const [season, setSeason] = useState(1)

  useEffect(() => {
    if (!ratingKey || ratingKey === 'demo') { setLoading(false); return }
    getMediaDetail(token, ratingKey)
      .then(setMedia)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ratingKey, token])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const thumbSrc = media.thumb ? getThumbUrl(token, media.thumb) : img(80)

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', color: 'white' }}>
      {/* Hero section */}
      <div
        className="relative px-8 py-8"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0f00 30%, #2a1800 50%, #0a0a0a 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{ position: 'absolute', top: '-20%', right: '20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
        </div>

        <div className="relative z-10 flex gap-8">
          {/* Poster */}
          <div className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: '180px', aspectRatio: '2/3', background: 'linear-gradient(135deg,#1a1000,#4a2800,#2a1400)' }}>
            {thumbSrc
              ? <img src={thumbSrc} alt={media.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <div style={{ width: '60px', height: '60px', background: 'rgba(201,168,76,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(201,168,76,0.5)"><polygon points="5,3 19,12 5,21" /></svg>
                  </div>
                </div>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Genre tags */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {(media.Genre ?? [{ tag: 'Sci-Fi' }, { tag: 'Adventure' }, { tag: 'Mystery' }]).map((g) => (
                <span key={g.tag} className="text-xs font-medium" style={{ color: 'var(--color-gold)' }}>
                  {g.tag}
                </span>
              )).reduce((acc: React.ReactNode[], el, i, arr) => {
                acc.push(el)
                if (i < arr.length - 1) acc.push(<span key={`sep${i}`} style={{ color: '#444' }}>/</span>)
                return acc
              }, [])}
            </div>

            <h1 className="text-3xl font-black mb-3 leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {media.title}
            </h1>
            <p className="text-sm leading-relaxed mb-5 max-w-2xl" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {media.summary}
            </p>

            {/* Meta badges */}
            <div className="flex items-center gap-3 mb-5">
              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--color-gold)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" /></svg>
                {media.rating?.toFixed(1) ?? '8.9'}/10
              </span>
              {media.duration && (
                <span className="text-xs" style={{ color: '#666' }}>
                  <svg className="inline mr-1" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {formatMs(media.duration)}
                </span>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(45,212,191,0.15)', color: 'var(--color-teal)', border: '1px solid rgba(45,212,191,0.3)' }}>4K HDR</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => navigate(`/watch/${media.ratingKey}`)}
                className="flex items-center gap-2 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
                style={{ background: 'var(--color-gold)', color: '#000' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                Play Movie
              </button>
              <button
                onClick={() => setShowDownload(true)}
                className="flex items-center gap-2 font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" /></svg>
                Download
              </button>
              <button className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </button>
            </div>

            {/* Credits */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: '#555' }}>Director</p>
                <p className="text-sm text-white">{media.Director?.[0]?.tag ?? 'Elena Vance'}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: '#555' }}>Studio</p>
                <p className="text-sm text-white">Nebula Films</p>
              </div>
              <div>
                <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: '#555' }}>Cast</p>
                <p className="text-sm text-white line-clamp-2">
                  {media.Role?.slice(0, 3).map(r => r.tag).join(', ') ?? 'Julian Thorne, Alara Ress, Marcus Welby, Sarah J. Parker'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 pt-6">
        <div className="flex items-center gap-0 mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {(['episodes', 'related', 'trailers'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 pb-3 text-xs font-semibold uppercase tracking-wider transition-colors"
              style={{
                color: tab === t ? 'white' : '#555',
                borderBottom: tab === t ? '2px solid var(--color-gold)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {t === 'episodes' ? 'Épisodes' : t === 'related' ? 'Contenu lié' : 'Bandes-annonces'}
            </button>
          ))}
          <div className="flex-1" />
          {tab === 'episodes' && (
            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="text-xs px-3 py-1.5 rounded-lg mb-2 outline-none"
              style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            >
              {[1, 2, 3].map((s) => (
                <option key={s} value={s}>Saison {String(s).padStart(2, '0')}</option>
              ))}
            </select>
          )}
        </div>

        {tab === 'episodes' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {MOCK_EPISODES.map((ep, i) => (
              <div key={ep.id} className="cursor-pointer group">
                <div className="rounded-xl overflow-hidden relative mb-2" style={{ aspectRatio: '16/9', background: ep.thumb }}>
                  {img(85 + i) && <img src={img(85 + i)} alt={ep.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}>{ep.duration}</span>
                  </div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.9)' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21" /></svg>
                    </div>
                  </div>
                  {ep.downloaded && (
                    <div className="absolute bottom-2 right-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(45,212,191,0.9)' }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-white">{ep.num}. {ep.title}</p>
                <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: '#555' }}>{ep.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Technical Specs + Subtitles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Technical Specs</h3>
            <div className="grid grid-cols-2 gap-y-4">
              {[
                { label: 'Resolution', value: '4K UHD (2160p)' },
                { label: 'Dynamic Range', value: 'Dolby Vision / HDR10+' },
                { label: 'Audio', value: 'Dolby Atmos 7.1' },
                { label: 'Aspect Ratio', value: '2.39:1 (Cinemascope)' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: '#555' }}>{s.label}</p>
                  <p className="text-sm text-white">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-5">
              <h3 className="text-sm font-bold text-white mb-3">Available Subtitles</h3>
              <div className="flex flex-wrap gap-2">
                {['English (CC)', 'French', 'Spanish', 'German', 'Japanese', 'Italian'].map((sub) => (
                  <span key={sub} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', color: '#ccc' }}>{sub}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-3">Languages</h3>
              <p className="text-sm" style={{ color: '#999' }}>English (Original), French, Spanish (Latin America)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Download modal */}
      {showDownload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setShowDownload(false)}>
          <div className="w-full max-w-xs rounded-xl p-6" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-4">Choisir la qualité</h3>
            <div className="flex flex-col gap-2">
              {['1080p', '720p', '480p', '360p'].map((q) => (
                <a key={q} href={getDownloadUrl(token, media.ratingKey, q)} download className="flex items-center justify-between px-4 py-3 rounded-lg transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}>
                  <span className="text-sm">{q}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" /></svg>
                </a>
              ))}
            </div>
            <button onClick={() => setShowDownload(false)} className="mt-4 w-full text-xs transition-colors" style={{ color: '#555' }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}
