const router = require('express').Router()
const bcrypt = require('bcryptjs')
const authMiddleware = require('../middleware/auth')
const User = require('../models/User')

// All routes below require a valid JWT
router.use(authMiddleware)

// GET /api/user/profile — return the logged-in user's data
router.get('/profile', (req, res) => {
  const user = req.user
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    language: user.language,
    plan: user.plan,
    bio: user.bio,
    createdAt: user.createdAt,
  })
})

// PUT /api/user/profile — update name, email, bio, language, avatar
router.put('/profile', async (req, res) => {
  try {
    const { name, email, bio, language, avatar } = req.body
    const updates = {}

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ message: 'Name cannot be empty' })
      updates.name = name.trim()
    }
    if (email !== undefined) {
      if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Invalid email format' })
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } })
      if (existing) return res.status(409).json({ message: 'Email already in use by another account' })
      updates.email = email.toLowerCase().trim()
    }
    if (bio !== undefined) updates.bio = bio.slice(0, 200)
    if (language !== undefined && ['en', 'fr'].includes(language)) updates.language = language
    if (avatar !== undefined) updates.avatar = avatar

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      language: user.language,
      plan: user.plan,
      bio: user.bio,
      createdAt: user.createdAt,
    })
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(e => e.message).join(', ')
      return res.status(400).json({ message })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// PUT /api/user/password — change password
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' })
    }

    const user = await User.findById(req.user._id).select('+password')
    const match = await user.comparePassword(currentPassword)
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' })

    user.password = newPassword
    await user.save()

    res.json({ message: 'Password updated successfully' })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
