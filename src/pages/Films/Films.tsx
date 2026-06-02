import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  getPopularMovies, getTopRatedMovies, getNowPlayingMovies,
  getMoviesByGenre, FILM_GENRE_IDS, tmdbImg,
} from '../../services/tmdbApi'
import { SkeletonBanner, SkeletonGrid } from '../../components/Skeleton/Skeleton'
import type { TmdbMovie } from '../../types/tmdb'

function StarIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  )
}

function MovieCard({ movie }: { movie: TmdbMovie }) {
  const poster = tmdbImg(movie.poster_path, 'w342')
  const year = movie.release_date?.slice(0, 4)
  return (
    <Link to={`/media/movie/${movie.id}`} className="group block">
      <div className="rounded-xl overflow-hidden relative" style={{ aspectRatio: '2/3', background: '#1a1a1a' }}>
        {poster
          ? <img src={poster} alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center" style={{ color: '#333' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M15 10l4.553-2.277A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v2z" /></svg>
            </div>
        }
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.95)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21" /></svg>
          </div>
        </div>
        {movie.vote_average > 0 && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.75)', color: 'var(--color-gold)' }}>
              <StarIcon />{movie.vote_average.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-white mt-2 truncate">{movie.title}</p>
      {year && <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>{year}</p>}
    </Link>
  )
}

export function Films() {
  const { t } = useLanguage()
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [movies, setMovies] = useState<TmdbMovie[]>([])
  const [featured, setFeatured] = useState<TmdbMovie | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const genreId = FILM_GENRE_IDS[categoryIndex]

    const fetchMovies = genreId
      ? getMoviesByGenre(genreId)
      : getPopularMovies()

    Promise.all([fetchMovies, categoryIndex === 0 ? getTopRatedMovies() : Promise.resolve([])])
      .then(([results, topRated]) => {
        setMovies(results)
        if (categoryIndex === 0 && topRated.length > 0) setFeatured(topRated[0])
        else if (results.length > 0) setFeatured(results[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [categoryIndex])

  // Preload now-playing for the hero on first load
  useEffect(() => {
    getNowPlayingMovies().then(movies => {
      if (movies.length > 0) setFeatured(movies[0])
    }).catch(() => {})
  }, [])

  const backdrop = featured ? tmdbImg(featured.backdrop_path, 'w1280') : null
  const year = featured?.release_date?.slice(0, 4)
  const runtime = featured?.runtime ? `${Math.floor(featured.runtime / 60)}h ${featured.runtime % 60}m` : null

  return (
    <div className="min-h-full p-4 sm:p-6" style={{ background: '#0a0a0a' }}>
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
      {loading && <SkeletonBanner />}
      {!loading && featured && (
        <div className="relative rounded-2xl overflow-hidden mb-8 cursor-pointer" style={{ height: '200px' }}>
          {backdrop
            ? <img src={backdrop} alt={featured.title} className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#0a1628,#1a4a8c,#c46a00)' }} />
          }
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
          <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded mb-2 self-start" style={{ background: 'var(--color-gold)', color: '#000' }}>{t.films.featured}</span>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-1 max-w-sm truncate">{featured.title}</h2>
            <p className="text-xs mb-3 sm:mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {[year, runtime, featured.vote_average > 0 ? `⭐ ${featured.vote_average.toFixed(1)}` : null].filter(Boolean).join(' · ')}
            </p>
            <div className="flex gap-3">
              <Link
                to={`/watch/movie/${featured.id}`}
                className="flex items-center gap-2 font-bold px-4 py-2 rounded-lg text-sm"
                style={{ background: 'var(--color-gold)', color: '#000' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                {t.films.playNow}
              </Link>
              <Link
                to={`/media/movie/${featured.id}`}
                className="font-semibold px-4 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
              >
                {t.films.moreInfo}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading
        ? <SkeletonGrid />
        : <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
            {movies.map(m => <MovieCard key={m.id} movie={m} />)}
          </div>
      }
    </div>
  )
}
