const crypto = require('crypto')
const router = require('express').Router()
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const User = require('../models/User')

function makeTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  })
}

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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await User.findOne({ email: email.toLowerCase() })
    // Always return success to avoid exposing which emails are registered
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' })

    const token = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = token
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await user.save({ validateBeforeSave: false })

    const appUrl = process.env.APP_URL || 'http://localhost:5173'
    const resetUrl = `${appUrl}/reset-password/${token}`

    try {
      await makeTransporter().sendMail({
        from: `"EmergingStream" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Reset your password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#C9A84C">EmergingStream</h2>
            <p>You requested a password reset. Click the button below — the link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#C9A84C;color:#000;font-weight:bold;border-radius:6px;text-decoration:none;margin:16px 0">Reset Password</a>
            <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
          </div>
        `,
      })
    } catch (mailErr) {
      console.error('Email send error:', mailErr.message)
      // Clear the token if we can't send the email
      user.resetPasswordToken = undefined
      user.resetPasswordExpire = undefined
      await user.save({ validateBeforeSave: false })
      return res.status(500).json({ message: 'Could not send reset email. Check server email config.' })
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: new Date() },
    }).select('+password')

    if (!user) return res.status(400).json({ message: 'Reset link is invalid or has expired' })

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    const newToken = signToken(user._id)
    res.json({ message: 'Password updated successfully', token: newToken })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
