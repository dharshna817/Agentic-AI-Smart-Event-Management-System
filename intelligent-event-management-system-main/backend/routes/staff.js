const express = require('express')
const crypto = require('crypto')
const router = express.Router()
const { readEntity, writeEntity } = require('../lib/jsonStore')

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex')
  return `${salt}:${hash}`
}

function comparePassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false
  if (!storedHash.includes(':')) {
    return String(password) === storedHash
  }

  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false

  const derived = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex')

  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(derived, 'hex')
  )
}

function getUserByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) return null

  const users = readEntity('users', [])
  return users.find((user) => String(user.email || '').trim().toLowerCase() === normalizedEmail) || null
}

function getStaffFromRequest(req) {
  const email = String(req.query.email || req.headers['x-user-email'] || '').trim().toLowerCase()
  const role = String(req.headers['x-user-role'] || '').trim().toLowerCase()
  const user = getUserByEmail(email)

  if (!user || user.role !== 'staff' || role !== 'staff') {
    return null
  }

  return user
}

function normalizeIncidentStatus(status) {
  const value = String(status || '').trim().toUpperCase()
  if (!value) return 'ASSIGNED'
  if (value === 'WAITING_FOR_ADMIN_VERIFICATION') return 'WAITING FOR ADMIN VERIFICATION'
  return value
}

function isAssignedToStaff(incident, staff) {
  if (!incident || !staff) return false

  const staffId = Number(staff.id)
  const assignedId = Number(incident.assigned_staff_id ?? incident.assigned_technician_id ?? 0)
  const assignedEmail = String(incident.assigned_staff_email || incident.assigned_technician_email || '').trim().toLowerCase()
  const assignedName = String(incident.assigned_staff_name || incident.assigned_technician_name || '').trim().toLowerCase()
  const staffEmail = String(staff.email || '').trim().toLowerCase()
  const staffName = String(staff.name || '').trim().toLowerCase()

  return assignedId === staffId || assignedEmail === staffEmail || assignedName === staffName
}

function getStaffIncidents(staff) {
  const incidents = readEntity('incidents', [])
  return incidents.filter((incident) => isAssignedToStaff(incident, staff))
}

function addStaffNotification(staff, title, message, type = 'info') {
  try {
    const notifications = readEntity('notifications', [])
    notifications.unshift({
      id: Date.now(),
      recipient_email: staff.email,
      recipient_role: 'staff',
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    })
    writeEntity('notifications', notifications)
  } catch (error) {
    console.error('Failed to create staff notification:', error)
  }
}

function buildIncidentTimeline(incident) {
  const timeline = [
    { action: 'Incident Reported', actor: incident.user_name || 'Participant', timestamp: incident.created_at || new Date().toISOString(), description: 'Incident was reported by the event participant.' },
  ]

  if (incident.assigned_staff_name || incident.assigned_staff_email || incident.assigned_technician_name) {
    timeline.push({
      action: 'Incident Assigned',
      actor: incident.assigned_staff_name || incident.assigned_technician_name || 'Staff Team',
      timestamp: incident.updated_at || incident.created_at || new Date().toISOString(),
      description: 'The incident was assigned to the responsible staff member.',
    })
  }

  const status = String(incident.status || '').trim().toUpperCase()
  if (status === 'ACCEPTED' || status === 'IN PROGRESS' || status === 'RESOLVED' || status === 'WAITING FOR ADMIN VERIFICATION') {
    timeline.push({
      action: 'Assignment Accepted',
      actor: incident.assigned_staff_name || 'Assigned Staff',
      timestamp: incident.updated_at || new Date().toISOString(),
      description: 'The assigned staff member accepted the incident.'
    })
  }

  if (status === 'IN PROGRESS' || status === 'RESOLVED' || status === 'WAITING FOR ADMIN VERIFICATION') {
    timeline.push({
      action: 'Investigation Started',
      actor: incident.assigned_staff_name || 'Assigned Staff',
      timestamp: incident.updated_at || new Date().toISOString(),
      description: 'The assigned staff member started investigating the incident.'
    })
  }

  if (Array.isArray(incident.progress_notes) && incident.progress_notes.length) {
    incident.progress_notes.forEach((note) => {
      timeline.push({
        action: 'Progress Note Added',
        actor: note.staff_name || 'Assigned Staff',
        timestamp: note.timestamp || new Date().toISOString(),
        description: note.note || 'Progress update recorded.'
      })
    })
  }

  if (status === 'RESOLVED' || status === 'WAITING FOR ADMIN VERIFICATION') {
    timeline.push({
      action: 'Incident Resolved',
      actor: incident.assigned_staff_name || 'Assigned Staff',
      timestamp: incident.resolved_at || incident.updated_at || new Date().toISOString(),
      description: incident.resolution_description || 'The issue was resolved by the assigned staff member.'
    })
  }

  if (status === 'WAITING FOR ADMIN VERIFICATION') {
    timeline.push({
      action: 'Waiting for Admin Verification',
      actor: 'Admin',
      timestamp: incident.updated_at || new Date().toISOString(),
      description: 'The staff resolution is awaiting admin verification.'
    })
  }

  return timeline
}

