import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  getTrending, getPopularMovies, getPopularShows, getTopRatedMovies, tmdbImg,
} from '../../services/tmdbApi'
import type { TmdbMovie, TmdbShow, TmdbTrendingItem } from '../../types/tmdb'

function mediaType(item: TmdbTrendingItem): 'movie' | 'tv' {
  return item.media_type
}
function mediaTitle(item: TmdbTrendingItem): string {
  return item.media_type === 'movie' ? (item as TmdbMovie).title : (item as TmdbShow).name
}
function mediaDate(item: TmdbTrendingItem): string {
  return item.media_type === 'movie'
    ? (item as TmdbMovie).release_date
    : (item as TmdbShow).first_air_date
}

function PosterCard({ item, width = 120 }: { item: TmdbMovie | TmdbShow; width?: number }) {
  const isMovie = 'title' in item
  const title = isMovie ? (item as TmdbMovie).title : (item as TmdbShow).name
  const type = isMovie ? 'movie' : 'tv'
  const poster = tmdbImg(item.poster_path, 'w342')
  return (
    <Link to={`/media/${type}/${item.id}`} className="flex-shrink-0 group block">
      <div className="rounded-xl overflow-hidden relative" style={{ width, aspectRatio: '2/3', background: '#1a1a1a' }}>
        {poster
          ? <img src={poster} alt={title} className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center" style={{ color: '#333' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M15 10l4.553-2.277A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v2z" /></svg>
            </div>
        }
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.9)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21" /></svg>
          </div>
        </div>
        {item.vote_average > 0 && (
          <div className="absolute top-2 right-2">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.75)', color: 'var(--color-gold)' }}>
              ★ {item.vote_average.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-white mt-1.5 truncate" style={{ maxWidth: width }}>{title}</p>
    </Link>
  )
}

export function Accueil() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [hero, setHero] = useState<TmdbTrendingItem | null>(null)
  const [trending, setTrending] = useState<TmdbTrendingItem[]>([])
  const [popularMovies, setPopularMovies] = useState<TmdbMovie[]>([])
  const [popularShows, setPopularShows] = useState<TmdbShow[]>([])
  const [topRated, setTopRated] = useState<TmdbMovie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getTrending(),
      getPopularMovies(),
      getPopularShows(),
      getTopRatedMovies(),
    ]).then(([trendItems, movies, shows, top]) => {
      setTrending(trendItems)
      setHero(trendItems[0] ?? null)
      setPopularMovies(movies.slice(0, 10))
      setPopularShows(shows.slice(0, 10))
      setTopRated(top.slice(0, 10))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const heroBackdrop = hero ? tmdbImg(hero.backdrop_path, 'w1280') : null
  const heroTitle = hero ? mediaTitle(hero) : ''
  const heroOverview = hero
    ? (hero.overview?.slice(0, 180) + (hero.overview?.length > 180 ? '...' : ''))
    : ''
  const heroYear = hero ? mediaDate(hero)?.slice(0, 4) : ''
  const heroMediaType = hero ? mediaType(hero) : 'movie'

  return (
    <div className="min-h-full" style={{ background: '#0a0a0a' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: '52vh', minHeight: '340px' }}>
        {heroBackdrop
          ? <img src={heroBackdrop} alt={heroTitle} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center top' }} />
          : <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 130% 80% at 65% 0%, #2a1500 0%, #8b4500 18%, #c46a00 28%, #6b3500 42%, #1a0800 60%, #0a0a0a 80%)' }} />
        }
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.93) 30%, rgba(10,10,10,0.55) 65%, rgba(10,10,10,0.15) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.5) 35%, transparent 70%)' }} />

        <div className="relative z-10 h-full flex flex-col justify-end px-4 sm:px-7 pb-6 sm:pb-8">
          {!loading && hero && (
            <>
              <div className="inline-flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: '#2a9a2a', color: 'white' }}>{t.accueil.trendingBadge}</span>
                <span className="text-[10px] font-medium capitalize" style={{ color: 'rgba(255,255,255,0.5)' }}>{heroMediaType === 'tv' ? 'TV Show' : 'Film'}</span>
                {hero.vote_average > 0 && <span className="text-[10px] font-bold" style={{ color: 'var(--color-gold)' }}>★ {hero.vote_average.toFixed(1)}</span>}
                {heroYear && <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{heroYear}</span>}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black mb-2 leading-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {heroTitle.toUpperCase()}
              </h1>
              <p className="text-sm leading-relaxed mb-5 max-w-sm sm:max-w-md" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>
                {heroOverview}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/watch/${heroMediaType}/${hero.id}`)}
                  className="flex items-center gap-2 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
                  style={{ background: 'var(--color-gold)', color: '#000' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                  {t.accueil.playNow}
                </button>
                <button
                  onClick={() => navigate(`/media/${heroMediaType}/${hero.id}`)}
                  className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {t.accueil.moreInfo}
                </button>
              </div>
            </>
          )}
          {loading && (
            <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }} />
          )}
        </div>
      </div>

      {/* ── TRENDING NOW ─────────────────────────────────────────────────── */}
      <Section title={t.accueil.trendingNow} linkTo="/films" linkLabel={t.accueil.viewAll}>
        {trending.slice(0, 10).map(item => {
          const isMovie = item.media_type === 'movie'
          const m = isMovie ? item as TmdbMovie : item as TmdbShow
          return <PosterCard key={`${item.media_type}-${item.id}`} item={m} />
        })}
      </Section>

      {/* ── POPULAR MOVIES ───────────────────────────────────────────────── */}
      <Section title="Popular Movies" linkTo="/films" linkLabel={t.accueil.viewAll}>
        {popularMovies.map(m => <PosterCard key={m.id} item={m} />)}
      </Section>

      {/* ── POPULAR SERIES ───────────────────────────────────────────────── */}
      <Section title="Popular TV Shows" linkTo="/series" linkLabel={t.accueil.viewAll}>
        {popularShows.map(s => <PosterCard key={s.id} item={s} />)}
      </Section>

      {/* ── TOP RATED ────────────────────────────────────────────────────── */}
      <Section title="Top Rated Movies" linkTo="/films" linkLabel={t.accueil.viewAll}>
        {topRated.map(m => <PosterCard key={m.id} item={m} />)}
      </Section>

    </div>
  )
}

function Section({ title, linkTo, linkLabel, children }: {
  title: string; linkTo: string; linkLabel: string; children: React.ReactNode
}) {
  return (
    <div className="px-4 sm:px-7 pt-5 pb-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <Link to={linkTo} className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-gold)' }}>{linkLabel}</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {children}
      </div>
    </div>
  )
}
