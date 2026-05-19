const BASE = 'https://api.tvmaze.com'

interface TVMazeShow {
  name: string
  summary?: string
  genres?: string[]
  rating?: { average?: number }
  image?: { medium?: string; original?: string }
}

export interface FeaturedShow {
  title: string
  summary: string
  genres: string[]
  rating?: number
  imageUrl: string
  backdropUrl: string
}

let _pool: string[] | null = null
let _shows: FeaturedShow[] = []

async function fetchPage(page: number): Promise<FeaturedShow[]> {
  const r = await fetch(`${BASE}/shows?page=${page}`)
  const raw: TVMazeShow[] = await r.json()
  return raw
    .filter(s => s.image?.medium)
    .map(s => ({
      title: s.name,
      summary: (s.summary ?? '').replace(/<[^>]+>/g, ''),
      genres: s.genres ?? [],
      rating: s.rating?.average ?? undefined,
      imageUrl: s.image?.medium ?? '',
      backdropUrl: s.image?.original ?? s.image?.medium ?? '',
    }))
}

export async function getMealImagePool(): Promise<string[]> {
  if (_pool) return _pool
  const results = await Promise.allSettled([
    fetchPage(0),
    fetchPage(1),
    fetchPage(2),
    fetchPage(3),
    fetchPage(4),
  ])
  _shows = results
    .flatMap(r => (r.status === 'fulfilled' ? r.value : []))
    .filter(s => s.imageUrl)
  _pool = _shows.map(s => s.imageUrl)
  return _pool
}

export function getRandomFeaturedShow(): FeaturedShow | null {
  if (_shows.length === 0) return null
  const idx = Math.floor(Math.random() * Math.min(80, _shows.length))
  return _shows[idx]
}
