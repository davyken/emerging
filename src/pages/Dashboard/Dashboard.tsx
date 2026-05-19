import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  getTrending, getPopularMovies, getTopRatedMovies,
  getPopularShows, getNowPlayingMovies, tmdbImg, searchMulti,
} from '../../services/tmdbApi'
import type { TmdbMovie, TmdbShow, TmdbTrendingItem } from '../../types/tmdb'

function PosterCard({ id, type, title, poster, year, rating, width = 130 }: {
  id: number; type: 'movie' | 'tv'; title: string
  poster: string | null; year?: string; rating?: number; width?: number
}) {
  const img = tmdbImg(poster, 'w342')
  return (
    <Link to={`/media/${type}/${id}`} className="group block flex-shrink-0">
      <div className="rounded-xl overflow-hidden relative" style={{ width, aspectRatio: '2/3', background: '#1a1a1a' }}>
        {img
          ? <img src={img} alt={title} className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center" style={{ color: '#333' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
            </div>
        }
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.95)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21" /></svg>
          </div>
        </div>
        {rating && rating > 0 && (
          <div className="absolute top-2 right-2">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.75)', color: 'var(--color-gold)' }}>
              ★ {rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-white mt-2 truncate" style={{ maxWidth: width }}>{title}</p>
      {year && <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>{year}</p>}
    </Link>
  )
}

function Section({ title, viewAllTo, viewAllLabel, children }: {
  title: string; viewAllTo: string; viewAllLabel: string; children: React.ReactNode
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white">{title}</h2>
        <Link to={viewAllTo} className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-gold)' }}>{viewAllLabel}</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {children}
      </div>
    </section>
  )
}

