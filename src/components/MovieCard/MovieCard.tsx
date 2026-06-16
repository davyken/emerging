import { Link } from 'react-router-dom'
import type { TmdbTrendingItem, TmdbMovie, TmdbShow } from '../../types/tmdb'

interface MovieCardProps {
  media: TmdbTrendingItem & { media_type: 'movie' | 'tv' }
}

export function MovieCard({ media }: MovieCardProps) {
  const isMovieItem = media.media_type === 'movie'
  const thumbSrc = media.poster_path || '/placeholder.svg'
  const title = isMovieItem ? (media as TmdbMovie).title : (media as TmdbShow).name
  const year = isMovieItem ? (media as TmdbMovie).release_date?.slice(0, 4) : (media as TmdbShow).first_air_date?.slice(0, 4)

  return (
    <Link
      to={`/media/${media.media_type}/${media.id}`}
      className="group block rounded-lg overflow-hidden bg-[var(--color-surface)] hover:scale-105 transition-transform duration-200 cursor-pointer"
    >
      <div className="aspect-[2/3] overflow-hidden relative">
        <img
          src={thumbSrc}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <span className="text-white text-sm font-medium line-clamp-2">{title}</span>
        </div>
      </div>
      <div className="p-2">
        <p className="text-white text-xs font-medium truncate">{title}</p>
        <p className="text-[var(--color-text-muted)] text-xs">
          {year || media.vote_average?.toFixed(1) || ''}
        </p>
      </div>
    </Link>
  )
}
