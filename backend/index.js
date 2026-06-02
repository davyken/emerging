require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')

const app = express()
const isProd = process.env.NODE_ENV === 'production'

// In dev the Vite proxy handles CORS; in prod same origin so CORS is not needed.
// Only enable CORS explicitly when a custom ORIGIN env var is set.
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))
}

app.use(express.json({ limit: '2mb' }))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

if (isProd) {
  // Serve the Vite build in production
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  // SPA fallback — let React Router handle all non-API routes
  app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')))
} else {
  // In dev the frontend runs on Vite (port 5173) — give a clear hint
  app.get('/', (_, res) => {
    res.send('API server running. Open <a href="http://localhost:5173">http://localhost:5173</a> for the app.')
  })
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
      if (isProd) console.log('Serving frontend from dist/')
    })
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  })