function isAllowedStaffTransition(currentStatus, nextStatus) {
  const current = String(currentStatus || '').trim().toUpperCase()
  const next = String(nextStatus || '').trim().toUpperCase()

  const allowed = {
    ASSIGNED: ['ACCEPTED'],
    ACCEPTED: ['IN PROGRESS'],
    'IN PROGRESS': ['RESOLVED'],
    RESOLVED: ['WAITING FOR ADMIN VERIFICATION'],
  }

  return (allowed[current] || []).includes(next)
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const user = getUserByEmail(email)
    if (!user || user.role !== 'staff') {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const validPassword = comparePassword(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    if (!String(user.password || '').includes(':')) {
      const users = readEntity('users', [])
      const index = users.findIndex((item) => Number(item.id) === Number(user.id))
      if (index >= 0) {
        users[index].password = hashPassword(password)
        writeEntity('users', users)
      }
    }

    return res.json({
      message: 'Staff login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        department: user.department || 'Technical Support',
        status: user.status || 'Active',
      },
    })
  } catch (error) {
    console.error('Error during staff login:', error)
    return res.status(500).json({ message: 'Internal server error during login.' })
  }
})

router.get('/overview', async (req, res) => {
  try {
    const staff = getStaffFromRequest(req)
    if (!staff) {
      return res.status(403).json({ message: 'Staff access required.' })
    }

    const incidents = getStaffIncidents(staff).sort((a, b) => new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at))
    const openIncidents = incidents.filter((incident) => !['RESOLVED', 'VERIFIED', 'CLOSED', 'WAITING FOR ADMIN VERIFICATION'].includes(String(incident.status || '').trim().toUpperCase()))
    const highPriority = incidents.filter((incident) => ['HIGH', 'CRITICAL'].includes(String(incident.priority || '').trim().toUpperCase())).length
    const inProgress = incidents.filter((incident) => ['ACCEPTED', 'IN PROGRESS'].includes(String(incident.status || '').trim().toUpperCase())).length
    const resolvedToday = incidents.filter((incident) => {
      const isResolved = ['RESOLVED', 'WAITING FOR ADMIN VERIFICATION'].includes(String(incident.status || '').trim().toUpperCase())
      if (!isResolved) return false
      const updated = new Date(incident.updated_at || incident.created_at || Date.now())
      const now = new Date()
      return updated.toDateString() === now.toDateString()
    }).length

    return res.json({
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        department: staff.department || 'Technical Support',
        status: staff.status || 'Active',
      },
      summary: {
        totalOpenIncidents: openIncidents.length,
        highPriorityCount: highPriority,
        inProgressCount: inProgress,
        resolvedTodayCount: resolvedToday,
        assignedCount: incidents.length,
      },
      incidents,
    })
  } catch (error) {
    console.error('Error fetching staff dashboard overview:', error)
    return res.status(500).json({ message: 'Failed to fetch staff dashboard overview.' })
  }
})

router.get('/incidents', async (req, res) => {
  try {
    const staff = getStaffFromRequest(req)
    if (!staff) {
      return res.status(403).json({ message: 'Staff access required.' })
    }

    const incidents = getStaffIncidents(staff).sort((a, b) => new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at))
    return res.json(incidents)
  } catch (error) {
    console.error('Error fetching staff incidents:', error)
    return res.status(500).json({ message: 'Failed to fetch incidents.' })
  }
})

router.post('/incidents/:id/notes', async (req, res) => {
  try {
    const staff = getStaffFromRequest(req)
    if (!staff) {
      return res.status(403).json({ message: 'Staff access required.' })
    }

    const note = String(req.body?.note || '').trim()
    if (!note) {
      return res.status(400).json({ message: 'Progress note is required.' })
    }

    const incidents = readEntity('incidents', [])
    const incidentIndex = incidents.findIndex((item) => Number(item.incident_id) === Number(req.params.id) || Number(item.id) === Number(req.params.id))
    if (incidentIndex === -1) {
      return res.status(404).json({ message: 'Incident not found.' })
    }

    const incident = incidents[incidentIndex]
    if (!isAssignedToStaff(incident, staff)) {
      return res.status(403).json({ message: 'You can only add notes to incidents assigned to you.' })
    }

    if (String(incident.status || '').trim().toUpperCase() !== 'IN PROGRESS') {
      return res.status(400).json({ message: 'Staff can only add progress notes while the incident is in progress.' })
    }

    const list = Array.isArray(incident.progress_notes) ? incident.progress_notes : []
    list.unshift({
      staff_name: staff.name,
      note,
      timestamp: new Date().toISOString(),
    })

    incident.progress_notes = list
    incident.updated_at = new Date().toISOString()
    incident.timeline = buildIncidentTimeline(incident)
    writeEntity('incidents', incidents)
    addStaffNotification(staff, `Progress update added for INC-${incident.incident_id || incident.id}`, `Staff update recorded for ${incident.title}.`, 'info')

    return res.json({ message: 'Progress note added.', incident })
  } catch (error) {
    console.error('Error adding staff progress note:', error)
    return res.status(500).json({ message: 'Failed to add progress note.' })
  }
})

