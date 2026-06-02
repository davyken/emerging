const router = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }

    const user = await User.create({ name, email, password })
    const token = signToken(user._id)

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        language: user.language,
        plan: user.plan,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    })
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(e => e.message).join(', ')
      return res.status(400).json({ message })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/username and password are required' })
    }

    const user = await User.findOne({ email: identifier.toLowerCase() }).select('+password')
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const match = await user.comparePassword(password)
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = signToken(user._id)

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        language: user.language,
        plan: user.plan,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
