import type { Channel } from '../../types/xg2g'
import type { EPGProgram } from '../../types/xg2g'

interface EPGGridProps {
  channels: Channel[]
  epg: Record<string, EPGProgram[]>
  onSelectChannel: (channel: Channel) => void
  selectedChannelId?: string
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function currentProgram(programs: EPGProgram[]): EPGProgram | undefined {
  const now = Date.now()
  return programs.find((p) => new Date(p.start).getTime() <= now && new Date(p.stop).getTime() >= now)
}

export function EPGGrid({ channels, epg, onSelectChannel, selectedChannelId }: EPGGridProps) {
  return (
    <div className="overflow-y-auto">
      {channels.map((ch) => {
        const programs = epg[ch.id] ?? []
        const current = currentProgram(programs)
        const isSelected = ch.id === selectedChannelId

        return (
          <div
            key={ch.id}
            onClick={() => onSelectChannel(ch)}
            className={`flex items-center gap-4 px-4 py-3 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${isSelected ? 'bg-[var(--color-accent)]/10 border-l-2 border-l-[var(--color-accent)]' : ''}`}
          >
            {ch.logo ? (
              <img src={ch.logo} alt={ch.name} className="w-12 h-8 object-contain flex-shrink-0" />
            ) : (
              <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white/50 text-xs">{ch.name.slice(0, 2).toUpperCase()}</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{ch.name}</p>
              {current ? (
                <p className="text-[var(--color-text-muted)] text-xs truncate">
                  {formatTime(current.start)} — {current.title}
                </p>
              ) : (
                <p className="text-[var(--color-text-muted)] text-xs">No programme info</p>
              )}
            </div>

            {isSelected && (
              <span className="text-[var(--color-accent)] text-xs font-bold flex-shrink-0">LIVE</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
