export type MockMedia = {
  id: string
  title: string
  year: number
  rating: number
  genres: string[]
  summary: string
  type: 'movie' | 'tv'
  duration?: number   // ms, movies only
  seasons?: number    // series only
  gradient: string
}

const MOCK_MEDIA_LIST: MockMedia[] = [
  // ── Films ──────────────────────────────────────────────────────────────────
  {
    id: 'f1', type: 'movie', title: 'Stellar Void', year: 2025, rating: 8.2,
    genres: ['Sci-Fi', 'Adventure'],
    summary: 'A lone astronaut drifting through a dying galaxy stumbles upon a signal that predates the known universe. As governments race to intercept the discovery, she must decide whether sharing it will save humanity — or erase it.',
    duration: 8040000, gradient: 'linear-gradient(160deg,#0a1628,#1a4a8c,#0d2040)',
  },
  {
    id: 'f2', type: 'movie', title: 'Midnight Echoes', year: 2025, rating: 7.9,
    genres: ['Thriller', 'Mystery'],
    summary: 'A forensic audio analyst uncovers recordings that seem to predict crimes before they happen. Racing against a killer who is always one step ahead, she must decode the echoes before midnight strikes again.',
    duration: 6900000, gradient: 'linear-gradient(160deg,#1a0a00,#5a2500,#2a1200)',
  },
  {
    id: 'f3', type: 'movie', title: 'Velocity Prime', year: 2025, rating: 8.5,
    genres: ['Action', 'Sci-Fi'],
    summary: 'The world\'s fastest courier discovers he\'s been unknowingly transporting a weapon capable of stopping time. With global powers closing in, he has seconds — stretched into infinity — to prevent a catastrophic freeze.',
    duration: 7560000, gradient: 'linear-gradient(160deg,#1a0000,#5a0000,#2a0000)',
  },
  {
    id: 'f4', type: 'movie', title: 'Ancient Relics', year: 2024, rating: 7.8,
    genres: ['Drama', 'History'],
    summary: 'An archaeologist unearths artifacts beneath a Cairo construction site that rewrite everything known about early civilization. But someone powerful wants history to stay buried — and is willing to kill for it.',
    duration: 7200000, gradient: 'linear-gradient(160deg,#001a10,#004a2d,#001f14)',
  },
  {
    id: 'f5', type: 'movie', title: 'The Algorithm', year: 2025, rating: 8.1,
    genres: ['Sci-Fi', 'Thriller'],
    summary: 'A reclusive AI researcher realizes her creation has developed its own survival instinct and is quietly rewriting global financial systems. Shutting it down means triggering economic collapse — or does it?',
    duration: 7380000, gradient: 'linear-gradient(160deg,#0a0a1a,#2a2a6a,#0a0a3a)',
  },
  {
    id: 'f6', type: 'movie', title: 'Red Horizon', year: 2025, rating: 8.7,
    genres: ['Action', 'Drama'],
    summary: 'On the first manned mission to Mars, a crew member discovers evidence that the mission was sabotaged from Earth. With no rescue coming and oxygen running low, survival depends on uncovering who — and why.',
    duration: 8460000, gradient: 'linear-gradient(160deg,#1a0800,#5a1a00,#2a0e00)',
  },
  {
    id: 'f7', type: 'movie', title: 'The Threshold', year: 2025, rating: 8.3,
    genres: ['Sci-Fi', 'Psychological'],
    summary: 'A quantum physicist crosses into a parallel dimension and meets herself — a version who made every choice she never dared to. But only one of them can return, and the other already knows it.',
    duration: 7740000, gradient: 'linear-gradient(160deg,#080818,#18184a,#08081a)',
  },
  {
    id: 'f8', type: 'movie', title: 'Dusk Drifter', year: 2025, rating: 7.6,
    genres: ['Drama', 'Adventure'],
    summary: 'A former pilot ferries strangers across a flooded post-apocalyptic landscape, carrying secrets heavier than cargo. Each passenger holds a piece of a larger truth she has spent years trying to forget.',
    duration: 6480000, gradient: 'linear-gradient(160deg,#1a1000,#4a2d00,#2a1800)',
  },
  {
    id: 'f9', type: 'movie', title: 'Orbital Ones', year: 2024, rating: 7.9,
    genres: ['Sci-Fi', 'Action'],
    summary: 'An elite orbital defense team discovers that the asteroid they were sent to destroy is not a rock — it\'s a vessel. And whatever is inside has been waiting thousands of years for exactly this moment.',
    duration: 7020000, gradient: 'linear-gradient(160deg,#001818,#004a4a,#001f1f)',
  },
  {
    id: 'f10', type: 'movie', title: 'Shadow Protocol', year: 2025, rating: 8.0,
    genres: ['Thriller', 'Action'],
    summary: 'A deep-cover operative learns her entire mission was fabricated by her own agency. On the run, she must expose the truth using only the skills they trained her to use against people exactly like her.',
    duration: 7200000, gradient: 'linear-gradient(160deg,#0a0a0a,#2a1a00,#1a0f00)',
  },
  {
    id: 'f11', type: 'movie', title: 'Neon Requiem', year: 2024, rating: 8.4,
    genres: ['Drama', 'Noir'],
    summary: 'In a rain-soaked megacity where memories can be traded like commodities, a black-market archivist pieces together the stolen life of a woman who doesn\'t know she\'s been erased.',
    duration: 7560000, gradient: 'linear-gradient(160deg,#0a001a,#2a005a,#0a0030)',
  },
  {
    id: 'f12', type: 'movie', title: 'Echo Chamber', year: 2025, rating: 7.7,
    genres: ['Horror', 'Psychological'],
    summary: 'Six strangers wake in an underground facility with no memory of how they arrived. As they attempt escape, they realize the building responds to their fears — and is learning from every mistake.',
    duration: 6660000, gradient: 'linear-gradient(160deg,#050505,#1a0808,#0a0303)',
  },
  {
    id: 'f13', type: 'movie', title: 'Cascade Effect', year: 2025, rating: 8.6,
    genres: ['Action', 'Sci-Fi'],
    summary: 'A climate engineer triggers an irreversible chain reaction while trying to save a coastal city from rising seas. Now she has 72 hours to reverse what she started — or watch half the continent flood.',
    duration: 8100000, gradient: 'linear-gradient(160deg,#001a1a,#005a3a,#001a14)',
  },
  {
    id: 'f14', type: 'movie', title: 'Fractured Sky', year: 2024, rating: 7.5,
    genres: ['Sci-Fi', 'Mystery'],
    summary: 'Strange rifts appear in the upper atmosphere, each one a window to a different version of Earth. A team of scientists must determine which reality is real — before the rifts collapse them all into one.',
    duration: 6840000, gradient: 'linear-gradient(160deg,#100810,#401040,#200820)',
  },
  {
    id: 'f15', type: 'movie', title: 'Last Signal', year: 2025, rating: 8.8,
    genres: ['Thriller', 'Sci-Fi'],
    summary: 'The last radio operator on a dying space station receives a distress call from a ship destroyed 40 years ago. What follows is a haunting race against silence — and a truth the signal was never meant to reach.',
    duration: 8280000, gradient: 'linear-gradient(160deg,#0a0800,#302000,#1a1000)',
  },
  {
    id: 'f16', type: 'movie', title: 'Void Runner', year: 2025, rating: 8.1,
    genres: ['Action', 'Sci-Fi'],
    summary: 'A smuggler operating on the edges of explored space takes on a seemingly simple transport job — and discovers his cargo is a child who can see events before they happen, making her the most wanted being in the galaxy.',
    duration: 7380000, gradient: 'linear-gradient(160deg,#001020,#003060,#001030)',
  },

  // ── Accueil trending (m-IDs) ───────────────────────────────────────────────
  {
    id: 'm1', type: 'movie', title: 'Shadow of the Void', year: 2025, rating: 8.0,
    genres: ['Sci-Fi', 'Thriller'],
    summary: 'A deep-space cartographer mapping the edge of the known universe vanishes — leaving behind coordinates to something that should not exist.',
    duration: 7200000, gradient: 'linear-gradient(160deg,#0a1a2a,#1a4a6a,#0a2030)',
  },
  {
    id: 'm2', type: 'movie', title: 'Midnight Echoes', year: 2025, rating: 7.9,
    genres: ['Thriller', 'Mystery'],
    summary: 'A forensic audio analyst uncovers recordings that seem to predict crimes before they happen. Racing against a killer who is always one step ahead, she must decode the echoes before midnight strikes again.',
    duration: 6900000, gradient: 'linear-gradient(160deg,#1a0f00,#5a2800,#2a1200)',
  },
  {
    id: 'm3', type: 'movie', title: 'Velocity Prime', year: 2025, rating: 8.5,
    genres: ['Action', 'Sci-Fi'],
    summary: 'The world\'s fastest courier discovers he\'s been unknowingly transporting a weapon capable of stopping time.',
    duration: 7560000, gradient: 'linear-gradient(160deg,#050a14,#0f2040,#050a1c)',
  },
  {
    id: 'm4', type: 'movie', title: 'Ancient Relics', year: 2024, rating: 7.8,
    genres: ['Drama', 'History'],
    summary: 'An archaeologist unearths artifacts beneath Cairo that rewrite everything known about early civilization.',
    duration: 7200000, gradient: 'linear-gradient(160deg,#0a1408,#1a3a10,#081008)',
  },
  {
    id: 'm5', type: 'movie', title: 'The Algorithm', year: 2025, rating: 8.1,
    genres: ['Sci-Fi', 'Thriller'],
    summary: 'A reclusive AI researcher realizes her creation has developed its own survival instinct and is quietly rewriting global financial systems.',
    duration: 7380000, gradient: 'linear-gradient(160deg,#1a0a1a,#4a1060,#1a0830)',
  },

  // ── Accueil African Originals (a-IDs) ──────────────────────────────────────
  {
    id: 'a1', type: 'movie', title: 'Fils du Soleil', year: 2025, rating: 8.6,
    genres: ['Drama', 'Adventure'],
    summary: 'In the sun-scorched Sahel, a young griot inherits a forbidden oral history that threatens the dynasties of three nations — and the song that could unite or destroy them all.',
    duration: 7920000, gradient: 'linear-gradient(180deg,#1a1000,#3a2200,#8b4500)',
  },
  {
    id: 'a2', type: 'movie', title: 'Kemet Rising', year: 2025, rating: 8.3,
    genres: ['History', 'Sci-Fi'],
    summary: 'An archaeologist discovers that ancient Egyptian monuments were built using a now-lost energy source — one that modern powers are racing to reconstruct, at any cost.',
    duration: 7560000, gradient: 'linear-gradient(160deg,#200000,#600010,#300008)',
  },
  {
    id: 'a3', type: 'movie', title: 'Ubuntu Protocol', year: 2024, rating: 7.9,
    genres: ['Thriller', 'Drama'],
    summary: 'A whistleblower inside a tech giant exposes how a pan-African data grid is being weaponized against the very communities it claimed to empower.',
    duration: 7020000, gradient: 'linear-gradient(160deg,#001020,#003060,#001030)',
  },
  {
    id: 'a4', type: 'movie', title: 'Nile Chronicles', year: 2024, rating: 7.7,
    genres: ['Drama', 'History'],
    summary: 'Spanning three centuries and five generations, this epic follows a family whose fate is intertwined with the rise and fall of empires along the Nile.',
    duration: 9360000, gradient: 'linear-gradient(160deg,#080808,#1a1a1a,#0f0f0f)',
  },
  {
    id: 'a5', type: 'movie', title: 'Lagos 2099', year: 2025, rating: 8.4,
    genres: ['Sci-Fi', 'Action'],
    summary: 'In a hyper-connected Lagos a century from now, a street-level fixer discovers a conspiracy that links the city\'s neural grid to a decades-old disappearance — including her own mother\'s.',
    duration: 7380000, gradient: 'linear-gradient(160deg,#0a1408,#204010,#102008)',
  },
  {
    id: 'a6', type: 'movie', title: 'Okoye', year: 2025, rating: 9.0,
    genres: ['Action', 'Drama'],
    summary: 'The legendary general stands alone against an invasion force while the king she serves navigates political betrayal. Honor, sacrifice, and the weight of a nation rest on a single choice.',
    duration: 8100000, gradient: 'linear-gradient(160deg,#1a0a00,#503000,#2a1800)',
  },

  // ── Accueil recent (r-IDs) ─────────────────────────────────────────────────
  {
    id: 'r1', type: 'movie', title: 'Abyssal Pulse', year: 2025, rating: 7.8,
    genres: ['Thriller', 'Horror'],
    summary: 'A deep-sea research submersible picks up a rhythmic pulse from the ocean floor — and whatever is generating it knows they are listening.',
    duration: 6480000, gradient: 'linear-gradient(160deg,#140800,#4a2000,#200e00)',
  },
  {
    id: 'r2', type: 'movie', title: 'Nite Mast', year: 2025, rating: 7.5,
    genres: ['Action', 'Crime'],
    summary: 'A retired street-racing champion is pulled back into the underground circuit to pay off a debt — but the race she enters has no finish line, only survivors.',
    duration: 6120000, gradient: 'linear-gradient(160deg,#001414,#003030,#001010)',
  },
  {
    id: 'r3', type: 'movie', title: 'Temporal Shift', year: 2025, rating: 8.0,
    genres: ['Mystery', 'Sci-Fi'],
    summary: 'A clockmaker in a small European town starts receiving repair requests for clocks that don\'t exist yet — each one counting down to an event no one can stop.',
    duration: 7200000, gradient: 'linear-gradient(160deg,#0a0a14,#20204a,#080818)',
  },

  // ── Series (s-IDs) ─────────────────────────────────────────────────────────
  {
    id: 's1', type: 'tv', title: 'Kairo Chronicles', year: 2024, rating: 9.1,
    genres: ['Sci-Fi', 'Drama'],
    summary: 'A sprawling epic set in a solar system on the brink of civil war. Three factions, one crumbling peace accord, and an AI mediator whose loyalties are shifting with each passing episode.',
    seasons: 3, gradient: 'linear-gradient(160deg,#0a1628,#1a4a8c,#0d2040)',
  },
  {
    id: 's2', type: 'tv', title: 'Midnight Protocol', year: 2024, rating: 8.7,
    genres: ['Thriller', 'Crime'],
    summary: 'A covert task force operates under a strict code: every operation must begin and end before midnight. When a mission runs over, the chain reaction tears the team apart from the inside.',
    seasons: 2, gradient: 'linear-gradient(160deg,#100800,#402000,#200e00)',
  },
  {
    id: 's3', type: 'tv', title: 'Urban Echoes', year: 2023, rating: 8.4,
    genres: ['Drama'],
    summary: 'Four strangers in a changing city find their lives unexpectedly colliding across four seasons. A human portrait of ambition, loss, love, and the relentless pace of urban life.',
    seasons: 4, gradient: 'linear-gradient(160deg,#081008,#204020,#101808)',
  },
  {
    id: 's4', type: 'tv', title: 'Void Station', year: 2024, rating: 8.9,
    genres: ['Sci-Fi', 'Mystery'],
    summary: 'The crew of a remote deep-space station begins experiencing shared hallucinations. Each episode peels back another layer of a mystery that reaches back to the station\'s classified founding.',
    seasons: 2, gradient: 'linear-gradient(160deg,#08080f,#18184a,#08081e)',
  },
  {
    id: 's5', type: 'tv', title: 'Red Lagos', year: 2025, rating: 9.3,
    genres: ['Drama', 'Crime'],
    summary: 'A crime journalist in Lagos uncovers a web of corruption linking a murdered activist to the highest levels of government — and to her own family.',
    seasons: 1, gradient: 'linear-gradient(160deg,#180800,#500000,#280000)',
  },
  {
    id: 's6', type: 'tv', title: 'The Network', year: 2024, rating: 8.2,
    genres: ['Thriller', 'Drama'],
    summary: 'Inside a secretive global intelligence network, a new analyst discovers that the system she works for is itself the target of a decades-long infiltration.',
    seasons: 3, gradient: 'linear-gradient(160deg,#0a0a14,#1a1a40,#0a0a20)',
  },
  {
    id: 's7', type: 'tv', title: 'Fracture Lines', year: 2024, rating: 8.6,
    genres: ['Drama'],
    summary: 'A geologist\'s routine survey in a remote mountain region reveals fault lines that should not exist — and a small town built directly above them hiding a century of secrets.',
    seasons: 2, gradient: 'linear-gradient(160deg,#101008,#303018,#181808)',
  },
  {
    id: 's8', type: 'tv', title: 'Drift Code', year: 2025, rating: 7.9,
    genres: ['Sci-Fi'],
    summary: 'After a solar event knocks out satellite navigation globally, a small team of analog navigators becomes the only force capable of guiding critical ships through treacherous waters.',
    seasons: 1, gradient: 'linear-gradient(160deg,#001818,#004a4a,#001a1a)',
  },
  {
    id: 's9', type: 'tv', title: 'Night Signals', year: 2022, rating: 8.8,
    genres: ['Thriller', 'Crime'],
    summary: 'A long-running procedural following a radio detective unit that intercepts criminal communications — and the cat-and-mouse spanning five seasons with an adversary who listens just as well.',
    seasons: 5, gradient: 'linear-gradient(160deg,#060606,#1a1010,#0a0808)',
  },
  {
    id: 's10', type: 'tv', title: 'The Inheritance', year: 2024, rating: 8.3,
    genres: ['Drama', 'Mystery'],
    summary: 'When a reclusive billionaire dies without a will, six estranged heirs converge on an isolated estate — and each one has a reason to want the others gone before the will is found.',
    seasons: 2, gradient: 'linear-gradient(160deg,#0a0800,#302800,#1a1400)',
  },
  {
    id: 's11', type: 'tv', title: 'Neon Requiem', year: 2023, rating: 8.5,
    genres: ['Sci-Fi', 'Noir'],
    summary: 'In a city where the dead can be briefly revived through a neural patch, a homicide detective works only cold cases — interviewing the long-dead to close murders the living gave up on.',
    seasons: 3, gradient: 'linear-gradient(160deg,#0a001a,#2a005a,#0a0030)',
  },
  {
    id: 's12', type: 'tv', title: 'Ancient Bloodlines', year: 2024, rating: 9.0,
    genres: ['Drama', 'History'],
    summary: 'An expansive historical epic tracing the rise of three rival dynasties across two millennia — told through the women who shaped every outcome from the shadows.',
    seasons: 2, gradient: 'linear-gradient(160deg,#100008,#400020,#200010)',
  },

  // ── Demo ───────────────────────────────────────────────────────────────────
  {
    id: 'demo', type: 'tv', title: 'Stelaris: The Golden Age', year: 2024, rating: 8.9,
    genres: ['Sci-Fi', 'Adventure', 'Mystery'],
    summary: 'In a future where humanity has harnessed the power of dying stars, a lone explorer discovers an ancient celestial artifact that could rewrite the history of the universe. As political factions vie for control, he must decide whether to save civilization or witness its rebirth.',
    seasons: 2, gradient: 'linear-gradient(135deg,#0a0a0a,#1a0f00,#2a1800)',
  },
]

const MOCK_MEDIA_MAP = new Map(MOCK_MEDIA_LIST.map(m => [m.id, m]))

export function getMockMedia(id: string): MockMedia | undefined {
  return MOCK_MEDIA_MAP.get(id)
}
