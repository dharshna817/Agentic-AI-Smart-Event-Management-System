const express = require('express')
const crypto = require('crypto')
const QRCode = require('qrcode')
const router = express.Router()
const { readEntity, writeEntity, withWriteLock, nextId } = require('../lib/jsonStore')

const requireUser = (req, res, next) => {
  const email = String(req.query.email || req.headers['x-user-email'] || '').trim().toLowerCase()
  const role = String(req.headers['x-user-role'] || '').trim().toLowerCase()
  const users = readEntity('users', [])
  const user = users.find((item) => String(item.email || '').trim().toLowerCase() === email)

  if (!user || user.role !== 'user' || role !== 'user') {
    return res.status(403).json({ message: 'User access required.' })
  }

  req.authUser = user
  return next()
}

router.use(requireUser)

function getUserEmail(req) {
  return String(req.query.email || req.headers['x-user-email'] || '').trim().toLowerCase()
}

function pushNotification(payload) {
  const list = readEntity('notifications', [])
  const note = {
    id: nextId(list),
    recipient_email: payload.recipient_email || '',
    recipient_role: payload.recipient_role || 'user',
    title: payload.title || 'Update',
    message: payload.message || '',
    type: payload.type || 'info',
    is_read: false,
    created_at: new Date().toISOString(),
  }
  list.unshift(note)
  writeEntity('notifications', list)
  return note
}

router.get('/dashboard-stats', async (req, res) => {
  try {
    const userEmail = getUserEmail(req)
    if (!userEmail) return res.json({ registeredEvents: 0, upcomingEvents: 0, checkedIn: 0, notifications: 0 })

    const registrations = readEntity('registrations', [])
    const sessions = readEntity('sessions', [])
    const attendance = readEntity('attendance', [])
    const notifications = readEntity('notifications', [])

    const registeredEvents = registrations.filter((entry) => String(entry.email || '').toLowerCase() === userEmail).length
    const upcomingEvents = sessions.filter((session) => {
      const start = new Date(session.start_time)
      return session.status && ['scheduled', 'ACTIVE', 'PUBLISHED'].includes(session.status) && start > new Date()
    }).length
    const checkedIn = attendance.filter((entry) => String(entry.participant_email || '').toLowerCase() === userEmail && ['checked-in', 'checked-out'].includes(entry.status)).length
    const unreadNotifications = notifications.filter((note) => String(note.recipient_email || '').toLowerCase() === userEmail && !note.is_read).length

    return res.json({ registeredEvents, upcomingEvents, checkedIn, notifications: unreadNotifications })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return res.status(500).json({ message: 'Failed to fetch stats' })
  }
})

router.get('/registered-events', async (req, res) => {
  try {
    const userEmail = getUserEmail(req)
    if (!userEmail) return res.json([])

    const registrations = readEntity('registrations', [])
    const events = registrations.filter((entry) => String(entry.email || '').toLowerCase() === userEmail)
    return res.json(events)
  } catch (error) {
    console.error('Error fetching registered events:', error)
    return res.status(500).json({ message: 'Failed to fetch registered events' })
  }
})

router.get('/upcoming-events', async (req, res) => {
  try {
    const sessions = readEntity('sessions', [])
    const upcoming = sessions
      .filter((session) => session.status === 'scheduled' && new Date(session.start_time) > new Date())
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, 20)
    return res.json(upcoming)
  } catch (error) {
    console.error('Error fetching upcoming events:', error)
    return res.status(500).json({ message: 'Failed to fetch upcoming events' })
  }
})

router.post('/qr/generate', async (req, res) => {
  try {
    const user = req.body || {}
    if (!user.id || !user.email) {
      return res.status(400).json({ message: 'Missing user data' })
    }

    const qrToken = crypto.randomBytes(32).toString('hex')
    const qrPayload = JSON.stringify({ userId: user.id, email: user.email, qrToken, timestamp: new Date().toISOString() })
    const qrImage = await QRCode.toDataURL(qrPayload)

    return res.json({ qrToken, qrImage, payload: JSON.parse(qrPayload) })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return res.status(500).json({ message: 'Failed to generate QR code' })
  }
})

