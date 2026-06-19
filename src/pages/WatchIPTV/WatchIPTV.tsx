import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Hls from 'hls.js'
import { getChannels, getEPG, openChannelStream } from '../../services/xg2gApi'
import type { Channel, EPGProgram } from '../../types/xg2g'
import { getPopularMovies, tmdbImg } from '../../services/tmdbApi'
import type { TmdbMovie } from '../../types/tmdb'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatSecs(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

const QUALITY_OPTIONS = ['Auto', '1080p', '720p', '480p', '360p']

export function WatchIPTV() {
  const { channelId } = useParams<{ channelId: string }>()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [channel, setChannel] = useState<Channel | null>(null)
  const [schedule, setSchedule] = useState<EPGProgram[]>([])
  const [playing, setPlaying] = useState(true)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [quality, setQuality] = useState('1080p')
  const [showControls, setShowControls] = useState(true)
  const [showSchedule, setShowSchedule] = useState(window.innerWidth >= 640)
  const [showMovies, setShowMovies] = useState(false)
  const [movies, setMovies] = useState<TmdbMovie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [streamError, setStreamError] = useState(false)
  const [streamLoading, setStreamLoading] = useState(true)
  const retryCountRef = useRef(0)

  useEffect(() => {
    async function load() {
      try {
        const [chs, epg, popMovies] = await Promise.all([getChannels(), getEPG(), getPopularMovies()])
        const found = chs.find((c) => c.id === channelId)
        if (found) setChannel(found)
        if (channelId && epg[channelId]) setSchedule(epg[channelId])
        setMovies(popMovies.slice(0, 10))
      } catch {} finally {
        setIsLoading(false)
      }
    }
    load()
  }, [channelId])

  const startStream = async (id: string) => {
    const video = videoRef.current
    if (!video) return
    setStreamError(false)
    setStreamLoading(true)
    retryCountRef.current = 0

    const src = await openChannelStream(id)

    if (Hls.isSupported()) {
      hlsRef.current?.destroy()
      const hls = new Hls({
        // Manifest loading — tight timeout for fast failure
        manifestLoadingTimeOut: 8000,
        manifestLoadingMaxRetry: 1,
        manifestLoadingRetryDelay: 1000,
        // Level (media playlist) loading
        levelLoadingTimeOut: 8000,
        levelLoadingMaxRetry: 2,
        levelLoadingRetryDelay: 1500,
        // Fragment loading
        fragLoadingTimeOut: 12000,
        fragLoadingMaxRetry: 2,
        // Live stream settings
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        enableWorker: true,
        lowLatencyMode: false,
        xhrSetup: (xhr) => {
          xhr.withCredentials = true
        },
      })
      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStreamLoading(false)
        video.play().catch(() => null)
      })

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        setStreamLoading(false)
        setStreamError(false)
      })

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('HLS error:', data.type, data.details, data.fatal)
        if (!data.fatal) return

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          retryCountRef.current += 1
          if (retryCountRef.current <= 2) {
            console.log(`HLS network error — retry ${retryCountRef.current}/2`)
            setTimeout(() => hls.startLoad(), 1500)
          } else {
            hls.destroy()
            setStreamError(true)
            setStreamLoading(false)
          }
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError()
        } else {
          hls.destroy()
          setStreamError(true)
          setStreamLoading(false)
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = src
      video.addEventListener('loadedmetadata', () => setStreamLoading(false), { once: true })
      video.addEventListener('error', () => { setStreamError(true); setStreamLoading(false) }, { once: true })
      video.play().catch(() => null)
    } else {
      setStreamError(true)
      setStreamLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    // startStream est async : on ne peut pas la passer directement à useEffect
    // On la lance et on ignore le résultat si le composant se démonte entre-temps
    startStream(channelId ?? 'demo').catch(() => {
      if (!cancelled) { setStreamError(true); setStreamLoading(false) }
    })
    return () => {
      cancelled = true
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [channelId])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [])

  function resetHideTimer() {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 3000)
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    playing ? video.pause() : video.play()
  }

  const nowPlaying = schedule.find((p) => {
    const n = Date.now()
    return new Date(p.start).getTime() <= n && new Date(p.stop).getTime() >= n
  }) ?? schedule[0]

  const upcoming = schedule.filter((p) => new Date(p.start).getTime() > Date.now())
  const liveProgress = nowPlaying
    ? Math.max(0, Math.min(100,
        (Date.now() - new Date(nowPlaying.start).getTime()) /
        (new Date(nowPlaying.stop).getTime() - new Date(nowPlaying.start).getTime()) * 100
      ))
    : 0

  const liveTotal = nowPlaying
    ? (new Date(nowPlaying.stop).getTime() - new Date(nowPlaying.start).getTime()) / 1000
    : 4500
  const liveElapsed = nowPlaying
    ? (Date.now() - new Date(nowPlaying.start).getTime()) / 1000
    : 2892

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{ background: '#000', cursor: showControls ? 'default' : 'none' }}
      onMouseMove={resetHideTimer}
      onClick={togglePlay}
    >
      {/* Initial data loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: '#000' }}>
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--color-gold)' }} />
        </div>
      )}

      {/* Stream error overlay */}
      {!isLoading && streamError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(0,0,0,0.92)' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-1" style={{ background: 'rgba(255,50,50,0.15)', border: '1px solid rgba(255,50,50,0.3)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff5555" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          </div>
          <p className="text-white font-semibold text-sm">{channel?.name || 'Chaîne'} indisponible</p>
          <p className="text-xs text-center max-w-xs" style={{ color: '#666' }}>
            Le flux est inaccessible. Vérifiez que votre abonnement Xtream est actif et que la chaîne est disponible.
          </p>
          <button
            onClick={() => { startStream(channelId ?? 'demo') }}
            className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black transition-opacity hover:opacity-80"
            style={{ background: 'var(--color-gold)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" /></svg>
            Réessayer
          </button>
          <button
            onClick={() => navigate('/direct')}
            className="text-xs underline" style={{ color: '#555' }}
          >
            Retour au guide TV
          </button>
        </div>
      )}

      {/* Stream buffering spinner (only shown while HLS is loading, after initial load) */}
      {!isLoading && !streamError && streamLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.15)', borderTopColor: 'var(--color-gold)', borderWidth: '3px' }} />
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Démarrage du flux…
          </p>
        </div>
      )}

      {/* Video */}
      <video ref={videoRef} className="w-full h-full object-contain" playsInline style={{ position: 'relative', zIndex: 10 }} />

      {/* Demo background */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 40% 50%, #003a3a 0%, #001a1a 40%, #000a0a 100%)', zIndex: 0 }} />

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center px-3 sm:px-6 h-12 sm:h-14 z-20 transition-opacity duration-300"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', opacity: showControls ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => navigate('/direct')}
          className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors mr-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          <span className="hidden sm:inline">Guide TV</span>
        </button>

        <img src="/logo.png" alt="EmergingStream" style={{ height: '20px', width: 'auto' }} className="flex-shrink-0" />

        <div className="flex-1" />

        {/* Channel badge */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(255,30,30,0.2)', color: '#ff5555', border: '1px solid rgba(255,30,30,0.3)' }}>
            ● LIVE
          </span>
          <span className="text-xs font-semibold text-white hidden sm:block">{channel?.name || 'Chargement...'}</span>
        </div>
      </div>

      {/* Schedule panel — desktop: right sidebar, mobile: bottom overlay */}
      {showSchedule && (
        <div
          className="absolute z-20 overflow-hidden rounded-xl transition-opacity duration-300"
          style={{
            ...(window.innerWidth < 640
              ? { left: 0, right: 0, bottom: '4rem', maxHeight: '45vh' }
              : { top: '3.5rem', right: '1rem', bottom: '5rem', width: '240px' }
            ),
            background: 'rgba(10,10,10,0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            opacity: showControls ? 1 : 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Now playing header */}
          <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(255,30,30,0.2)', color: '#ff5555', border: '1px solid rgba(255,30,30,0.3)' }}>
                ● LIVE
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">{channel?.name || 'Chargement...'}</span>
                {/* Close button on mobile */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSchedule(false) }}
                  className="sm:hidden w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#555' }}>En cours</p>
            <p className="text-xs font-bold text-white mb-0.5">{nowPlaying?.title || channel?.name || 'En cours'}</p>
            <p className="text-[10px]" style={{ color: '#666' }}>
              {nowPlaying ? `${formatTime(nowPlaying.start)} - ${formatTime(nowPlaying.stop)}` : '21:00 - 23:15'}
            </p>
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full" style={{ width: `${liveProgress}%`, background: 'var(--color-gold)' }} />
            </div>
          </div>

          {/* Schedule */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 120px)' }}>
            {upcoming.map((prog, i) => {
              const dur = Math.round((new Date(prog.stop).getTime() - new Date(prog.start).getTime()) / 60000)
              return (
                <div key={i} className="px-3 py-3 cursor-pointer hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium" style={{ color: '#888' }}>{formatTime(prog.start)}</span>
                    <span className="text-[10px]" style={{ color: '#555' }}>{dur} min</span>
                  </div>
                  <p className="text-xs font-semibold text-white">{prog.title}</p>
                  {prog.description && <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: '#555' }}>{prog.description}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom left: channel info */}
      <div
        className="absolute bottom-16 sm:bottom-20 left-3 sm:left-6 z-20 transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-end gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden" style={{ background: '#700', color: 'white' }}>
            {channel?.logo
              ? <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain p-0.5" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              : (channel?.name || 'CH').slice(0, 2).toUpperCase()
            }
          </div>
          <div>
            <p className="text-sm font-bold text-white">{nowPlaying?.title || channel?.name || 'En cours'}</p>
            {nowPlaying && <p className="text-xs hidden sm:block" style={{ color: '#888' }}>{formatTime(nowPlaying.start)} - {formatTime(nowPlaying.stop)}</p>}
            {nowPlaying?.description && (
              <p className="text-[10px] max-w-[200px] sm:max-w-xs line-clamp-2 mt-0.5 hidden sm:block" style={{ color: '#666' }}>{nowPlaying.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Movies panel */}
      {showMovies && (
        <div
          className="absolute left-0 right-0 z-20 transition-opacity duration-300"
          style={{ bottom: '4.5rem', opacity: showControls ? 1 : 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="mx-3 sm:mx-6 rounded-xl overflow-hidden"
            style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2"><path d="M15 10l4.553-2.169A1 1 0 0 1 21 8.723v6.554a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" /></svg>
                <p className="text-xs font-semibold text-white">Films recommandés</p>
              </div>
              <button
                onClick={() => setShowMovies(false)}
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="flex gap-3 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {movies.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/watch/movie/${m.id}`)}
                  className="flex-shrink-0 text-left group"
                >
                  <div
                    className="rounded-lg overflow-hidden relative mb-1.5 transition-all group-hover:scale-105"
                    style={{ width: 90, aspectRatio: '2/3', background: '#222' }}
                  >
                    {m.poster_path && (
                      <img src={tmdbImg(m.poster_path, 'w185') || undefined} alt={m.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.9)' }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21" /></svg>
                      </div>
                    </div>
                    {m.vote_average > 0 && (
                      <div className="absolute top-1.5 left-1.5">
                        <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.75)', color: '#aaa' }}>★ {m.vote_average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-semibold text-white truncate" style={{ maxWidth: 90 }}>{m.title}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: '#555' }}>{m.release_date ? m.release_date.split('-')[0] : ''}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 pb-3 sm:pb-4 transition-opacity duration-300"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', opacity: showControls ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress */}
        <div className="px-3 sm:px-6 mb-2 sm:mb-3">
          <div className="relative h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${liveProgress}%`, background: 'var(--color-gold)' }} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center px-3 sm:px-6 gap-2 sm:gap-4">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-gray-300 transition-colors flex-shrink-0">
            {playing
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
            }
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => { const v = videoRef.current; if(v){ v.muted=!v.muted; setMuted(v.muted) }}}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              {muted
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
              }
            </button>
            <input
              type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={(e) => { const v = Number(e.target.value); setVolume(v); if(videoRef.current){ videoRef.current.volume = v; videoRef.current.muted = v===0 }}}
              className="hidden sm:block w-16 h-1 cursor-pointer"
              style={{ accentColor: 'white' }}
            />
          </div>

          {/* Time */}
          <span className="text-xs font-mono flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {formatSecs(liveElapsed)} / {formatSecs(liveTotal)}
          </span>

          <div className="flex-1" />

          {/* Quality — desktop only */}
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="hidden sm:block text-xs px-2 py-1 rounded outline-none"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {QUALITY_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>

          {/* Movies toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowMovies(v => !v); setShowSchedule(false) }}
            className="flex items-center gap-1.5 text-xs font-medium px-2 sm:px-3 py-1 rounded transition-colors flex-shrink-0"
            style={{
              background: showMovies ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.1)',
              color: showMovies ? 'var(--color-gold)' : 'white',
              border: showMovies ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2" /><path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5" /></svg>
            <span className="hidden sm:inline">Films</span>
          </button>

          {/* Schedule toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowSchedule(v => !v); setShowMovies(false) }}
            className="flex items-center gap-1.5 text-xs font-medium px-2 sm:px-3 py-1 rounded transition-colors flex-shrink-0"
            style={{
              background: showSchedule ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.1)',
              color: showSchedule ? 'var(--color-gold)' : 'white',
              border: showSchedule ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <span className="hidden sm:inline">Programme</span>
          </button>

          {/* Settings */}
          <button className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => containerRef.current?.requestFullscreen?.()}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
