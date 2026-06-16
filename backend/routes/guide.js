const router = require('express').Router()

const GUIDE_URL = process.env.GUIDE_URL || ''
const M3U_PATH = process.env.GUIDE_M3U_PATH || '/m3u/XEPG.m3u'
const EPG_PATH = process.env.GUIDE_EPG_PATH || '/xmltv/XEPG.xml'

async function fetchGuide(path, res, contentType) {
  if (!GUIDE_URL) return res.status(503).send('')
  try {
    const r = await fetch(`${GUIDE_URL}${path}`, { signal: AbortSignal.timeout(15000) })
    if (!r.ok) return res.status(r.status).send('')
    const text = await r.text()
    res.setHeader('Content-Type', contentType)
    res.send(text)
  } catch {
    res.status(502).send('')
  }
}

// Threadfin M3U playlist (channels + stream URLs pointing to MediaMTX)
router.get('/m3u', (req, res) => fetchGuide(M3U_PATH, res, 'application/x-mpegURL; charset=utf-8'))

// Threadfin XMLTV EPG
router.get('/epg', (req, res) => fetchGuide(EPG_PATH, res, 'application/xml; charset=utf-8'))

module.exports = router