export function Dashboard() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [hero, setHero]             = useState<TmdbTrendingItem | null>(null)
  const [trending, setTrending]     = useState<TmdbTrendingItem[]>([])
  const [popular, setPopular]       = useState<TmdbMovie[]>([])
  const [topRated, setTopRated]     = useState<TmdbMovie[]>([])
  const [nowPlaying, setNowPlaying] = useState<TmdbMovie[]>([])
  const [shows, setShows]           = useState<TmdbShow[]>([])
  const [loading, setLoading]       = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TmdbTrendingItem[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    Promise.all([
      getTrending(),
      getPopularMovies(),
      getTopRatedMovies(),
      getNowPlayingMovies(),
      getPopularShows(),
    ]).then(([trend, pop, top, now, tv]) => {
      setTrending(trend)
      setHero(trend[0] ?? null)
      setPopular(pop.slice(0, 12))
      setTopRated(top.slice(0, 12))
      setNowPlaying(now.slice(0, 12))
      setShows(tv.slice(0, 12))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    const delayDebounce = setTimeout(() => {
      searchMulti(searchQuery)
        .then((results) => {
          setSearchResults(results)
        })
        .catch(() => {})
        .finally(() => setSearching(false))
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  const heroTitle    = hero ? ('title' in hero ? hero.title : (hero as TmdbShow).name) : t.dashboard.heroTitle
  const heroOverview = hero?.overview ?? t.dashboard.heroDesc
  const heroBackdrop = hero ? tmdbImg(hero.backdrop_path, 'w1280') : null
  const heroType     = hero?.media_type === 'tv' ? 'tv' : 'movie'

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>

      {/* HERO */}
      {!searchQuery.trim() && (
        <section className="relative overflow-hidden" style={{ minHeight: '55vh' }}>
          {heroBackdrop
            ? <img src={heroBackdrop} alt={heroTitle} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center top' }} />
            : <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 100% 80% at 65% 0%, #2a1600 0%, #7a3a00 20%, #c46200 30%, #6b3000 45%, #1a0a00 65%, #0a0a0a 85%)' }} />
          }
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.92) 30%, rgba(10,10,10,0.5) 65%, rgba(10,10,10,0.1) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.4) 40%, transparent 70%)' }} />

          <div className="relative z-10 px-4 sm:px-8 pt-10 sm:pt-16 pb-8 sm:pb-12 max-w-xl">
            {!loading && (
              <>
                <div className="inline-flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'var(--color-teal)', color: '#000' }}>{t.dashboard.trendingBadge}</span>
                  {hero && (
                    <span className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {heroType === 'tv' ? 'TV Show' : 'Film'}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black mb-3 leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {heroTitle.toUpperCase()}
                </h1>
                <p className="text-sm leading-relaxed mb-6 max-w-md" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {heroOverview.slice(0, 180)}{heroOverview.length > 180 ? '...' : ''}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => hero && navigate(`/watch/${heroType}/${hero.id}`)}
                    className="flex items-center gap-2 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
                    style={{ background: 'var(--color-gold)', color: '#000' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                    {t.dashboard.watch}
                  </button>
                  <button
                    onClick={() => hero && navigate(`/media/${heroType}/${hero.id}`)}
                    className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg text-sm"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    {t.dashboard.moreInfo}
                  </button>
                </div>
              </>
            )}
            {loading && (
              <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin mt-8" style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }} />
            )}
          </div>
        </section>
      )}

      {/* Rows */}
      <div className={`px-4 sm:px-8 py-6 ${searchQuery.trim() ? 'pt-8 sm:pt-10' : ''}`}>
        {/* Search Bar */}
        <div className="mb-8 max-w-md relative">
          <input
            type="text"
            placeholder={t.topNav?.search || "Search movies, TV shows..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-10 py-2.5 rounded-xl outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'white',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
            }}
            onFocus={(e) => {
              e.target.style.border = '1px solid rgba(201,168,76,0.5)'
              e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.15)'
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid rgba(255,255,255,0.08)'
              e.target.style.boxShadow = 'none'
            }}
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }} />
          </div>
        ) : searchQuery.trim() ? (
          <div>
            <h2 className="text-base font-bold text-white mb-6">
              {searching ? 'Searching...' : `Search Results for "${searchQuery}"`}
            </h2>
            {searching ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }} />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-6">
                {searchResults.map((item) => {
                  const isMovie = item.media_type === 'movie'
                  const m = item as TmdbMovie
                  const s = item as TmdbShow
                  return (
                    <PosterCard
                      key={`${item.media_type}-${item.id}`}
                      id={item.id}
                      type={item.media_type}
                      title={isMovie ? m.title : s.name}
                      poster={item.poster_path}
                      year={(isMovie ? m.release_date : s.first_air_date)?.slice(0, 4)}
                      rating={item.vote_average}
                      width={140}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <svg className="mx-auto text-gray-600 mb-4" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                <p className="text-sm text-gray-400">No movies or TV shows found matching your search.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <Section title={t.dashboard.trending} viewAllTo="/films" viewAllLabel={t.dashboard.viewAll}>
              {trending.slice(0, 12).map(item => {
                const isMovie = item.media_type === 'movie'
                const m = item as TmdbMovie
                const s = item as TmdbShow
                return (
                  <PosterCard
                    key={`${item.media_type}-${item.id}`}
                    id={item.id}
                    type={item.media_type}
                    title={isMovie ? m.title : s.name}
                    poster={item.poster_path}
                    year={(isMovie ? m.release_date : s.first_air_date)?.slice(0, 4)}
                    rating={item.vote_average}
                  />
                )
              })}
            </Section>

            <Section title="Now Playing" viewAllTo="/films" viewAllLabel={t.dashboard.viewAll}>
              {nowPlaying.map(m => (
                <PosterCard key={m.id} id={m.id} type="movie" title={m.title}
                  poster={m.poster_path} year={m.release_date?.slice(0, 4)} rating={m.vote_average} />
              ))}
            </Section>

            <Section title={t.dashboard.africanOriginals} viewAllTo="/series" viewAllLabel={t.dashboard.viewAll}>
              {shows.map(s => (
                <PosterCard key={s.id} id={s.id} type="tv" title={s.name}
                  poster={s.poster_path} year={s.first_air_date?.slice(0, 4)} rating={s.vote_average} />
              ))}
            </Section>

            <Section title={t.dashboard.recentlyAdded} viewAllTo="/films" viewAllLabel={t.dashboard.viewAll}>
              {topRated.map(m => (
                <PosterCard key={m.id} id={m.id} type="movie" title={m.title}
                  poster={m.poster_path} year={m.release_date?.slice(0, 4)} rating={m.vote_average} />
              ))}
            </Section>

            <Section title="Popular Movies" viewAllTo="/films" viewAllLabel={t.dashboard.viewAll}>
              {popular.map(m => (
                <PosterCard key={m.id} id={m.id} type="movie" title={m.title}
                  poster={m.poster_path} year={m.release_date?.slice(0, 4)} rating={m.vote_average} />
              ))}
            </Section>
          </>
        )}
      </div>
    </div>
  )
}
