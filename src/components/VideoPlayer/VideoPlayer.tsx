import { useEffect } from 'react'
import { useHlsPlayer } from '../../hooks/useHlsPlayer'

interface VideoPlayerProps {
  src: string
  autoPlay?: boolean
  className?: string
}

export function VideoPlayer({ src, autoPlay = false, className = '' }: VideoPlayerProps) {
  const { videoRef, levels, currentLevel, isReady, error, setQualityLevel, setAutoQuality } = useHlsPlayer({ src, autoPlay })

  // Keyboard shortcuts
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function onKeyDown(e: KeyboardEvent) {
      if (!video) return
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          video.paused ? video.play() : video.pause()
          break
        case 'ArrowRight':
          video.currentTime = Math.min(video.currentTime + 10, video.duration)
          break
        case 'ArrowLeft':
          video.currentTime = Math.max(video.currentTime - 10, 0)
          break
        case 'KeyM':
          video.muted = !video.muted
          break
        case 'ArrowUp':
          video.volume = Math.min(video.volume + 0.1, 1)
          break
        case 'ArrowDown':
          video.volume = Math.max(video.volume - 0.1, 0)
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [videoRef])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-black text-red-400 ${className}`}>
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className={`relative bg-black group ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
      />

      {isReady && levels.length > 0 && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <select
            value={currentLevel === -1 ? 'auto' : currentLevel}
            onChange={(e) => {
              const val = e.target.value
              val === 'auto' ? setAutoQuality() : setQualityLevel(Number(val))
            }}
            className="bg-black/80 text-white text-sm px-2 py-1 rounded border border-white/20 cursor-pointer"
          >
            <option value="auto">Auto</option>
            {[...levels].reverse().map((l) => (
              <option key={l.index} value={l.index}>
                {l.height}p
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