router.patch('/incidents/:id/status', async (req, res) => {
  try {
    const staff = getStaffFromRequest(req)
    if (!staff) {
      return res.status(403).json({ message: 'Staff access required.' })
    }

    const { status, note, resolution_description } = req.body || {}
    const nextStatus = normalizeIncidentStatus(status)

    if (!nextStatus || ['VERIFIED', 'CLOSED', 'REASSIGNED', 'DELETE'].includes(String(nextStatus).trim().toUpperCase())) {
      return res.status(400).json({ message: 'Staff cannot change the incident to that status.' })
    }

    const incidents = readEntity('incidents', [])
    const incidentIndex = incidents.findIndex((item) => Number(item.incident_id) === Number(req.params.id) || Number(item.id) === Number(req.params.id))
    if (incidentIndex === -1) {
      return res.status(404).json({ message: 'Incident not found.' })
    }

    const incident = incidents[incidentIndex]
    if (!isAssignedToStaff(incident, staff)) {
      return res.status(403).json({ message: 'You can only update incidents assigned to you.' })
    }

    const currentStatus = String(incident.status || 'ASSIGNED').trim().toUpperCase()
    const targetStatus = String(nextStatus).trim().toUpperCase()

    if (!isAllowedStaffTransition(currentStatus, targetStatus)) {
      return res.status(400).json({ message: `Staff cannot move an incident from ${currentStatus} to ${targetStatus}.` })
    }

    if (targetStatus === 'RESOLVED' && !String(resolution_description || '').trim()) {
      return res.status(400).json({ message: 'Resolution description is required before resolving an incident.' })
    }

    incident.status = targetStatus
    incident.assigned_staff_id = incident.assigned_staff_id ?? staff.id
    incident.assigned_staff_email = incident.assigned_staff_email || staff.email
    incident.assigned_staff_name = incident.assigned_staff_name || staff.name
    incident.updated_at = new Date().toISOString()

    if (targetStatus === 'RESOLVED') {
      incident.resolution_description = String(resolution_description || '').trim() || 'Solved by the assigned staff member.'
      incident.resolved_at = new Date().toISOString()
    }

    if (targetStatus === 'WAITING FOR ADMIN VERIFICATION') {
      incident.resolution_description = incident.resolution_description || String(resolution_description || '').trim() || 'Waiting for admin verification.'
      incident.resolved_at = incident.resolved_at || new Date().toISOString()
    }

    if (note && String(note).trim()) {
      const progressNotes = Array.isArray(incident.progress_notes) ? incident.progress_notes : []
      progressNotes.unshift({
        staff_name: staff.name,
        note: String(note).trim(),
        timestamp: new Date().toISOString(),
      })
      incident.progress_notes = progressNotes
    }

    incident.timeline = buildIncidentTimeline(incident)
    writeEntity('incidents', incidents)

    if (targetStatus === 'ACCEPTED') {
      addStaffNotification(staff, `Assignment accepted for INC-${incident.incident_id || incident.id}`, `You accepted the assignment for ${incident.title}.`, 'success')
    }
    if (targetStatus === 'IN PROGRESS') {
      addStaffNotification(staff, `Investigation started for INC-${incident.incident_id || incident.id}`, `${incident.title} is now in progress.`, 'info')
    }
    if (targetStatus === 'WAITING FOR ADMIN VERIFICATION') {
      addStaffNotification(staff, `Resolution waiting for admin verification`, `INC-${incident.incident_id || incident.id} has been resolved and is awaiting admin verification.`, 'warning')
    }

    return res.json({ message: 'Incident status updated successfully.', incident })
  } catch (error) {
    console.error('Error updating incident status:', error)
    return res.status(500).json({ message: 'Failed to update incident status.' })
  }
})

router.get('/profile', async (req, res) => {
  try {
    const staff = getStaffFromRequest(req)
    if (!staff) {
      return res.status(403).json({ message: 'Staff access required.' })
    }

    return res.json({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone || '',
      department: staff.department || 'Technical Support',
      status: staff.status || 'Active',
      role: staff.role,
    })
  } catch (error) {
    console.error('Error fetching staff profile:', error)
    return res.status(500).json({ message: 'Failed to fetch profile.' })
  }
})

router.put('/profile', async (req, res) => {
  try {
    const staff = getStaffFromRequest(req)
    if (!staff) {
      return res.status(403).json({ message: 'Staff access required.' })
    }

    const { name, phone, department } = req.body || {}
    const users = readEntity('users', [])
    const index = users.findIndex((item) => Number(item.id) === Number(staff.id))

    if (index === -1) {
      return res.status(404).json({ message: 'Staff profile not found.' })
    }

    users[index].name = name || users[index].name
    users[index].phone = phone || users[index].phone
    users[index].department = department || users[index].department || 'Technical Support'
    writeEntity('users', users)

    return res.json({ message: 'Staff profile updated successfully.' })
  } catch (error) {
    console.error('Error updating staff profile:', error)
    return res.status(500).json({ message: 'Failed to update profile.' })
  }
})

module.exports = router
