import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import { getMovieDetail, getShowDetail, tmdbImg, pickBestTrailer } from '../../services/tmdbApi'
import { buildYouTubeEmbedUrl } from '../../services/trailerService'
import type { TmdbMovie, TmdbShow, TmdbVideo, TmdbCastMember } from '../../types/tmdb'

type Tab = 'trailers' | 'cast' | 'details'

type Detail =
  | (TmdbMovie & { videos: { results: TmdbVideo[] }; credits: { cast: TmdbCastMember[] } })
  | (TmdbShow  & { videos: { results: TmdbVideo[] }; credits: { cast: TmdbCastMember[] } })

function isMovie(d: Detail): d is TmdbMovie & { videos: { results: TmdbVideo[] }; credits: { cast: TmdbCastMember[] } } {
  return 'title' in d
}

export function MovieDetail() {
  const { type, tmdbId } = useParams<{ type: string; tmdbId: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('trailers')

  const mediaType = type === 'tv' ? 'tv' : 'movie'

  useEffect(() => {
    if (!tmdbId) return
    setLoading(true)
    setDetail(null)
    const id = Number(tmdbId)
    const fetch = mediaType === 'movie' ? getMovieDetail(id) : getShowDetail(id)
    fetch
      .then(d => setDetail(d as Detail))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tmdbId, mediaType])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0a0a' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0a0a', color: '#555' }}>
        <p>Content not found.</p>
      </div>
    )
  }

  const title   = isMovie(detail) ? detail.title : (detail as TmdbShow).name
  const year    = isMovie(detail) ? detail.release_date?.slice(0, 4) : (detail as TmdbShow).first_air_date?.slice(0, 4)
  const runtime = isMovie(detail) && detail.runtime
    ? `${Math.floor(detail.runtime / 60)}h ${detail.runtime % 60}m`
    : !isMovie(detail) && (detail as TmdbShow).number_of_seasons
      ? `${(detail as TmdbShow).number_of_seasons} Season${(detail as TmdbShow).number_of_seasons === 1 ? '' : 's'}`
      : null

  const genres   = detail.genres ?? []
  const poster   = tmdbImg(detail.poster_path, 'w342')
  const backdrop = tmdbImg(detail.backdrop_path, 'w1280')
  const cast     = detail.credits?.cast?.slice(0, 6) ?? []
  const videos   = (detail.videos?.results ?? []).filter(v => v.site === 'YouTube')
  const bestTrailer = pickBestTrailer(videos)

  const TECH_SPECS = [
    { label: t.movieDetail.resolution, value: '4K UHD (2160p)' },
    { label: t.movieDetail.dynamicRange, value: 'Dolby Vision / HDR10+' },
    { label: t.movieDetail.audio, value: 'Dolby Atmos 7.1' },
    { label: t.movieDetail.aspectRatio, value: '2.39:1 (Cinemascope)' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', color: 'white' }}>

      {/* ── HERO ── */}
      <div className="relative" style={{ minHeight: '300px' }}>
        {backdrop && (
          <img src={backdrop} alt={title} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center top' }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.7) 60%, rgba(10,10,10,1) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.8) 0%, transparent 60%)' }} />

        <div className="relative z-10 flex flex-col sm:flex-row gap-5 sm:gap-8 px-4 sm:px-8 pt-6 pb-8 sm:pt-10">
          {/* Poster */}
          <div className="flex-shrink-0 self-center sm:self-start rounded-xl overflow-hidden shadow-2xl" style={{ width: '140px', aspectRatio: '2/3', background: '#1a1a1a' }}>
            {poster
              ? <img src={poster} alt={title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center" style={{ color: '#333' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                </div>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {genres.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {genres.map((g, i) => (
                  <span key={g.id}>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-gold)' }}>{g.name}</span>
                    {i < genres.length - 1 && <span className="ml-2" style={{ color: '#444' }}>/</span>}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-black mb-2 leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>{title}</h1>

            {'tagline' in detail && detail.tagline && (
              <p className="text-sm italic mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>{detail.tagline}</p>
            )}

            <p className="text-sm leading-relaxed mb-4 max-w-2xl" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {detail.overview}
            </p>

            <div className="flex items-center gap-3 flex-wrap mb-5">
              {detail.vote_average > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--color-gold)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" /></svg>
                  {detail.vote_average.toFixed(1)}/10
                </span>
              )}
              {year && <span className="text-xs" style={{ color: '#666' }}>{year}</span>}
              {runtime && <span className="text-xs" style={{ color: '#666' }}>{runtime}</span>}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(45,212,191,0.15)', color: 'var(--color-teal)', border: '1px solid rgba(45,212,191,0.3)' }}>4K HDR</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => navigate(`/watch/${mediaType}/${tmdbId}`)}
                className="flex items-center gap-2 font-bold px-6 py-2.5 rounded-lg text-sm"
                style={{ background: 'var(--color-gold)', color: '#000' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                {bestTrailer ? t.movieDetail.playMovie : 'Watch Trailer'}
              </button>
              {bestTrailer && (
                <button
                  onClick={() => setTab('trailers')}
                  className="flex items-center gap-2 font-semibold px-6 py-2.5 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5,3 19,12 5,21" /><rect x="1" y="3" width="22" height="18" rx="2" /></svg>
                  {t.movieDetail.trailers}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="px-4 sm:px-8 pt-4">
        <div className="flex items-center gap-0 mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {(['trailers', 'cast', 'details'] as Tab[]).map((tabKey) => {
            const label = tabKey === 'trailers' ? t.movieDetail.trailers : tabKey === 'cast' ? t.movieDetail.cast : t.movieDetail.related
            return (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className="px-5 pb-3 text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{
                  color: tab === tabKey ? 'white' : '#555',
                  borderBottom: tab === tabKey ? '2px solid var(--color-gold)' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* ── TRAILERS TAB ── */}
        {tab === 'trailers' && <TrailersTab videos={videos} title={title} />}

        {/* ── CAST TAB ── */}
        {tab === 'cast' && (
          <div className="pb-10">
            {cast.length === 0
              ? <p className="text-sm py-8 text-center" style={{ color: '#555' }}>No cast information available.</p>
              : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {cast.map(member => {
                    const photo = tmdbImg(member.profile_path, 'w185')
                    return (
                      <div key={member.id} className="text-center">
                        <div className="rounded-xl overflow-hidden mx-auto mb-2" style={{ width: '80px', aspectRatio: '2/3', background: '#1a1a1a' }}>
                          {photo
                            ? <img src={photo} alt={member.name} className="w-full h-full object-cover" loading="lazy" />
                            : <div className="w-full h-full flex items-center justify-center" style={{ color: '#333' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                              </div>
                          }
                        </div>
                        <p className="text-xs font-semibold text-white truncate">{member.name}</p>
                        <p className="text-[10px] truncate mt-0.5" style={{ color: '#555' }}>{member.character}</p>
                      </div>
                    )
                  })}
                </div>
              )
            }
          </div>
        )}

        {/* ── DETAILS TAB ── */}
        {tab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
            <div>
              <h3 className="text-sm font-bold text-white mb-4">{t.movieDetail.technicalSpecs}</h3>
              <div className="grid grid-cols-2 gap-y-4">
                {TECH_SPECS.map((s) => (
                  <div key={s.label}>
                    <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: '#555' }}>{s.label}</p>
                    <p className="text-sm text-white">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-3">{t.movieDetail.availableSubtitles}</h3>
              <div className="flex flex-wrap gap-2 mb-5">
                {['English (CC)', 'French', 'Spanish', 'German', 'Japanese'].map(sub => (
                  <span key={sub} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', color: '#ccc' }}>{sub}</span>
                ))}
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{t.movieDetail.languages}</h3>
              <p className="text-sm" style={{ color: '#999' }}>
                {detail.original_language?.toUpperCase()} (Original), English, French
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Trailers tab ────────────────────────────────────────────────────────────

function TrailersTab({ videos, title }: { videos: TmdbVideo[]; title: string }) {
  const [selected, setSelected] = useState(0)

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: '#555' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-sm">No trailers available for this title.</p>
      </div>
    )
  }

  const current = videos[selected]
  const embedUrl = buildYouTubeEmbedUrl(current.key, true)

  return (
    <div className="mb-10">
      {/* Pill selector */}
      <div className="flex gap-2 flex-wrap mb-5">
        {videos.map((v, i) => (
          <button
            key={v.id}
            onClick={() => setSelected(i)}
            className="text-xs font-semibold px-4 py-1.5 rounded-full transition-all"
            style={{
              background: selected === i ? 'var(--color-gold)' : 'rgba(255,255,255,0.07)',
              color: selected === i ? '#000' : '#888',
              border: selected === i ? 'none' : '1px solid rgba(255,255,255,0.1)',
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={v.name}
          >
            {v.name}
          </button>
        ))}
      </div>

      {/* Embed */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ aspectRatio: '16/9', maxHeight: '480px' }}>
          <iframe
            key={current.key}
            src={embedUrl}
            title={current.name}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ border: 'none', display: 'block' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 px-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.2)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff4444"><polygon points="5,3 19,12 5,21" /></svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{current.name}</p>
          <p className="text-xs mt-0.5" style={{ color: '#666' }}>
            {title} · {current.type}{current.official ? ' · Official' : ''} · YouTube
          </p>
        </div>
      </div>
    </div>
  )
}
