import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getChannels, getEPG } from '../../services/xg2gApi'
import type { Channel, EPGProgram } from '../../types/xg2g'
import { useLanguage } from '../../i18n/LanguageContext'

const FR_GROUP_KEYS = ['all', 'Divertissement', 'Sport', 'Actualités', 'Films', 'Documentaires', 'Enfants']

function getChannelCategory(ch: Channel): string {
  const search = (ch.name + ' ' + (ch.group || '')).toLowerCase()
  if (/(sport|bein|espn|eurosport|golf|tennis|auto|moto|combat|ufc)/.test(search)) return 'Sport'
  if (/(news|actualité|info|bfm|lci|cnews|cnn|bbc|france 24|sky news|al jazeera)/.test(search)) return 'Actualités'
  if (/(film|ciné|cinema|hbo|movie|action|premier|osn|netflix|paramount)/.test(search)) return 'Films'
  if (/(doc|nat geo|animaux|discovery|histoire|science|voyage|geo|ushua|planete)/.test(search)) return 'Documentaires'
  if (/(enfant|kid|disney|toon|gulli|nickelodeon|boing|tiji|piwi|baby)/.test(search)) return 'Enfants'
  return 'Divertissement'
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function ChannelProgress({ start, stop }: { start: string; stop: string }) {
  const now = Date.now()
  const s = new Date(start).getTime()
  const e = new Date(stop).getTime()
  const pct = Math.max(0, Math.min(100, ((now - s) / (e - s)) * 100))
  return (
    <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--color-teal)' }} />
    </div>
  )
}

export function TVGuide() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [channels, setChannels] = useState<Channel[]>([])
  const [epg, setEpg] = useState<Record<string, EPGProgram[]>>({})
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([getChannels(), getEPG()])
      .then(([chs, epgData]) => {
        if (chs.length > 0) setChannels(chs)
        if (Object.keys(epgData).length > 0) setEpg(epgData)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const filtered =
    categoryIndex === 0
      ? channels
      : channels.filter((c) => getChannelCategory(c) === FR_GROUP_KEYS[categoryIndex])

  function currentProg(channelId: string): EPGProgram | undefined {
    const now = Date.now()
    return (epg[channelId] ?? []).find(
      (p) => new Date(p.start).getTime() <= now && new Date(p.stop).getTime() >= now
    )
  }

  const nowTime = Date.now()
  const upcomingList = Object.values(epg)
    .flat()
    .filter(p => new Date(p.start).getTime() > nowTime)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3)

  const dynamicUpcoming = upcomingList.map((prog, i) => {
    const ch = channels.find(c => c.id === prog.channelId)
    const minToStart = Math.max(0, Math.round((new Date(prog.start).getTime() - nowTime) / 60000))
    const badges = [
      { color: 'var(--color-teal)', grad: 'linear-gradient(135deg,#0a0a1a,#1a1a5a,#0d0d3a)' },
      { color: '#e05a00', grad: 'linear-gradient(135deg,#1a0800,#4a1500,#2a0a00)' },
      { color: '#0060c0', grad: 'linear-gradient(135deg,#001020,#002060,#001030)' },
    ]
    const b = badges[i % badges.length]
    return {
      id: prog.channelId + '_' + i,
      channelId: prog.channelId,
      title: prog.title,
      badge: minToStart === 0 ? 'MAINTENANT' : `DANS ${minToStart} MIN`,
      badgeColor: b.color,
      gradient: b.grad,
      desc: ch ? `Débute dans ${minToStart}mn sur ${ch.name}` : ''
    }
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)', color: 'white' }}>
      {/* Mobile: horizontal category chips */}
      <div className="flex gap-2 overflow-x-auto px-3 pt-3 pb-2 md:hidden" style={{ scrollbarWidth: 'none' }}>
        {t.tvGuide.categoryList.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setCategoryIndex(idx)}
            className="text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 transition-all"
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

      <div className="flex">
        {/* Category sidebar — desktop only */}
        <div className="hidden md:flex flex-col flex-shrink-0 px-3 py-5" style={{ width: '180px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] tracking-widest uppercase mb-3 px-2" style={{ color: '#555' }}>{t.tvGuide.categoriesLabel}</p>
          {t.tvGuide.categoryList.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setCategoryIndex(idx)}
              className="w-full text-left text-xs px-3 py-2.5 rounded-lg mb-0.5 transition-all font-medium"
              style={{
                color: categoryIndex === idx ? 'white' : '#666',
                background: categoryIndex === idx ? 'rgba(201,168,76,0.15)' : 'transparent',
                borderLeft: categoryIndex === idx ? '2px solid var(--color-gold)' : '2px solid transparent',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 md:p-6">
          {/* Channels header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white">{t.tvGuide.liveChannels}</h2>
            <div className="flex gap-1">
              <button onClick={() => setViewMode('grid')} className="p-2 rounded-lg transition-colors" style={{ background: viewMode === 'grid' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode === 'grid' ? 'white' : '#555' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
              </button>
              <button onClick={() => setViewMode('list')} className="p-2 rounded-lg transition-colors" style={{ background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode === 'list' ? 'white' : '#555' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--color-gold)' }} />
            </div>
          ) : (
            <>
              {/* Channel grid */}
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10' : 'flex flex-col gap-2 mb-10'}>
                {filtered.map((ch, i) => {
              const prog = currentProg(ch.id)
              const isHBO = ch.id === 'hbo'
              return (
                <button
                  key={ch.id}
                  onClick={() => navigate(`/watch-tv/${ch.id}`)}
                  className="text-left rounded-xl p-4 transition-all hover:border-opacity-30 group"
                  style={{
                    background: '#141414',
                    border: isHBO ? '1px solid var(--color-teal)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: ['#c00','#2a0060','#007000','#004090','#700000','#600040'][i % 6], color: 'white' }}>
                        {ch.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{ch.name}</p>
                        {prog && <p className="text-[10px] mt-0.5 text-gray-500">{formatTime(prog.start)}</p>}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(255,0,0,0.15)', color: '#ff5555', border: '1px solid rgba(255,0,0,0.2)' }}>
                      ● LIVE
                    </span>
                  </div>
                  {prog && (
                    <>
                      <p className="text-xs text-white font-medium mb-1 line-clamp-1">{prog.title}</p>
                      <ChannelProgress start={prog.start} stop={prog.stop} />
                    </>
                  )}
                </button>
              )
            })}
          </div>

          {/* Coming up */}
          {dynamicUpcoming.length > 0 && (
            <div className="mb-6">
              <h2 className="text-base font-bold text-white mb-5">{t.tvGuide.comingUp}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dynamicUpcoming.map((item, i) => (
                  <div key={item.id} onClick={() => navigate(`/watch-tv/${item.channelId}`)} className={`rounded-xl overflow-hidden relative cursor-pointer group ${i === 0 ? 'md:col-span-1 md:row-span-1' : ''}`} style={{ aspectRatio: i === 0 ? '4/3' : '16/9', background: item.gradient }}>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: item.badgeColor, color: '#fff' }}>{item.badge}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      {item.desc && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.desc}</p>}
                    </div>
                    {i > 0 && (
                      <div className="absolute bottom-3 right-3 flex gap-1.5">
                        <button className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  </div>
</div>
)
}
