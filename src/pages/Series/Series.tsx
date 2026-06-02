import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  getPopularShows, getTopRatedShows, getShowsByGenre,
  SERIES_GENRE_IDS, tmdbImg,
} from '../../services/tmdbApi'
import { SkeletonBanner, SkeletonGrid } from '../../components/Skeleton/Skeleton'
import type { TmdbShow } from '../../types/tmdb'

// Module-level label refs updated from the hook on each render
let t_season = 'Season'
let t_seasons = 'Seasons'

function ShowCard({ show }: { show: TmdbShow }) {
  const poster = tmdbImg(show.poster_path, 'w342')
  const year = show.first_air_date?.slice(0, 4)
  return (
    <Link to={`/media/tv/${show.id}`} className="group block">
      <div className="rounded-xl overflow-hidden relative" style={{ aspectRatio: '2/3', background: '#1a1a1a' }}>
        {poster
          ? <img src={poster} alt={show.name} className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center" style={{ color: '#333' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="7" width="20" height="15" rx="2" /><path d="M17 2l-5 5-5-5" /></svg>
            </div>
        }
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.95)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21" /></svg>
          </div>
        </div>
        {show.vote_average > 0 && (
          <div className="absolute top-2 right-2">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.75)', color: 'var(--color-gold)' }}>
              ★ {show.vote_average.toFixed(1)}
            </span>
          </div>
        )}
        {show.number_of_seasons && (
          <div className="absolute bottom-2 left-2">
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.75)', color: '#aaa' }}>
              {show.number_of_seasons} {show.number_of_seasons === 1 ? t_season : t_seasons}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-white mt-2 truncate">{show.name}</p>
      {year && <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>{year}</p>}
    </Link>
  )
}

export function Series() {
  const { t } = useLanguage()
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [shows, setShows] = useState<TmdbShow[]>([])
  const [featured, setFeatured] = useState<TmdbShow | null>(null)
  const [loading, setLoading] = useState(true)

  t_season = t.series.season
  t_seasons = t.series.seasons

  useEffect(() => {
    setLoading(true)
    const genreId = SERIES_GENRE_IDS[categoryIndex]
    const fetchShows = genreId ? getShowsByGenre(genreId) : getPopularShows()

    Promise.all([fetchShows, categoryIndex === 0 ? getTopRatedShows() : Promise.resolve([])])
      .then(([results, topRated]) => {
        setShows(results)
        if (categoryIndex === 0 && topRated.length > 0) setFeatured(topRated[0])
        else if (results.length > 0) setFeatured(results[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [categoryIndex])

  const backdrop = featured ? tmdbImg(featured.backdrop_path, 'w1280') : null
  const year = featured?.first_air_date?.slice(0, 4)

  return (
    <div className="min-h-full p-4 sm:p-6" style={{ background: '#0a0a0a' }}>
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
      {loading && <SkeletonBanner />}
      {!loading && featured && (
        <div className="relative rounded-2xl overflow-hidden mb-8" style={{ height: '200px' }}>
          {backdrop
            ? <img src={backdrop} alt={featured.name} className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#0a1628,#1a4a8c,#0d2040)' }} />
          }
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
          <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded mb-2 self-start" style={{ background: 'var(--color-gold)', color: '#000' }}>{t.series.originalSeries}</span>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-1 max-w-sm truncate">{featured.name}</h2>
            <p className="text-xs mb-3 sm:mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {[
                featured.number_of_seasons
                  ? `${featured.number_of_seasons} ${featured.number_of_seasons === 1 ? t.series.season : t.series.seasons}`
                  : null,
                year,
                featured.vote_average > 0 ? `⭐ ${featured.vote_average.toFixed(1)}` : null,
              ].filter(Boolean).join(' · ')}
            </p>
            <div className="flex gap-3">
              <Link
                to={`/watch/tv/${featured.id}`}
                className="flex items-center gap-2 font-bold px-4 py-2 rounded-lg text-sm"
                style={{ background: 'var(--color-gold)', color: '#000' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                {t.series.playS1E1}
              </Link>
              <Link
                to={`/media/tv/${featured.id}`}
                className="font-semibold px-4 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
              >
                {t.series.moreInfo}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading
        ? <SkeletonGrid />
        : <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
            {shows.map(s => <ShowCard key={s.id} show={s} />)}
          </div>
      }
    </div>
  )
}
