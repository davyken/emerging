import { useEffect, useState } from 'react'
import { getTrending } from '../../services/tmdbApi'
import type { TmdbTrendingItem } from '../../types/tmdb'
import { MovieCard } from '../../components/MovieCard/MovieCard'

export function Home() {
  const [items, setItems] = useState<TmdbTrendingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTrending().then(setItems).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-10">
      {items.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Films & Séries</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3">
            {items.slice(0, 18).map((m) => (
              <MovieCard key={m.id} media={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
