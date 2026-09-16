const express = require('express')
const router = express.Router()
const { readEntity, writeEntity, withWriteLock, nextId } = require('../lib/jsonStore')

function requireRole(req, res, next) {
  const email = String(req.headers['x-user-email'] || req.query.email || '').trim().toLowerCase()
  const role = String(req.headers['x-user-role'] || '').trim().toLowerCase()
  const users = readEntity('users', [])
  const user = users.find((item) => String(item.email || '').trim().toLowerCase() === email)

  if (!user || user.role !== role || !['admin', 'user'].includes(role)) {
    return res.status(403).json({ message: 'Forbidden: invalid role context.' })
  }

  req.authUser = user
  return next()
}

router.use(requireRole)

router.post('/checkin', async (req, res) => {
  try {
    const { qr_token, event_id } = req.body || {}
    if (!qr_token) {
      return res.status(400).json({ message: 'QR token required' })
    }

    const attendance = readEntity('attendance', [])
    const item = attendance.find((record) => record.qrToken === qr_token)
    if (!item) {
      return res.status(404).json({ message: 'Invalid QR code' })
    }

    const active = attendance.find((record) => record.participant_email === item.participant_email && record.event_id === event_id && record.status === 'checked-in')

    if (active) {
      active.status = 'checked-out'
      active.check_out = new Date().toISOString()
      writeEntity('attendance', attendance)
      return res.json({ message: 'Checked out successfully', status: 'checked-out', timestamp: new Date().toISOString() })
    }

    const record = {
      id: nextId(attendance),
      participant_id: item.participant_id || item.registration_id || null,
      participant_email: item.participant_email || item.email,
      event_id: event_id || item.event_id || null,
      qrToken: qr_token,
      check_in: new Date().toISOString(),
      status: 'checked-in',
      created_at: new Date().toISOString(),
    }

    attendance.push(record)
    writeEntity('attendance', attendance)
    return res.json({ message: 'Checked in successfully', status: 'checked-in', timestamp: new Date().toISOString(), attendance_id: record.id })
  } catch (error) {
    console.error('Error during check-in:', error)
    return res.status(500).json({ message: 'Check-in failed' })
  }
})

router.post('/checkout', async (req, res) => {
  try {
    const { qr_token, event_id } = req.body || {}
    if (!qr_token) {
      return res.status(400).json({ message: 'QR token required' })
    }

    const attendance = readEntity('attendance', [])
    const item = attendance.find((record) => record.qrToken === qr_token)
    if (!item) {
      return res.status(404).json({ message: 'Invalid QR code' })
    }

    const active = attendance.find((record) => record.participant_email === (item.participant_email || item.email) && record.event_id === event_id && record.status === 'checked-in')
    if (!active) {
      return res.status(404).json({ message: 'No active check-in found' })
    }

    active.status = 'checked-out'
    active.check_out = new Date().toISOString()
    writeEntity('attendance', attendance)
    return res.json({ message: 'Checked out successfully', status: 'checked-out', timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Error during check-out:', error)
    return res.status(500).json({ message: 'Check-out failed' })
  }
})

router.get('/record/:id', async (req, res) => {
  try {
    const attendance = readEntity('attendance', [])
    const record = attendance.find((item) => Number(item.id) === Number(req.params.id))
    if (!record) {
      return res.status(404).json({ message: 'Record not found' })
    }
    return res.json(record)
  } catch (error) {
    console.error('Error fetching record:', error)
    return res.status(500).json({ message: 'Failed to fetch record' })
  }
})

module.exports = router
