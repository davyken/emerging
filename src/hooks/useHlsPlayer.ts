import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

export type QualityLevel = { height: number; bitrate: number; index: number }

interface UseHlsPlayerOptions {
  src: string
  autoPlay?: boolean
}

export function useHlsPlayer({ src, autoPlay = false }: UseHlsPlayerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [levels, setLevels] = useState<QualityLevel[]>([])
  const [currentLevel, setCurrentLevel] = useState<number>(-1) // -1 = Auto
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setError(null)
    setIsReady(false)

    if (Hls.isSupported()) {
      const hls = new Hls({ startLevel: -1 })
      hlsRef.current = hls

      hls.loadSource(src)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const qualityLevels = data.levels.map((l, i) => ({
          height: l.height,
          bitrate: l.bitrate,
          index: i,
        }))
        setLevels(qualityLevels)
        if (qualityLevels[0]) {
          hls.currentLevel = qualityLevels[0].index
          setCurrentLevel(qualityLevels[0].index)
        }
        setIsReady(true)
        if (autoPlay) video.play().catch(() => null)
      })

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentLevel(data.level)
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Playback error. Please try again.')
        }
      })

      return () => {
        hls.destroy()
        hlsRef.current = null
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      video.src = src
      video.addEventListener('loadedmetadata', () => {
        setIsReady(true)
        if (autoPlay) video.play().catch(() => null)
      })
    } else {
      setError('HLS is not supported in this browser.')
    }
  }, [src, autoPlay])

  function setQualityLevel(index: number) {
    const hls = hlsRef.current
    if (!hls) return
    hls.currentLevel = index
    setCurrentLevel(index)
  }

  function setAutoQuality() {
    const hls = hlsRef.current
    if (!hls) return
    hls.currentLevel = -1
    setCurrentLevel(-1)
  }

  return { videoRef, levels, currentLevel, isReady, error, setQualityLevel, setAutoQuality }
}
