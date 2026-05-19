import { useEffect, useState } from 'react'
import { getRecentlyAdded, getLibraries, getLibraryItems } from '../../services/plexApi'
import { useAuthStore } from '../../store/authStore'
import { MovieCard } from '../../components/MovieCard/MovieCard'
import type { PlexMedia, PlexLibrary } from '../../types/plex'

export function Home() {
  const token = useAuthStore((s) => s.token) ?? ''
  const [libraries, setLibraries] = useState<PlexLibrary[]>([])
  const [recent, setRecent] = useState<PlexMedia[]>([])
  const [libraryItems, setLibraryItems] = useState<Record<string, PlexMedia[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [libs, recentItems] = await Promise.all([getLibraries(token), getRecentlyAdded(token)])
        setLibraries(libs ?? [])
        setRecent(recentItems)

        const byLibrary: Record<string, PlexMedia[]> = {}
        await Promise.all(
          (libs ?? []).map(async (lib) => {
            const items = await getLibraryItems(token, lib.key)
            byLibrary[lib.key] = items.slice(0, 20)
          })
        )
        setLibraryItems(byLibrary)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-10">
      {recent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Recently Added</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3">
            {recent.slice(0, 18).map((m) => (
              <MovieCard key={m.ratingKey} media={m} />
            ))}
          </div>
        </section>
      )}

      {libraries.map((lib) => {
        const items = libraryItems[lib.key] ?? []
        if (items.length === 0) return null
        return (
          <section key={lib.key}>
            <h2 className="text-lg font-semibold text-white mb-4">{lib.title}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3">
              {items.map((m) => (
                <MovieCard key={m.ratingKey} media={m} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
