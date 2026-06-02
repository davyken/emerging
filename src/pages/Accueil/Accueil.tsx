import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  getTrending, getPopularMovies, getPopularShows, getTopRatedMovies,
  getTrailerKey, tmdbImg,
} from '../../services/tmdbApi'
import { useMediaStore } from '../../store/mediaStore'
import { SkeletonHero, SkeletonSection } from '../../components/Skeleton/Skeleton'
import type { TmdbMovie, TmdbShow, TmdbTrendingItem } from '../../types/tmdb'

const HERO_DURATION = 5000 // ms per slide
const HERO_COUNT = 8       // max trending items to cycle

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

  const { trending, popularMovies, popularShows, topRated, loaded, setMedia } = useMediaStore()
  const [loading, setLoading] = useState(!loaded)

  // ── Hero rotation ────────────────────────────────────────────────────────────
  const heroes = trending.slice(0, HERO_COUNT)
  const [heroIdx, setHeroIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const [trailerKey, setTrailerKey] = useState<string | null>(null)
  const [showTrailer, setShowTrailer] = useState(false)
  const rotateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // Fetch initial data
  useEffect(() => {
    if (loaded) return
    Promise.all([
      getTrending(),
      getPopularMovies(),
      getPopularShows(),
      getTopRatedMovies(),
    ]).then(([trendItems, movies, shows, top]) => {
      setMedia({
        trending: trendItems,
        popularMovies: movies.slice(0, 10),
        popularShows: shows.slice(0, 10),
        topRated: top.slice(0, 10),
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [loaded])

  // Auto-rotate hero with crossfade
  function goTo(idx: number) {
    if (rotateTimer.current) clearTimeout(rotateTimer.current)
    setFading(true)
    setShowTrailer(false)
    setTimeout(() => {
      setHeroIdx(idx)
      setFading(false)
    }, 400)
  }

  useEffect(() => {
    if (loading || heroes.length === 0) return
    rotateTimer.current = setTimeout(() => {
      goTo((heroIdx + 1) % heroes.length)
    }, HERO_DURATION)
    return () => { if (rotateTimer.current) clearTimeout(rotateTimer.current) }
  }, [heroIdx, loading, heroes.length])

  // Fetch trailer whenever hero changes
  useEffect(() => {
    if (heroes.length === 0) return
    const hero = heroes[heroIdx]
    if (!hero) return
    setTrailerKey(null)
    setShowTrailer(false)
    const title = mediaTitle(hero)
    const type = mediaType(hero)
    getTrailerKey(title, type).then(key => {
      setTrailerKey(key)
      if (key) setTimeout(() => setShowTrailer(true), 800)
    })
  }, [heroIdx, heroes.length])

  // Animate progress bar
  useEffect(() => {
    const bar = progressRef.current
    if (!bar || loading) return
    bar.style.transition = 'none'
    bar.style.width = '0%'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.transition = `width ${HERO_DURATION}ms linear`
        bar.style.width = '100%'
      })
    })
  }, [heroIdx, loading])

  const hero = heroes[heroIdx] ?? null
  const heroBackdrop = hero ? tmdbImg(hero.backdrop_path, 'w1280') : null
  const heroTitle = hero ? mediaTitle(hero) : ''
  const heroOverview = hero ? hero.overview?.slice(0, 160) + (hero.overview?.length > 160 ? '…' : '') : ''
  const heroYear = hero ? mediaDate(hero)?.slice(0, 4) : ''
  const heroMediaType = hero ? mediaType(hero) : 'movie'

  if (loading) {
    return (
      <div className="min-h-full" style={{ background: '#0a0a0a' }}>
        <SkeletonHero />
        <SkeletonSection />
        <SkeletonSection />
        <SkeletonSection />
        <SkeletonSection />
      </div>
    )
  }

  return (
    <div className="min-h-full" style={{ background: '#0a0a0a' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: '58vh', minHeight: '380px' }}>

        {/* Background: YouTube trailer or backdrop image */}
        <div
          className="absolute inset-0"
          style={{ transition: 'opacity 0.6s', opacity: fading ? 0 : 1 }}
        >
          {showTrailer && trailerKey ? (
            /* YouTube trailer background */
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                key={trailerKey}
                src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&playsinline=1&rel=0&disablekb=1&iv_load_policy=3&modestbranding=1`}
                allow="autoplay; encrypted-media"
                className="absolute"
                style={{
                  border: 'none',
                  pointerEvents: 'none',
                  width: '177.78vh',
                  height: '56.25vw',
                  minWidth: '100%',
                  minHeight: '100%',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
          ) : heroBackdrop ? (
            <img
              key={heroBackdrop}
              src={heroBackdrop}
              alt={heroTitle}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center top' }}
            />
          ) : (
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 130% 80% at 65% 0%, #2a1500 0%, #8b4500 18%, #c46a00 28%, #6b3500 42%, #1a0800 60%, #0a0a0a 80%)' }} />
          )}
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.95) 30%, rgba(10,10,10,0.6) 65%, rgba(10,10,10,0.2) 100%)' }} />
        <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.4) 40%, transparent 70%)' }} />

        {/* Hero content */}
        <div
          className="relative z-20 h-full flex flex-col justify-end px-4 sm:px-7 pb-5 sm:pb-7"
          style={{ transition: 'opacity 0.4s', opacity: fading ? 0 : 1 }}
        >
          {hero && (
            <>
              {/* Badges */}
              <div className="inline-flex items-center gap-2 mb-2.5 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: '#2a9a2a', color: 'white' }}>
                  {t.accueil.trendingBadge}
                </span>
                <span className="text-[10px] font-medium capitalize" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {heroMediaType === 'tv' ? 'TV Show' : 'Film'}
                </span>
                {hero.vote_average > 0 && (
                  <span className="text-[10px] font-bold" style={{ color: 'var(--color-gold)' }}>
                    ★ {hero.vote_average.toFixed(1)}
                  </span>
                )}
                {heroYear && (
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{heroYear}</span>
                )}
                {showTrailer && trailerKey && (
                  <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                    Trailer
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-black mb-2 leading-tight" style={{ fontFamily: "'DM Sans', sans-serif", textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
                {heroTitle.toUpperCase()}
              </h1>

              {/* Overview */}
              <p className="text-xs sm:text-sm mb-4 max-w-sm sm:max-w-md" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: '1.6', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                {heroOverview}
              </p>

              {/* Action buttons */}
              <div className="flex gap-3 mb-5">
                <button
                  onClick={() => navigate(`/watch/${heroMediaType}/${hero.id}`)}
                  className="flex items-center gap-2 font-bold px-5 py-2.5 rounded-lg text-sm transition-all hover:scale-105"
                  style={{ background: 'var(--color-gold)', color: '#000' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                  {t.accueil.playNow}
                </button>
                <button
                  onClick={() => navigate(`/media/${heroMediaType}/${hero.id}`)}
                  className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {t.accueil.moreInfo}
                </button>
              </div>

              {/* Dot indicators + progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {heroes.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className="rounded-full transition-all"
                      style={{
                        width: i === heroIdx ? 20 : 6,
                        height: 6,
                        background: i === heroIdx ? 'var(--color-gold)' : 'rgba(255,255,255,0.3)',
                      }}
                    />
                  ))}
                </div>
                {/* Thin progress bar */}
                <div className="flex-1 max-w-[120px] h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <div ref={progressRef} className="h-full rounded-full" style={{ width: '0%', background: 'var(--color-gold)' }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Prev / Next arrows */}
        {heroes.length > 1 && (
          <>
            <button
              onClick={() => goTo((heroIdx - 1 + heroes.length) % heroes.length)}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.5)', color: 'white', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              onClick={() => goTo((heroIdx + 1) % heroes.length)}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.5)', color: 'white', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </>
        )}
      </div>

      {/* ── TRENDING NOW ───────────────────────────────────────────────────────── */}
      <Section title={t.accueil.trendingNow} linkTo="/films" linkLabel={t.accueil.viewAll}>
        {trending.slice(0, 10).map(item => {
          const isMovie = item.media_type === 'movie'
          const m = isMovie ? item as TmdbMovie : item as TmdbShow
          return <PosterCard key={`${item.media_type}-${item.id}`} item={m} />
        })}
      </Section>

      {/* ── POPULAR MOVIES ─────────────────────────────────────────────────────── */}
      <Section title="Popular Movies" linkTo="/films" linkLabel={t.accueil.viewAll}>
        {popularMovies.map(m => <PosterCard key={m.id} item={m} />)}
      </Section>

      {/* ── POPULAR SERIES ─────────────────────────────────────────────────────── */}
      <Section title="Popular TV Shows" linkTo="/series" linkLabel={t.accueil.viewAll}>
        {popularShows.map(s => <PosterCard key={s.id} item={s} />)}
      </Section>

      {/* ── TOP RATED ──────────────────────────────────────────────────────────── */}
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
