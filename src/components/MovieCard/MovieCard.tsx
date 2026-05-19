import { Link } from 'react-router-dom'
import type { PlexMedia } from '../../types/plex'
import { getThumbUrl } from '../../services/plexApi'
import { useAuthStore } from '../../store/authStore'

interface MovieCardProps {
  media: PlexMedia
}

export function MovieCard({ media }: MovieCardProps) {
  const token = useAuthStore((s) => s.token) ?? ''

  const thumbSrc = media.thumb ? getThumbUrl(token, media.thumb) : '/placeholder.svg'

  return (
    <Link
      to={`/media/${media.ratingKey}`}
      className="group block rounded-lg overflow-hidden bg-[var(--color-surface)] hover:scale-105 transition-transform duration-200 cursor-pointer"
    >
      <div className="aspect-[2/3] overflow-hidden relative">
        <img
          src={thumbSrc}
          alt={media.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <span className="text-white text-sm font-medium line-clamp-2">{media.title}</span>
        </div>
      </div>
      <div className="p-2">
        <p className="text-white text-xs font-medium truncate">{media.title}</p>
        {media.year && <p className="text-[var(--color-text-muted)] text-xs">{media.year}</p>}
      </div>
    </Link>
  )
}