router.get('/attendance-history', async (req, res) => {
  try {
    const userEmail = String(req.query.email || '').trim().toLowerCase()
    const attendance = readEntity('attendance', [])
    const history = attendance.filter((entry) => String(entry.participant_email || '').toLowerCase() === userEmail).sort((a, b) => new Date(b.created_at || b.check_in) - new Date(a.created_at || a.check_in))
    return res.json(history)
  } catch (error) {
    console.error('Error fetching attendance history:', error)
    return res.status(500).json({ message: 'Failed to fetch attendance history' })
  }
})

router.get('/notifications', async (req, res) => {
  try {
    const userEmail = String(req.query.email || '').trim().toLowerCase()
    const notifications = readEntity('notifications', [])
    const filtered = notifications.filter((note) => (String(note.recipient_email || '').toLowerCase() === userEmail) || (note.recipient_role === 'user'))
    return res.json(filtered.sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0)))
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return res.status(500).json({ message: 'Failed to fetch notifications' })
  }
})

router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notifications = readEntity('notifications', [])
    const note = notifications.find((item) => Number(item.id) === Number(req.params.id))
    if (!note) {
      return res.status(404).json({ message: 'Notification not found' })
    }
    note.is_read = true
    writeEntity('notifications', notifications)
    return res.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error('Error updating notification:', error)
    return res.status(500).json({ message: 'Failed to update notification' })
  }
})

router.get('/profile', async (req, res) => {
  try {
    const userEmail = String(req.query.email || '').trim().toLowerCase()
    const users = readEntity('users', [])
    const user = users.find((entry) => String(entry.email || '').trim().toLowerCase() === userEmail)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    return res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone || '' })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return res.status(500).json({ message: 'Failed to fetch profile' })
  }
})

router.put('/profile', async (req, res) => {
  try {
    const { name, email, phone } = req.body || {}
    if (!email) return res.status(400).json({ message: 'Email required' })

    const users = readEntity('users', [])
    const user = users.find((entry) => String(entry.email || '').trim().toLowerCase() === String(email).trim().toLowerCase())
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.name = name || user.name
    user.phone = phone || user.phone
    writeEntity('users', users)
    return res.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Error updating profile:', error)
    return res.status(500).json({ message: 'Failed to update profile' })
  }
})

router.post('/feedback', async (req, res) => {
  try {
    const { session_id, user_email, rating, comment } = req.body || {}
    if (!session_id || !user_email || !rating) {
      return res.status(400).json({ message: 'session_id, user_email and rating are required' })
    }

    const sessions = readEntity('sessions', [])
    const session = sessions.find((entry) => Number(entry.session_id) === Number(session_id))
    if (!session) return res.status(404).json({ message: 'Session not found' })
    if (new Date(session.end_time) > new Date()) {
      return res.status(409).json({ message: 'Feedback can only be submitted after the session has completed.' })
    }

    const feedbackList = readEntity('feedback', [])
    const existing = feedbackList.find((entry) => Number(entry.session_id) === Number(session_id) && String(entry.user_email || '').toLowerCase() === String(user_email).trim().toLowerCase())
    if (existing) {
      return res.status(409).json({ message: 'Feedback already submitted for this session.' })
    }

    const item = {
      id: nextId(feedbackList),
      session_id: Number(session_id),
      user_email: String(user_email).trim().toLowerCase(),
      rating: Number(rating),
      comment: comment || '',
      created_at: new Date().toISOString(),
    }
    feedbackList.push(item)
    writeEntity('feedback', feedbackList)

    pushNotification({
      recipient_email: user_email,
      recipient_role: 'user',
      title: 'Session feedback received',
      message: 'Thank you for sharing your feedback on this session.',
      type: 'info',
    })

    return res.status(201).json({ success: true, feedback: item })
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return res.status(500).json({ message: 'Failed to submit feedback' })
  }
})

module.exports = router

