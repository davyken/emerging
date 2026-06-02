const router = require('express').Router()

const HOST = process.env.VITE_XTREAM_HOST || ''
const USER = process.env.VITE_XTREAM_USERNAME || ''
const PASS = process.env.VITE_XTREAM_PASSWORD || ''

// Proxy all Xtream player_api.php calls — keeps credentials off the client
// and avoids mixed-content blocks when the app runs on HTTPS
router.get('/', async (req, res) => {
  if (!HOST) return res.status(503).json({ message: 'Xtream not configured' })
  const params = new URLSearchParams({ username: USER, password: PASS, ...req.query })
  const url = `${HOST}/player_api.php?${params}`
  try {
    const upstream = await fetch(url)
    const data = await upstream.json()
    res.json(data)
  } catch {
    res.status(502).json({ message: 'Xtream server unreachable' })
  }
})

module.exports = router
