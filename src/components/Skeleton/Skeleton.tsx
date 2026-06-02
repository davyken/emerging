function S({ w, h, r = 8, style }: { w?: string | number; h?: string | number; r?: number; style?: React.CSSProperties }) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...style }}
    />
  )
}

// ── Single poster card skeleton (matches PosterCard in Accueil/Films/Series) ──
export function SkeletonPosterCard({ width = 120 }: { width?: number }) {
  return (
    <div style={{ width, flexShrink: 0 }}>
      <S style={{ aspectRatio: '2/3', width: '100%', borderRadius: 12 }} />
      <S w="75%" h={11} style={{ marginTop: 8 }} />
      <S w="45%" h={9} style={{ marginTop: 5 }} />
    </div>
  )
}

// ── Hero skeleton (Accueil full-width banner) ─────────────────────────────────
export function SkeletonHero() {
  return (
    <div className="relative overflow-hidden" style={{ height: '52vh', minHeight: '340px', borderRadius: 0 }}>
      <div className="skeleton w-full h-full" style={{ borderRadius: 0 }} />
      {/* Fake text overlay at the bottom */}
      <div className="absolute bottom-0 left-0 px-4 sm:px-7 pb-6 sm:pb-8 flex flex-col gap-3" style={{ width: '60%' }}>
        <S w={120} h={18} />
        <S w="90%" h={36} />
        <S w="75%" h={12} />
        <S w="60%" h={12} />
        <div className="flex gap-3 mt-1">
          <S w={110} h={38} r={10} />
          <S w={100} h={38} r={10} />
        </div>
      </div>
    </div>
  )
}

// ── Row skeleton (section title + horizontal poster cards) ────────────────────
export function SkeletonSection({ count = 7 }: { count?: number }) {
  return (
    <div className="px-4 sm:px-7 pt-5 pb-5">
      <div className="flex items-center justify-between mb-4">
        <S w={140} h={14} />
        <S w={60} h={12} />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[...Array(count)].map((_, i) => <SkeletonPosterCard key={i} />)}
      </div>
    </div>
  )
}

// ── Featured banner skeleton (Films / Series hero banner) ─────────────────────
export function SkeletonBanner() {
  return (
    <div className="relative rounded-2xl overflow-hidden mb-8" style={{ height: 200 }}>
      <div className="skeleton w-full h-full" style={{ borderRadius: 16 }} />
      <div className="absolute bottom-0 left-0 p-5 sm:p-6 flex flex-col gap-2" style={{ width: '55%' }}>
        <S w={60} h={16} r={4} />
        <S w="85%" h={24} />
        <S w="60%" h={12} />
        <div className="flex gap-3 mt-1">
          <S w={95} h={34} r={8} />
          <S w={90} h={34} r={8} />
        </div>
      </div>
    </div>
  )
}

// ── Grid skeleton (Films / Series card grid) ──────────────────────────────────
export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
      {[...Array(count)].map((_, i) => (
        <div key={i}>
          <S style={{ aspectRatio: '2/3', width: '100%', borderRadius: 12 }} />
          <S w="80%" h={11} style={{ marginTop: 8 }} />
          <S w="45%" h={9} style={{ marginTop: 5 }} />
        </div>
      ))}
    </div>
  )
}
