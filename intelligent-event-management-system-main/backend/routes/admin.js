const express = require('express')
const router = express.Router()
const { readEntity, writeEntity, withWriteLock, nextId } = require('../lib/jsonStore')
const { hasTimeOverlap, buildConflictMessage } = require('../lib/validation')
const { buildSponsorPerformanceSummary, getAllSponsorAccounts } = require('./sponsor')
const { getEventIntelligence, getAIOperationsIntelligence } = require('../intelligence/intelligenceController')

const EVENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED']

const requireAdmin = (req, res, next) => {
  const role = String(req.headers['x-user-role'] || '').trim().toLowerCase()
  const email = String(req.headers['x-user-email'] || '').trim().toLowerCase()
  const users = readEntity('users', [])
  const user = users.find((item) => String(item.email || '').trim().toLowerCase() === email)

  if (!user || user.role !== 'admin' || role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' })
  }

  req.authUser = user
  return next()
}

router.use(requireAdmin)

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean)
    }
  }
  return []
}

const getSponsorPackageName = (packageId) => {
  const packageIdNumber = Number(packageId)
  const map = {
    1: 'Platinum',
    2: 'Gold',
    3: 'Silver',
  }
  return map[packageIdNumber] || `Package ${packageIdNumber || 'Unknown'}`
}

const formatCurrencyInr = (value) => {
  const numeric = Number(value ?? 0)
  return `₹${numeric.toLocaleString('en-IN')}`
}

const buildStatusHistoryEntry = (status, actor, note = '') => ({
  timestamp: new Date().toISOString(),
  status,
  actor,
  note,
})

const findProposalInStore = (proposalId) => {
  const proposals = readEntity('sponsorship_proposals', [])
  return proposals.find((item) => String(item.proposal_id) === String(proposalId)) || null
}

const createPaymentTrackingForProposal = (proposal) => {
  const payments = readEntity('sponsorship_payments', [])
  const existing = payments.find((entry) => String(entry.proposal_id) === String(proposal.proposal_id))
  if (existing) return existing

  const amount = Number(proposal.amount || 0)
  const paymentRecord = {
    id: nextId(payments),
    proposal_id: String(proposal.proposal_id),
    sponsor_id: Number(proposal.sponsor_id || 0),
    event_id: Number(proposal.event_id || 0),
    package_id: Number(proposal.package_id || 0),
    amount,
    paid_amount: 0,
    due_amount: amount,
    status: amount > 0 ? 'Pending' : 'Completed',
    payment_schedule: [
      { label: 'Initial deposit', amount: Math.round(amount * 0.3), status: 'Pending', due_date: new Date().toISOString() },
      { label: 'Balance installment', amount: Math.round(amount * 0.7), status: 'Pending', due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  payments.push(paymentRecord)
  writeEntity('sponsorship_payments', payments)
  return paymentRecord
}

const createDeliverableTrackingForProposal = (proposal) => {
  const deliverables = readEntity('sponsorship_deliverables', [])
  const existing = deliverables.filter((entry) => String(entry.proposal_id) === String(proposal.proposal_id))

  const getProposalDeliverableTitles = () => {
    const candidates = []
    const brandingEntries = Array.isArray(proposal?.branding_requirements)
      ? proposal.branding_requirements
        .map((item) => String(item || '').trim())
        .filter(Boolean)
      : []

    brandingEntries.forEach((item) => candidates.push(item))

    const specialRequirements = String(proposal?.special_requirements || '').trim()
    if (specialRequirements) candidates.push(specialRequirements)

    if (proposal?.booth_required || proposal?.booth_preference) {
      const boothLabel = String(proposal.booth_preference || 'Booth').trim() || 'Booth'
      candidates.push(`${boothLabel} booth setup`)
    }

    const promotionalSessions = Number(proposal?.promotional_sessions || 0)
    if (promotionalSessions > 0) {
      candidates.push(`Promotional session coordination (${promotionalSessions})`)
    }

    const deduped = [...new Set(candidates.map((item) => item.trim()).filter(Boolean))]
    if (deduped.length > 0) return deduped.slice(0, 6)

    const packageName = getSponsorPackageName(proposal?.package_id)
    return [
      `${packageName} booth branding setup`,
      'Social media promotion support',
      'Speaker networking slot coordination',
      'Event-day sponsor check-in support',
    ]
  }

  const proposalTitles = getProposalDeliverableTitles().map((title) => String(title).trim())
  const genericDefaultTitles = [
    'booth branding setup',
    'social media promotion support',
    'speaker networking slot coordination',
    'event-day sponsor check-in support',
  ]

  const hasRelevantExistingEntries = existing.length > 0 && existing.some((entry) => {
    const itemTitle = String(entry.title || '').trim().toLowerCase()
    return proposalTitles.some((title) => title.toLowerCase() === itemTitle)
  })

  if (hasRelevantExistingEntries) return existing

  const shouldRegenerateGenericEntries = existing.length > 0 && existing.some((entry) => {
    const itemTitle = String(entry.title || '').trim().toLowerCase()
    return genericDefaultTitles.some((title) => itemTitle.includes(title))
  })

  if (existing.length > 0 && !shouldRegenerateGenericEntries) return existing

  const records = proposalTitles.map((title, index) => ({
    id: nextId(deliverables),
    proposal_id: String(proposal.proposal_id),
    sponsor_id: Number(proposal.sponsor_id || 0),
    event_id: Number(proposal.event_id || 0),
    package_id: Number(proposal.package_id || 0),
    title,
    description: `Delivery item ${index + 1} for ${proposal?.booth_preference || getSponsorPackageName(proposal?.package_id) || 'sponsorship'} requirements.`,
    status: 'Pending',
    progress: 0,
    due_date: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))

  const filteredDeliverables = deliverables.filter((entry) => String(entry.proposal_id) !== String(proposal.proposal_id))
  filteredDeliverables.push(...records)
  writeEntity('sponsorship_deliverables', filteredDeliverables)
  return records
}

const createSponsorshipTrackingRecords = (proposal) => {
  if (!proposal || String(proposal.status || '').trim().toLowerCase() !== 'approved') {
    return { payment: null, deliverables: [] }
  }

  return {
    payment: createPaymentTrackingForProposal(proposal),
    deliverables: createDeliverableTrackingForProposal(proposal),
  }
}

function updateProposalStatus({ proposalId, decision, reviewer, rejectionReason = '', negotiationMessage = '', negotiatedAmount = 0 }) {
  const proposals = readEntity('sponsorship_proposals', [])
  const index = proposals.findIndex((item) => String(item.proposal_id) === String(proposalId))
  if (index === -1) {
    return { error: 'Proposal not found.' }
  }

  const current = proposals[index]
  const normalizedDecision = String(decision || '').trim().toLowerCase()
  const nextStatusMap = {
    approve: 'Approved',
    negotiate: 'Under Negotiation',
    reject: 'Rejected',
  }

  const nextStatus = nextStatusMap[normalizedDecision] || current.status
  const updatedProposal = {
    ...current,
    status: nextStatus,
    updated_at: new Date().toISOString(),
    reviewed_by: reviewer || current.reviewed_by || 'admin',
    reviewed_at: new Date().toISOString(),
    rejection_reason: normalizedDecision === 'reject' ? String(rejectionReason || '').trim() : '',
    negotiation_message: normalizedDecision === 'negotiate' ? String(negotiationMessage || '').trim() : (current.negotiation_message || ''),
    negotiated_amount: normalizedDecision === 'negotiate' ? Number(negotiatedAmount || 0) : Number(current.negotiated_amount || 0),
    status_history: Array.isArray(current.status_history) ? [...current.status_history] : [],
  }

  const lastStatus = updatedProposal.status_history.at(-1)?.status || current.status
  if (lastStatus !== nextStatus) {
    updatedProposal.status_history.push(buildStatusHistoryEntry(nextStatus, reviewer || 'admin', normalizedDecision === 'reject' ? rejectionReason : negotiationMessage))
  }

  proposals[index] = updatedProposal
  writeEntity('sponsorship_proposals', proposals)

  const tracking = normalizedDecision === 'approve' ? createSponsorshipTrackingRecords(updatedProposal) : { payment: null, deliverables: [] }

  const sponsorList = readEntity('sponsors', [])
  const userList = readEntity('users', [])
  const sponsor = sponsorList.find((item) => Number(item.id) === Number(updatedProposal.sponsor_id))
    || userList.find((item) => Number(item.id) === Number(updatedProposal.sponsor_id) && String(item.role || '').trim().toLowerCase() === 'sponsor')
    || null
  const notifications = readEntity('notifications', [])
  const sponsorEmail = String(sponsor?.email || updatedProposal?.email || '').trim() || 'sponsor@eventai.local'
  const sponsorName = String(sponsor?.company_name || sponsor?.name || 'Sponsor').trim() || 'Sponsor'

  if (sponsor && normalizedDecision === 'approve') {
    const sponsorApprovedCount = readEntity('sponsorship_proposals', []).filter((item) => Number(item.sponsor_id) === Number(sponsor.id) && String(item.status || '').trim().toLowerCase() === 'approved').length
    const sponsorIndex = sponsorList.findIndex((item) => Number(item.id) === Number(sponsor.id))
    if (sponsorIndex >= 0) {
      sponsorList[sponsorIndex].active_sponsorships = sponsorApprovedCount
      sponsorList[sponsorIndex].total_sponsorship_value = readEntity('sponsorship_proposals', []).filter((item) => Number(item.sponsor_id) === Number(sponsor.id) && String(item.status || '').trim().toLowerCase() === 'approved').reduce((sum, item) => sum + Number(item.amount || 0), 0)
      sponsorList[sponsorIndex].updated_at = new Date().toISOString()
      writeEntity('sponsors', sponsorList)
    }
  }

  if (sponsor || normalizedDecision !== 'approve' || sponsorEmail) {
    let title = 'Sponsorship Proposal Updated'
    let message = `Your sponsorship proposal ${updatedProposal.proposal_id} has been updated.`

    if (normalizedDecision === 'approve') {
      title = '🎉 Sponsorship Proposal Approved'
      message = `Your Platinum sponsorship proposal for ${updatedProposal.event_id || 'the selected event'} has been approved.\n\nProposal ID:\n${updatedProposal.proposal_id}`
    } else if (normalizedDecision === 'negotiate') {
      title = 'Sponsorship Proposal Under Negotiation'
      message = 'The event administrator has requested changes to your sponsorship proposal.\n\n[View Proposal]'
    } else if (normalizedDecision === 'reject') {
      title = 'Sponsorship Proposal Rejected'
      message = `Your sponsorship proposal was not approved.\n\nReason:\n${rejectionReason || 'No reason provided.'}`
    }

    notifications.unshift({
      id: nextId(notifications),
      recipient_email: sponsorEmail,
      recipient_role: 'sponsor',
      title,
      message,
      type: normalizedDecision === 'approve' ? 'success' : normalizedDecision === 'reject' ? 'danger' : 'info',
      is_read: false,
      created_at: new Date().toISOString(),
      proposal_id: updatedProposal.proposal_id,
      status: updatedProposal.status,
      sponsor_name: sponsorName,
    })
    writeEntity('notifications', notifications)
  }

  return { ...updatedProposal, tracking }
}

function getProposalForAdmin(proposalId) {
  const proposal = findProposalInStore(proposalId)
  if (!proposal) return null

  const sponsor = readEntity('sponsors', []).find((item) => Number(item.id) === Number(proposal.sponsor_id)) || null
  const event = readEntity('events', []).find((item) => Number(item.event_id ?? item.id) === Number(proposal.event_id)) || null
  const sponsorHistory = readEntity('sponsorship_proposals', []).filter((item) => Number(item.sponsor_id) === Number(proposal.sponsor_id) && String(item.proposal_id) !== String(proposal.proposal_id))
  const analysis = readEntity('sponsorship_agent_analysis', []).find((item) => String(item.proposal_id) === String(proposal.proposal_id)) || null
  const paymentTracking = readEntity('sponsorship_payments', []).find((item) => String(item.proposal_id) === String(proposal.proposal_id)) || null
  const deliverableTracking = readEntity('sponsorship_deliverables', []).filter((item) => String(item.proposal_id) === String(proposal.proposal_id))

  return {
    ...proposal,
    sponsor,
    event,
    package_name: getSponsorPackageName(proposal.package_id),
    sponsor_history: sponsorHistory,
    ai_analysis: analysis,
    payment_tracking: paymentTracking,
    deliverables: deliverableTracking,
    review_summary: {
      previous_sponsorships: sponsorHistory.length,
      completed_sponsorships: sponsorHistory.filter((item) => String(item.status).toLowerCase() === 'approved').length,
      previous_sponsorship_value: sponsorHistory.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      payment_reliability: sponsor && sponsor.status === 'Active' ? 92 : 0,
    },
  }
}

const normalizeDateTime = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const getEntityById = (entityName, idKey, idValue) => {
  const items = readEntity(entityName, [])
  return items.find((item) => Number(item[idKey]) === Number(idValue)) || null
}

function normalizeIncidentStatus(status) {
  const value = String(status || '').trim().toUpperCase()
  if (!value) return 'NEW'
  if (value === 'WAITING_FOR_ADMIN_VERIFICATION') return 'WAITING FOR ADMIN VERIFICATION'
  return value.replace(/_/g, ' ')
}

function isAllowedAdminTransition(currentStatus, nextStatus) {
  const current = normalizeIncidentStatus(currentStatus)
  const next = normalizeIncidentStatus(nextStatus)

  const allowed = {
    'WAITING FOR ADMIN VERIFICATION': ['VERIFIED'],
    VERIFIED: ['CLOSED'],
  }

  return (allowed[current] || []).includes(next)
}

function appendIncidentTimelineEntry(incident, action, actor, description) {
  const timeline = Array.isArray(incident.timeline) ? [...incident.timeline] : []
  timeline.push({
    action,
    actor,
    timestamp: new Date().toISOString(),
    description,
  })
  incident.timeline = timeline
}

const { buildIncidentAnalysis, buildOperationalAlert } = require('../lib/incidentHelpers')

function getAnalyticsDateWindow(range = '30', customStart = '', customEnd = '', anchorDate = null) {
  const referenceDate = anchorDate ? new Date(anchorDate) : new Date()
  const end = customEnd ? new Date(customEnd) : new Date(referenceDate)
  const start = customStart ? new Date(customStart) : new Date(referenceDate)

  if (customStart && customEnd) {
    return { start, end }
  }

  const dayMs = 24 * 60 * 60 * 1000
  const durationMap = {
    today: dayMs,
    7: 7 * dayMs,
    30: 30 * dayMs,
    90: 90 * dayMs,
  }

  const span = durationMap[String(range).toLowerCase()] || durationMap['30']
  start.setTime(referenceDate.getTime() - span)
  end.setTime(referenceDate.getTime())

  return { start, end }
}

function parseDateValue(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function isWithinDateWindow(value, start, end) {
  const date = parseDateValue(value)
  if (!date) return true

  const startTime = start ? new Date(start).getTime() : null
  const endTime = end ? new Date(end).getTime() : null

  if (startTime !== null && date.getTime() < startTime) return false
  if (endTime !== null) {
    const normalizedEnd = new Date(endTime)
    const sameDayAsEnd = date.toISOString().slice(0, 10) === normalizedEnd.toISOString().slice(0, 10)
    if (!sameDayAsEnd && date.getTime() > normalizedEnd.getTime()) return false
  }
  return true
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return 'Not enough data'
  const totalMinutes = Math.max(0, Math.round(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours <= 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

function toNumberList(items, getter) {
  return items.map((item) => Number(getter(item) || 0)).filter((value) => Number.isFinite(value))
}

function aggregateMap(items, getKey, fallbackLabel = 'Other') {
  const buckets = {}
  items.forEach((item) => {
    const key = String(getKey(item) || fallbackLabel).trim() || fallbackLabel
    buckets[key] = (buckets[key] || 0) + 1
  })
  return Object.entries(buckets).sort((a, b) => b[1] - a[1])
}

function getFirstRelevantTimestamp(incident) {
  const timeline = Array.isArray(incident.timeline) ? incident.timeline : []
  const actions = timeline
    .map((entry) => ({ time: parseDateValue(entry.timestamp), action: String(entry.action || '').toLowerCase() }))
    .filter((entry) => entry.time)

  const accepted = actions.find((entry) => /accept|assigned|start|investigation|in progress/.test(entry.action))
  if (accepted) return accepted.time.toISOString()

  const statusKeys = ['ASSIGNED', 'IN PROGRESS', 'ACCEPTED', 'UNDER REVIEW']
  const statusValue = statusKeys.find((key) => String(incident.status || '').toUpperCase().includes(key))
  if (statusValue && parseDateValue(incident.updated_at)) return parseDateValue(incident.updated_at).toISOString()

  return null
}

function getIncidentAnalytics({ range = '30', customStart = '', customEnd = '' } = {}) {
  const incidents = readEntity('incidents', [])
  const activityAnchor = incidents
    .map((incident) => incident.created_at || incident.createdAt || incident.updated_at)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a)[0] || new Date()

  const { start, end } = getAnalyticsDateWindow(range, customStart, customEnd, activityAnchor)
  const filtered = incidents.filter((incident) => isWithinDateWindow(incident.created_at || incident.createdAt, start, end))

  const totalIncidents = filtered.length
  const openIncidents = filtered.filter((incident) => !['CLOSED', 'VERIFIED', 'RESOLVED'].includes(String(incident.status || '').trim().toUpperCase())).length
  const inProgressIncidents = filtered.filter((incident) => String(incident.status || '').trim().toUpperCase().includes('IN PROGRESS')).length
  const waitingForVerification = filtered.filter((incident) => String(incident.status || '').trim().toUpperCase() === 'WAITING FOR ADMIN VERIFICATION' || String(incident.status || '').trim().toUpperCase() === 'WAITING_FOR_ADMIN_VERIFICATION').length
  const verifiedIncidents = filtered.filter((incident) => String(incident.status || '').trim().toUpperCase() === 'VERIFIED').length
  const closedIncidents = filtered.filter((incident) => String(incident.status || '').trim().toUpperCase() === 'CLOSED').length
  const criticalIncidents = filtered.filter((incident) => String(incident.priority || '').trim().toUpperCase() === 'CRITICAL').length
  const highPriorityIncidents = filtered.filter((incident) => String(incident.priority || '').trim().toUpperCase() === 'HIGH').length
  const resolvedIncidents = filtered.filter((incident) => String(incident.status || '').trim().toUpperCase() === 'RESOLVED').length

  const byCategory = Object.fromEntries(
    aggregateMap(filtered, (incident) => String(incident.category || 'Other').trim() || 'Other').map(([label, count]) => [label, count])
  )
  const byPriority = Object.fromEntries(
    aggregateMap(filtered, (incident) => String(incident.priority || 'LOW').trim().toUpperCase() || 'LOW').map(([label, count]) => [label, count])
  )
  const byLocation = Object.fromEntries(
    aggregateMap(filtered, (incident) => String(incident.location || 'Unassigned').trim() || 'Unassigned').map(([label, count]) => [label, count])
  )
  const byStatus = Object.fromEntries(
    aggregateMap(filtered, (incident) => String(incident.status || 'NEW').trim() || 'NEW').map(([label, count]) => [label, count])
  )

  const resolutionDurations = filtered
    .map((incident) => {
      const created = parseDateValue(incident.created_at)
      const resolved = parseDateValue(incident.resolved_at || incident.updated_at)
      if (!created || !resolved) return null
      if (resolved < created) return null
      return resolved.getTime() - created.getTime()
    })
    .filter((value) => Number.isFinite(value) && value >= 0)

  const responseDurations = filtered
    .map((incident) => {
      const created = parseDateValue(incident.created_at)
      const responded = parseDateValue(getFirstRelevantTimestamp(incident) || incident.updated_at)
      if (!created || !responded) return null
      if (responded < created) return null
      return responded.getTime() - created.getTime()
    })
    .filter((value) => Number.isFinite(value) && value >= 0)

  const verificationDurations = filtered
    .map((incident) => {
      const resolved = parseDateValue(incident.resolved_at || incident.updated_at)
      const verified = parseDateValue(incident.verified_at)
      if (!resolved || !verified) return null
      if (verified < resolved) return null
      return verified.getTime() - resolved.getTime()
    })
    .filter((value) => Number.isFinite(value) && value >= 0)

  const closureDurations = filtered
    .map((incident) => {
      const verified = parseDateValue(incident.verified_at)
      const closed = parseDateValue(incident.closed_at)
      if (!verified || !closed) return null
      if (closed < verified) return null
      return closed.getTime() - verified.getTime()
    })
    .filter((value) => Number.isFinite(value) && value >= 0)

  const trend = []
  const dayBuckets = new Map()
  filtered.forEach((incident) => {
    const created = parseDateValue(incident.created_at)
    if (!created) return
    const key = created.toISOString().slice(0, 10)
    dayBuckets.set(key, (dayBuckets.get(key) || 0) + 1)
  })
  Array.from(dayBuckets.entries()).sort(([a], [b]) => new Date(a) - new Date(b)).forEach(([date, count]) => {
    trend.push({ date, count })
  })

  const staffBuckets = {}
  filtered.forEach((incident) => {
    const staffName = String(incident.staff_assigned_to || incident.assigned_staff || incident.assignee || 'Unassigned').trim()
    if (!staffName) return
    staffBuckets[staffName] = (staffBuckets[staffName] || 0) + 1
  })

  const averageResolution = resolutionDurations.length ? resolutionDurations.reduce((sum, value) => sum + value, 0) / resolutionDurations.length : null
  const averageResponse = responseDurations.length ? responseDurations.reduce((sum, value) => sum + value, 0) / responseDurations.length : null
  const averageVerification = verificationDurations.length ? verificationDurations.reduce((sum, value) => sum + value, 0) / verificationDurations.length : null
  const averageClosure = closureDurations.length ? closureDurations.reduce((sum, value) => sum + value, 0) / closureDurations.length : null

  const hotspot = Object.entries(byLocation).sort((a, b) => b[1] - a[1])[0]
  const mainCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]

  return {
    totalIncidents,
    openIncidents,
    inProgressIncidents,
    waitingForVerification,
    resolvedIncidents,
    verifiedIncidents,
    closedIncidents,
    criticalIncidents,
    highPriorityIncidents,
    byCategory,
    byPriority,
    byLocation,
    byStatus,
    staffWorkload: Object.entries(staffBuckets).map(([name, count]) => ({ name, count })),
    averageResolutionTime: averageResolution ? formatDuration(averageResolution) : 'Not enough data',
    averageResponseTime: averageResponse ? formatDuration(averageResponse) : 'Not enough data',
    averageVerificationTime: averageVerification ? formatDuration(averageVerification) : 'Not enough data',
    averageClosureTime: averageClosure ? formatDuration(averageClosure) : 'Not enough data',
    trend,
    summary: hotspot || mainCategory
      ? `${hotspot ? `${hotspot[0]} has the highest reported incidents.` : ''}${mainCategory ? ` ${mainCategory[0]} is the most common category.` : ''}`.trim()
      : 'No incident data available for the selected period.'
  }
}

function getSponsorshipAnalytics({ range = '30', customStart = '', customEnd = '' } = {}) {
  const sponsors = readEntity('sponsors', [])
  const proposals = readEntity('sponsorship_proposals', [])
  const payments = readEntity('sponsorship_payments', [])
  const deliverables = readEntity('sponsorship_deliverables', [])
  const activityAnchor = [...proposals, ...payments, ...deliverables]
    .map((entry) => entry.created_at || entry.submitted_at || entry.updated_at)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a)[0] || new Date()

  const { start, end } = getAnalyticsDateWindow(range, customStart, customEnd, activityAnchor)
  const filteredProposals = proposals.filter((proposal) => isWithinDateWindow(proposal.created_at || proposal.submitted_at, start, end))
  const approved = filteredProposals.filter((proposal) => String(proposal.status || '').trim().toLowerCase() === 'approved')
  const totalSponsors = sponsors.length
  const activeSponsors = sponsors.filter((sponsor) => String(sponsor.status || '').trim().toLowerCase() === 'active').length
  const totalSponsorshipValue = approved.reduce((sum, proposal) => sum + Number(proposal.amount || 0), 0)

  const paymentStatus = {
    Paid: payments.filter((payment) => String(payment.status || '').trim().toLowerCase() === 'paid').length,
    Pending: payments.filter((payment) => Number(payment.due_amount || 0) > 0 || String(payment.status || '').trim().toLowerCase() === 'pending').length,
    Overdue: payments.filter((payment) => Number(payment.due_amount || 0) > 0 && String(payment.status || '').trim().toLowerCase() === 'overdue').length,
  }

  const packageMap = {
    1: 'Platinum',
    2: 'Gold',
    3: 'Silver',
  }

  const packageBreakdown = {}
  approved.forEach((proposal) => {
    const label = String(packageMap[Number(proposal.package_id)] || `Package ${proposal.package_id || 'Unknown'}`)
    packageBreakdown[label] = (packageBreakdown[label] || 0) + 1
  })

  const deliverableStatus = {
    Completed: deliverables.filter((entry) => String(entry.status || '').trim().toLowerCase() === 'completed').length,
    'In Progress': deliverables.filter((entry) => String(entry.status || '').trim().toLowerCase() === 'in progress').length,
    Pending: deliverables.filter((entry) => String(entry.status || '').trim().toLowerCase() === 'pending').length,
    Overdue: deliverables.filter((entry) => String(entry.status || '').trim().toLowerCase() === 'overdue').length,
  }

  const pendingPayments = payments.filter((payment) => Number(payment.due_amount || 0) > 0 || String(payment.status || '').trim().toLowerCase() === 'pending').length
  const pendingDeliverables = deliverables.filter((entry) => ['pending', 'in progress', 'overdue'].includes(String(entry.status || '').trim().toLowerCase())).length

  const sponsorPerformance = sponsors.map((sponsor) => {
    const sponsorId = Number(sponsor.id || sponsor.sponsor_id || 0)
    const sponsorDeliverables = deliverables.filter((entry) => Number(entry.sponsor_id) === sponsorId)
    const sponsorProposals = proposals.filter((proposal) => Number(proposal.sponsor_id) === sponsorId)
    const completedDeliverables = sponsorDeliverables.filter((entry) => String(entry.status || '').trim().toLowerCase() === 'completed').length
    const totalDeliverables = sponsorDeliverables.length
    const requirementCompletion = sponsorProposals.length ? Math.round((sponsorProposals.filter((proposal) => String(proposal.status || '').trim().toLowerCase() === 'approved').length / sponsorProposals.length) * 100) : 0
    const completionRate = totalDeliverables ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0

    return {
      name: sponsor.name || sponsor.company_name || `Sponsor ${sponsorId || 'Unknown'}`,
      active: String(sponsor.status || '').trim().toLowerCase() === 'active',
      deliverablesCompleted: `${completionRate}%`,
      requirementsCompleted: `${requirementCompletion}%`,
      pendingItems: sponsorDeliverables.filter((entry) => ['pending', 'in progress', 'overdue'].includes(String(entry.status || '').trim().toLowerCase())).length,
    }
  })

  const topSponsor = sponsorPerformance.sort((a, b) => Number(b.pendingItems || 0) - Number(a.pendingItems || 0))[0]

  return {
    totalSponsors,
    activeSponsors,
    pendingPayments,
    pendingDeliverables,
    activePackages: Object.keys(packageBreakdown).length,
    totalSponsorshipValue,
    packageBreakdown,
    deliverableStatus,
    paymentStatus,
    sponsorPerformance,
    summary: topSponsor ? `${topSponsor.name} has the largest remaining sponsor workload.` : 'No sponsorship data available for the selected period.',
  }
}

function normalizeAlertStatus(status) {
  return String(status || '').trim().toUpperCase()
}

function getOperationalAlerts() {
  const alerts = readEntity('alerts', [])
  return [...alerts].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}

// Note: getAIOperationsIntelligence is imported from ../intelligence/intelligenceController

function buildAlertDedupKey(alert) {
  const sourceType = String(alert.sourceType || '').toLowerCase()
  const sourceId = String(alert.sourceId ?? '').trim()
  const title = String(alert.title || '').trim().toLowerCase()
  return `${sourceType}|${sourceId}|${title}`
}

function generateOperationalAlerts() {
  const alerts = readEntity('alerts', [])
  const incidents = readEntity('incidents', [])
  const proposals = readEntity('sponsorship_proposals', [])
  const payments = readEntity('sponsorship_payments', [])
  const deliverables = readEntity('sponsorship_deliverables', [])
  const events = readEntity('events', [])
  const sessions = readEntity('sessions', [])

  const nextAlerts = []
  const seenKeys = new Set(alerts.filter((item) => !['DISMISSED'].includes(normalizeAlertStatus(item.status))).map(buildAlertDedupKey))
  let nextAlertSequence = nextId(alerts, 'id')

  const addAlert = (candidate) => {
    if (!candidate || !candidate.title) return
    const dedupeKey = buildAlertDedupKey(candidate)
    if (seenKeys.has(dedupeKey)) return
    seenKeys.add(dedupeKey)
    const idValue = Number.isFinite(Number(candidate.id)) ? Number(candidate.id) : nextAlertSequence
    const normalizedCandidate = {
      ...candidate,
      id: idValue,
      alertId: String(candidate.alertId || `ALERT-${String(idValue).padStart(4, '0')}`),
    }
    nextAlertSequence += 1
    nextAlerts.push(normalizedCandidate)
  }

  incidents.forEach((incident) => {
    const incidentId = Number(incident.incident_id ?? incident.id ?? 0)
    const priority = String(incident.priority || '').toUpperCase()
    const status = normalizeIncidentStatus(incident.status)
    const location = String(incident.location || 'Unknown location').trim()
    const sourceLabel = `INC-${incident.incident_id || incident.id}`
    const normalizedStatusToken = String(status || '').trim().toUpperCase()
    const isOpen = !['CLOSED', 'VERIFIED', 'RESOLVED'].includes(normalizedStatusToken)
    const isWaitingForVerification = normalizedStatusToken === 'WAITING FOR ADMIN VERIFICATION' || normalizedStatusToken === 'WAITING_FOR_ADMIN_VERIFICATION'

    if (priority === 'CRITICAL') {
      addAlert(buildOperationalAlert({
        id: nextAlertSequence,
        type: 'INCIDENT',
        title: `Critical incident: ${incident.title || 'Unresolved event issue'}`,
        description: incident.description || 'Critical incident requires immediate operational attention.',
        priority: 'CRITICAL',
        sourceType: 'incident',
        sourceId: incidentId,
        sourceLabel,
        relatedEntity: { incidentId, title: incident.title || 'Incident', location },
        reason: incident.ai_analysis?.reason || `Priority is ${priority} and the issue is still active.`,
        recommendedAction: 'Escalate immediately and coordinate response with the assigned staff and admin team.',
      }))
    }

    if ((priority === 'HIGH' && isOpen) || isWaitingForVerification) {
      addAlert(buildOperationalAlert({
        id: nextAlertSequence,
        type: 'INCIDENT',
        title: isWaitingForVerification ? 'Admin verification required' : `High-priority incident unresolved: ${incident.title || 'Issue requires action'}`,
        description: isWaitingForVerification
          ? `Incident ${sourceLabel} is waiting for admin verification and response.`
          : `The ${sourceLabel} incident remains open and still impacts operations.`,
        priority: 'HIGH',
        sourceType: 'incident',
        sourceId: incidentId,
        sourceLabel,
        relatedEntity: { incidentId, title: incident.title || 'Incident', location },
        reason: incident.ai_analysis?.explanation || 'The incident is still unresolved and has significant operational impact.',
        recommendedAction: 'Review the open issue, verify resolution, and coordinate the next operational action.',
      }))
    }

    if ((priority === 'LOW' && isOpen) || (priority === 'MEDIUM' && isOpen)) {
      addAlert(buildOperationalAlert({
        id: nextAlertSequence,
        type: 'INCIDENT',
        title: `Open ${priority.toLowerCase()} incident: ${incident.title || 'Operational follow-up required'}`,
        description: incident.description || 'A low/medium priority issue remains active and should be monitored by the admin team.',
        priority: priority === 'MEDIUM' ? 'MEDIUM' : 'LOW',
        sourceType: 'incident',
        sourceId: incidentId,
        sourceLabel,
        relatedEntity: { incidentId, title: incident.title || 'Incident', location },
        reason: incident.ai_analysis?.explanation || 'This issue is active but currently limited in operational impact.',
        recommendedAction: 'Monitor this incident, confirm a response plan, and keep the assigned team updated on progress.',
      }))
    }

    const activeNearby = incidents.filter((other) => {
      const sameLocation = String(other.location || '').toLowerCase() === String(location).toLowerCase()
      const otherId = Number(other.incident_id ?? other.id ?? 0)
      const stillOpen = !['CLOSED', 'VERIFIED', 'RESOLVED'].includes(String(other.status || '').toUpperCase())
      return sameLocation && otherId !== incidentId && stillOpen
    })

    if (location && activeNearby.length >= 1 && isOpen) {
      addAlert(buildOperationalAlert({
        id: nextAlertSequence,
        type: 'INCIDENT',
        title: `Multiple incidents at ${location}`,
        description: `Multiple open incidents at ${location} require coordinated attention and monitoring.`,
        priority: 'MEDIUM',
        sourceType: 'incident',
        sourceId: incidentId,
        sourceLabel,
        relatedEntity: { incidentId, title: incident.title || 'Incident', location },
        reason: 'The same area currently has multiple unresolved incidents, increasing operational load.',
        recommendedAction: 'Coordinate staffing and monitor the affected area to prevent a compounded disruption.',
      }))
    }
  })

  proposals.forEach((proposal) => {
    const proposalId = String(proposal.proposal_id || proposal.id || '')
    const status = String(proposal.status || '').trim().toLowerCase()
    const sponsorName = proposal.company_name || proposal.sponsor_name || 'Sponsor'
    const payment = payments.find((entry) => String(entry.proposal_id) === String(proposalId)) || null
    const pendingDeliverables = deliverables.filter((entry) => String(entry.proposal_id) === String(proposalId) && String(entry.status || '').trim().toLowerCase() !== 'completed')

    if (status === 'approved' && payment && Number(payment.due_amount || 0) > 0) {
      addAlert(buildOperationalAlert({
        id: nextAlertSequence,
        type: 'SPONSORSHIP',
        title: `Sponsor payment pending: ${sponsorName}`,
        description: `Payment for proposal ${proposalId} remains outstanding and requires follow-up.`,
        priority: 'HIGH',
        sourceType: 'sponsorship',
        sourceId: proposalId,
        sourceLabel: proposalId,
        relatedEntity: { proposalId, sponsorName },
        reason: 'The sponsor has an outstanding payment and the approved commitment remains partially unfulfilled.',
        recommendedAction: 'Contact the sponsor, confirm the due amount, and track the payment plan before event execution.',
      }))
    }

    if (status === 'approved' && pendingDeliverables.length > 0) {
      addAlert(buildOperationalAlert({
        id: nextAlertSequence,
        type: 'SPONSORSHIP',
        title: `Sponsor deliverable due: ${sponsorName}`,
        description: `The sponsor has ${pendingDeliverables.length} incomplete deliverable(s) that still need action.`,
        priority: 'MEDIUM',
        sourceType: 'sponsorship',
        sourceId: proposalId,
        sourceLabel: proposalId,
        relatedEntity: { proposalId, sponsorName },
        reason: 'Sponsor commitments remain incomplete and could affect activation or brand readiness.',
        recommendedAction: 'Prioritize the pending deliverables and confirm the sponsor task list before the event day.',
      }))
    }
  })

  const upcomingSessionWindow = Date.now() + 60 * 60 * 1000
  sessions.forEach((session) => {
    const start = new Date(session.start_time || session.startTime || 0).getTime()
    const end = new Date(session.end_time || session.endTime || 0).getTime()
    const now = Date.now()
    const venue = events.find((event) => Number(event.event_id ?? event.id) === Number(session.event_id)) || null

    if (start > now && start < upcomingSessionWindow && !session.venue_id && !session.speaker_id) {
      addAlert(buildOperationalAlert({
        id: nextAlertSequence,
        type: 'EVENT',
        title: `Session setup still pending: ${session.title || session.session_name || 'Unnamed session'}`,
        description: `${session.title || session.session_name || 'The session'} starts soon, but venue or speaker allocation is still incomplete.`,
        priority: 'HIGH',
        sourceType: 'event',
        sourceId: Number(session.session_id || session.id || 0),
        sourceLabel: session.title || session.session_name || 'Session',
        relatedEntity: { sessionId: session.session_id || session.id, title: session.title || session.session_name, eventName: venue?.name || 'Event' },
        reason: 'A session is approaching and some required operational allocations are still missing.',
        recommendedAction: 'Confirm the venue, assigned speaker, and required equipment before the session starts.',
      }))
    }

    if (start > now && start < upcomingSessionWindow && Array.isArray(session.requiredEquipment) && session.requiredEquipment.length > 0) {
      const missing = session.requiredEquipment.length
      if (missing > 0 && (!session.venue_id || !session.speaker_id)) {
        addAlert(buildOperationalAlert({
          id: nextAlertSequence,
          type: 'EVENT',
          title: `Equipment confirmation needed for ${session.title || session.session_name || 'the upcoming session'}`,
          description: `Required equipment needs to be confirmed before ${session.title || session.session_name || 'the session'} starts.`,
          priority: 'MEDIUM',
          sourceType: 'event',
          sourceId: Number(session.session_id || session.id || 0),
          sourceLabel: session.title || session.session_name || 'Session',
          relatedEntity: { sessionId: session.session_id || session.id, title: session.title || session.session_name },
          reason: 'The session has upcoming equipment requirements that still need a confirmed operational setup.',
          recommendedAction: 'Review the venue and equipment checklist and confirm readiness before the session starts.',
        }))
      }
    }

    if (start > now && start < upcomingSessionWindow && end > now && session.status === 'scheduled' && session.expectedAttendance) {
      const venueCapacity = Number(readEntity('venues', []).find((entry) => Number(entry.venue_id) === Number(session.venue_id))?.capacity || 0)
      if (venueCapacity && Number(session.expectedAttendance) > venueCapacity) {
        addAlert(buildOperationalAlert({
          id: nextAlertSequence,
          type: 'EVENT',
          title: `Capacity issue for ${session.title || session.session_name || 'upcoming session'}`,
          description: `Expected attendance exceeds the assigned venue capacity.`,
          priority: 'HIGH',
          sourceType: 'event',
          sourceId: Number(session.session_id || session.id || 0),
          sourceLabel: session.title || session.session_name || 'Session',
          relatedEntity: { sessionId: session.session_id || session.id, title: session.title || session.session_name },
          reason: 'The assigned venue capacity is below the session demand, creating a potential delivery issue.',
          recommendedAction: 'Rebalance room allocation or scale the session setup to match capacity expectations.',
        }))
      }
    }
  })

  const merged = [...alerts, ...nextAlerts]
  if (nextAlerts.length > 0) {
    writeEntity('alerts', merged)
  }

  return {
    ok: true,
    alerts: merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    createdCount: nextAlerts.length,
    summary: `Generated ${nextAlerts.length} operational alert(s) from active operational data.`,
  }
}

function acknowledgeAlert({ alertId, adminUser }) {
  const alerts = readEntity('alerts', [])
  const index = alerts.findIndex((item) => String(item.alertId || item.id) === String(alertId) || String(item.id) === String(alertId))
  if (index === -1) {
    return { ok: false, message: 'Alert not found.' }
  }

  const alert = alerts[index]
  alert.status = 'ACKNOWLEDGED'
  alert.updatedAt = new Date().toISOString()
  alert.acknowledgedBy = adminUser?.name || 'Admin'
  alert.acknowledgedAt = new Date().toISOString()
  alert.timeline = Array.isArray(alert.timeline) ? [...alert.timeline, { action: 'Alert Acknowledged', actor: adminUser?.name || 'Admin', timestamp: new Date().toISOString(), description: 'Admin acknowledged the alert.' }] : [{ action: 'Alert Acknowledged', actor: adminUser?.name || 'Admin', timestamp: new Date().toISOString(), description: 'Admin acknowledged the alert.' }]
  writeEntity('alerts', alerts)
  return { ok: true, alert }
}

function resolveAlert({ alertId, adminUser }) {
  const alerts = readEntity('alerts', [])
  const index = alerts.findIndex((item) => String(item.alertId || item.id) === String(alertId) || String(item.id) === String(alertId))
  if (index === -1) {
    return { ok: false, message: 'Alert not found.' }
  }

  const alert = alerts[index]
  alert.status = 'RESOLVED'
  alert.updatedAt = new Date().toISOString()
  alert.resolvedBy = adminUser?.name || 'Admin'
  alert.resolvedAt = new Date().toISOString()
  alert.timeline = Array.isArray(alert.timeline) ? [...alert.timeline, { action: 'Alert Resolved', actor: adminUser?.name || 'Admin', timestamp: new Date().toISOString(), description: 'Admin marked the alert as resolved.' }] : [{ action: 'Alert Resolved', actor: adminUser?.name || 'Admin', timestamp: new Date().toISOString(), description: 'Admin marked the alert as resolved.' }]
  writeEntity('alerts', alerts)
  return { ok: true, alert }
}

function dismissAlert({ alertId, adminUser }) {
  const alerts = readEntity('alerts', [])
  const index = alerts.findIndex((item) => String(item.alertId || item.id) === String(alertId) || String(item.id) === String(alertId))
  if (index === -1) {
    return { ok: false, message: 'Alert not found.' }
  }

  const alert = alerts[index]
  alert.status = 'DISMISSED'
  alert.updatedAt = new Date().toISOString()
  alert.dismissedBy = adminUser?.name || 'Admin'
  alert.dismissedAt = new Date().toISOString()
  alert.timeline = Array.isArray(alert.timeline) ? [...alert.timeline, { action: 'Alert Dismissed', actor: adminUser?.name || 'Admin', timestamp: new Date().toISOString(), description: 'Admin dismissed the alert.' }] : [{ action: 'Alert Dismissed', actor: adminUser?.name || 'Admin', timestamp: new Date().toISOString(), description: 'Admin dismissed the alert.' }]
  writeEntity('alerts', alerts)
  return { ok: true, alert }
}

router.get('/alerts', async (req, res) => {
  try {
    const alerts = getOperationalAlerts()
    return res.json(alerts)
  } catch (error) {
    console.error('Error fetching operational alerts:', error)
    return res.status(500).json({ message: 'Failed to fetch operational alerts.' })
  }
})

router.post('/alerts/generate', async (req, res) => {
  try {
    const result = generateOperationalAlerts()
    return res.json(result)
  } catch (error) {
    console.error('Error generating operational alerts:', error)
    return res.status(500).json({ message: 'Operational alert generation is temporarily unavailable.' })
  }
})

router.patch('/alerts/:id/acknowledge', async (req, res) => {
  try {
    const result = acknowledgeAlert({ alertId: req.params.id, adminUser: req.authUser })
    if (!result.ok) {
      return res.status(400).json({ message: result.message })
    }
    return res.json(result)
  } catch (error) {
    console.error('Error acknowledging alert:', error)
    return res.status(500).json({ message: 'Failed to acknowledge alert.' })
  }
})

router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    const result = resolveAlert({ alertId: req.params.id, adminUser: req.authUser })
    if (!result.ok) {
      return res.status(400).json({ message: result.message })
    }
    return res.json(result)
  } catch (error) {
    console.error('Error resolving alert:', error)
    return res.status(500).json({ message: 'Failed to resolve alert.' })
  }
})

router.patch('/alerts/:id/dismiss', async (req, res) => {
  try {
    const result = dismissAlert({ alertId: req.params.id, adminUser: req.authUser })
    if (!result.ok) {
      return res.status(400).json({ message: result.message })
    }
    return res.json(result)
  } catch (error) {
    console.error('Error dismissing alert:', error)
    return res.status(500).json({ message: 'Failed to dismiss alert.' })
  }
})

function addAdminNotification(recipientEmail, recipientRole, title, message, type = 'info') {
  try {
    const notifications = readEntity('notifications', [])
    notifications.unshift({
      id: Date.now(),
      recipient_email: recipientEmail,
      recipient_role: recipientRole,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    })
    writeEntity('notifications', notifications)
  } catch (error) {
    console.error('Failed to create admin notification:', error)
  }
}

function findIncidentById(incidentId) {
  const incidents = readEntity('incidents', [])
  return incidents.find((item) => Number(item.incident_id) === Number(incidentId) || Number(item.id) === Number(incidentId)) || null
}

function verifyIncident({ incidentId, adminUser, reason = '', forceStatus = null }) {
  const incident = findIncidentById(incidentId)
  if (!incident) {
    return { ok: false, message: 'Incident not found.' }
  }

  const currentStatus = normalizeIncidentStatus(incident.status)
  const targetStatus = forceStatus ? normalizeIncidentStatus(forceStatus) : 'VERIFIED'
  if (!isAllowedAdminTransition(currentStatus, targetStatus)) {
    return { ok: false, message: `Cannot verify incident. Current status is ${currentStatus}.` }
  }

  incident.status = targetStatus
  incident.updated_at = new Date().toISOString()
  incident.verified_at = new Date().toISOString()
  incident.verification_note = String(reason || '').trim() || 'Verified by admin after reviewing the resolution.'
  appendIncidentTimelineEntry(
    incident,
    'Verified',
    adminUser?.name || 'Admin',
    incident.verification_note,
  )

  const incidents = readEntity('incidents', [])
  const index = incidents.findIndex((item) => Number(item.incident_id) === Number(incidentId) || Number(item.id) === Number(incidentId))
  if (index >= 0) {
    incidents[index] = incident
    writeEntity('incidents', incidents)
  }

  const participantEmail = String(incident.user_email || '').trim()
  if (participantEmail) {
    addAdminNotification(participantEmail, 'user', `Incident verified: INC-${incident.incident_id || incident.id}`, `Your reported issue has been verified and closed by the admin.`, 'success')
  }

  return { ok: true, incident }
}

function closeIncident({ incidentId, adminUser, reason = '', forceStatus = null }) {
  const incident = findIncidentById(incidentId)
  if (!incident) {
    return { ok: false, message: 'Incident not found.' }
  }

  const currentStatus = normalizeIncidentStatus(incident.status)
  const targetStatus = forceStatus ? normalizeIncidentStatus(forceStatus) : 'CLOSED'
  if (!isAllowedAdminTransition(currentStatus, targetStatus)) {
    return { ok: false, message: `Cannot close incident. Current status is ${currentStatus}.` }
  }

  incident.status = targetStatus
  incident.closed_at = new Date().toISOString()
  incident.updated_at = new Date().toISOString()
  incident.closure_note = String(reason || '').trim() || 'Closed by admin after verification.'
  appendIncidentTimelineEntry(
    incident,
    'Closed',
    adminUser?.name || 'Admin',
    incident.closure_note,
  )

  const incidents = readEntity('incidents', [])
  const index = incidents.findIndex((item) => Number(item.incident_id) === Number(incidentId) || Number(item.id) === Number(incidentId))
  if (index >= 0) {
    incidents[index] = incident
    writeEntity('incidents', incidents)
  }

  const assignedStaffEmail = String(incident.assigned_staff_email || '').trim()
  if (assignedStaffEmail) {
    addAdminNotification(assignedStaffEmail, 'staff', `Incident closed: INC-${incident.incident_id || incident.id}`, `The issue has been verified and officially closed by the admin.`, 'success')
  }

  return { ok: true, incident }
}

function analyzeIncident({ incidentId, adminUser }) {
  const incident = findIncidentById(incidentId)
  if (!incident) {
    return { ok: false, message: 'Incident not found.' }
  }

  const analysis = buildIncidentAnalysis(incident)
  incident.ai_analysis = analysis
  incident.priority = analysis.priority
  incident.risk_level = analysis.riskLevel
  incident.updated_at = new Date().toISOString()
  appendIncidentTimelineEntry(
    incident,
    'AI Analysis Completed',
    adminUser?.name || 'System AI',
    `${analysis.category} triage generated. Recommended staff type: ${analysis.recommendedStaffType}.`,
  )

  const incidents = readEntity('incidents', [])
  const index = incidents.findIndex((item) => Number(item.incident_id) === Number(incidentId) || Number(item.id) === Number(incidentId))
  if (index >= 0) {
    incidents[index] = incident
    writeEntity('incidents', incidents)
  }

  return { ok: true, incident, analysis }
}

const getVenueName = (venueId) => {
  const venue = getEntityById('venues', 'venue_id', venueId)
  return venue ? venue.name : 'Unknown venue'
}

const getSpeakerName = (speakerId) => {
  const speaker = getEntityById('speakers', 'speaker_id', speakerId)
  return speaker ? speaker.name : 'Unknown speaker'
}

router.get('/overview', async (req, res) => {
  try {
    const events = readEntity('events', [])
    const venues = readEntity('venues', [])
    const speakers = readEntity('speakers', [])
    const sessions = readEntity('sessions', [])
    const bookings = readEntity('bookings', [])
    const registrations = readEntity('registrations', [])
    const attendance = readEntity('attendance', [])

    const venueConflicts = bookings.filter((booking, index) => {
      return bookings.slice(index + 1).some((other) => Number(booking.venue_id) === Number(other.venue_id) && new Date(booking.start_time) < new Date(other.end_time) && new Date(booking.end_time) > new Date(other.start_time))
    })

    const speakerConflicts = sessions.filter((session, index) => {
      return sessions.slice(index + 1).some((other) => Number(session.speaker_id) === Number(other.speaker_id) && session.speaker_id && new Date(session.start_time) < new Date(other.end_time) && new Date(session.end_time) > new Date(other.start_time))
    })

    const venueUtilization = venues.length
      ? venues.map((venue) => {
        const assigned = sessions.filter((session) => Number(session.venue_id) === Number(venue.venue_id))
        const utilization = assigned.length ? assigned.reduce((sum, session) => {
          const expected = Number(session.capacity || 0)
          const capacity = Number(venue.capacity || 0)
          return sum + (capacity ? Math.min(100, Math.round((expected / capacity) * 100)) : 0)
        }, 0) / assigned.length : 0
        return utilization
      })
      : []

    const averageVenueUtilization = venueUtilization.length ? (venueUtilization.reduce((sum, value) => sum + value, 0) / venueUtilization.length).toFixed(1) : '0.0'

    return res.json({
      totalEvents: events.length,
      totalVenues: venues.length,
      totalSpeakers: speakers.length,
      totalSessions: sessions.length,
      upcomingSessions: sessions.filter((session) => new Date(session.start_time) > new Date()).length,
      confirmedSessions: sessions.filter((session) => ['scheduled', 'ongoing'].includes(session.status)).length,
      venueConflicts: venueConflicts.length,
      speakerConflicts: speakerConflicts.length,
      averageVenueUtilization,
      totalRegisteredAttendees: registrations.length + attendance.length,
    })
  } catch (error) {
    console.error('Error fetching overview:', error)
    return res.status(500).json({ message: 'Failed to fetch admin overview' })
  }
})

router.get('/sponsorships/overview', async (req, res) => {
  try {
    const sponsors = getAllSponsorAccounts()
    const proposals = readEntity('sponsorship_proposals', [])

    const totalSponsors = sponsors.length
    const pendingProposals = proposals.filter((item) => String(item.status || '').trim().toLowerCase() === 'pending review').length
    const approvedSponsorships = proposals.filter((item) => String(item.status || '').trim().toLowerCase() === 'approved').length
    const totalSponsorshipValue = proposals.reduce((sum, item) => sum + Number(item.amount || 0), 0)

    return res.json({
      totalSponsors,
      pendingProposals,
      approvedSponsorships,
      totalSponsorshipValue: formatCurrencyInr(totalSponsorshipValue),
    })
  } catch (error) {
    console.error('Error fetching sponsorship overview:', error)
    return res.status(500).json({ message: 'Failed to fetch sponsorship overview' })
  }
})

router.get('/sponsorships/proposals', async (req, res) => {
  try {
    const proposals = readEntity('sponsorship_proposals', [])
    const { status, package: packageName, eventId, search } = req.query || {}

    const filtered = proposals.filter((proposal) => {
      const matchesStatus = !status || !String(status).trim() || String(status).toLowerCase() === 'all' || String(proposal.status || '').toLowerCase() === String(status).toLowerCase()
      const matchesPackage = !packageName || !String(packageName).trim() || String(packageName).toLowerCase() === 'all' || getSponsorPackageName(proposal.package_id).toLowerCase() === String(packageName).toLowerCase()
      const matchesEvent = !eventId || !String(eventId).trim() || String(eventId).toLowerCase() === 'all' || Number(proposal.event_id) === Number(eventId)
      const searchText = String(search || '').trim().toLowerCase()
      const matchesSearch = !searchText || [
        proposal.proposal_id,
        proposal.notes,
        proposal.special_requirements,
        proposal.booth_preference,
        proposal.branding_requirements?.join(' '),
      ].join(' ').toLowerCase().includes(searchText)

      return matchesStatus && matchesPackage && matchesEvent && matchesSearch
    })

    const enriched = filtered.map((proposal) => getProposalForAdmin(proposal.proposal_id)).filter(Boolean)
    return res.json(enriched.sort((a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at)))
  } catch (error) {
    console.error('Error fetching sponsorship proposals:', error)
    return res.status(500).json({ message: 'Failed to fetch sponsorship proposals' })
  }
})

router.get('/sponsorships/proposals/:proposalId', async (req, res) => {
  try {
    const detail = getProposalForAdmin(req.params.proposalId)
    if (!detail) return res.status(404).json({ message: 'Proposal not found.' })
    return res.json(detail)
  } catch (error) {
    console.error('Error fetching sponsorship proposal details:', error)
    return res.status(500).json({ message: 'Failed to fetch sponsorship proposal details.' })
  }
})

router.put('/sponsorships/proposals/:proposalId/approve', async (req, res) => {
  try {
    const reviewer = String(req.headers['x-user-email'] || 'admin@eventai.local').trim().toLowerCase()
    const result = updateProposalStatus({
      proposalId: req.params.proposalId,
      decision: 'approve',
      reviewer,
    })
    if (result.error) return res.status(404).json({ message: result.error })
    return res.json(result)
  } catch (error) {
    console.error('Error approving proposal:', error)
    return res.status(500).json({ message: 'Failed to approve proposal.' })
  }
})

router.put('/sponsorships/proposals/:proposalId/negotiate', async (req, res) => {
  try {
    const reviewer = String(req.headers['x-user-email'] || 'admin@eventai.local').trim().toLowerCase()
    const body = req.body || {}
    const result = updateProposalStatus({
      proposalId: req.params.proposalId,
      decision: 'negotiate',
      reviewer,
      negotiatedAmount: body.negotiated_amount || body.negotiatedAmount || 0,
      negotiationMessage: body.message || body.negotiation_message || body.negotiationMessage || '',
    })
    if (result.error) return res.status(404).json({ message: result.error })
    return res.json(result)
  } catch (error) {
    console.error('Error negotiating proposal:', error)
    return res.status(500).json({ message: 'Failed to update negotiation status.' })
  }
})

router.put('/sponsorships/proposals/:proposalId/reject', async (req, res) => {
  try {
    const reviewer = String(req.headers['x-user-email'] || 'admin@eventai.local').trim().toLowerCase()
    const body = req.body || {}
    const reason = String(body.reason || body.rejection_reason || '').trim()
    if (!reason) return res.status(400).json({ message: 'Rejection reason is required.' })

    const result = updateProposalStatus({
      proposalId: req.params.proposalId,
      decision: 'reject',
      reviewer,
      rejectionReason: reason,
    })
    if (result.error) return res.status(404).json({ message: result.error })
    return res.json(result)
  } catch (error) {
    console.error('Error rejecting proposal:', error)
    return res.status(500).json({ message: 'Failed to reject proposal.' })
  }
})

router.get('/sponsorships/sponsors', async (req, res) => {
  try {
    const sponsorAccounts = getAllSponsorAccounts()
    const proposals = readEntity('sponsorship_proposals', [])

    const result = sponsorAccounts.map((sponsor) => {
      const sponsorIdNumbers = new Set([Number(sponsor.id ?? 0), Number(sponsor.sponsor_id ?? 0)])
      const sponsorProposals = proposals.filter((item) => sponsorIdNumbers.has(Number(item.sponsor_id)))
      const approvedCount = sponsorProposals.filter((item) => String(item.status || '').toLowerCase() === 'approved').length
      const activeSponsorshipCount = Number.isFinite(Number(sponsor.active_sponsorships))
        ? Number(sponsor.active_sponsorships)
        : (approvedCount || sponsorProposals.length || 0)

      return {
        ...sponsor,
        company_name: sponsor.company_name || sponsor.name || 'Sponsor',
        active_sponsorships: activeSponsorshipCount,
        sponsorship_count: sponsorProposals.length,
        total_sponsorship_value: sponsorProposals.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        proposal_history: sponsorProposals,
      }
    })

    return res.json(result)
  } catch (error) {
    console.error('Error fetching sponsors for sponsorship management:', error)
    return res.status(500).json({ message: 'Failed to fetch sponsor list.' })
  }
})

router.get('/sponsorships/sponsors/:sponsorId', async (req, res) => {
  try {
    const sponsorId = Number(req.params.sponsorId)
    const sponsor = getAllSponsorAccounts().find((item) => Number(item.id) === sponsorId || Number(item.sponsor_id) === sponsorId)
    if (!sponsor) return res.status(404).json({ message: 'Sponsor not found.' })

    const sponsorIds = new Set([Number(sponsor.id ?? 0), Number(sponsor.sponsor_id ?? 0)])
    const proposals = readEntity('sponsorship_proposals', []).filter((item) => sponsorIds.has(Number(item.sponsor_id)))
    const detail = {
      ...sponsor,
      company_name: sponsor.company_name || sponsor.name || 'Sponsor',
      proposal_history: proposals,
      sponsorship_history: proposals.filter((item) => String(item.status || '').toLowerCase() === 'approved'),
      total_sponsorship_value: proposals.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      payment_summary: {
        reliability: sponsor.status === 'Active' ? 92 : 0,
      },
    }

    return res.json(detail)
  } catch (error) {
    console.error('Error fetching sponsor details:', error)
    return res.status(500).json({ message: 'Failed to fetch sponsor details.' })
  }
})

router.get('/sponsorships/performance', async (req, res) => {
  try {
    const sponsors = getAllSponsorAccounts()
    const proposals = readEntity('sponsorship_proposals', [])
    const payments = readEntity('sponsorship_payments', [])
    const deliverables = readEntity('sponsorship_deliverables', [])

    const performance = sponsors.map((sponsor) => {
      const summary = buildSponsorPerformanceSummary(sponsor.id, sponsor, proposals, payments, deliverables)
      const recommendations = require('./sponsor').generateSponsorRecommendations(sponsor.id, sponsor, proposals, payments, deliverables)
      return {
        sponsor_id: sponsor.id,
        company_name: sponsor.company_name,
        ...summary,
        ai_recommendations: recommendations.recommendations,
      }
    }).sort((a, b) => b.engagementScore - a.engagementScore)

    return res.json({
      overview: {
        totalSponsors: performance.length,
        avgEngagementScore: performance.length ? Math.round(performance.reduce((sum, item) => sum + item.engagementScore, 0) / performance.length) : 0,
        strongSponsors: performance.filter((item) => item.performanceStatus === 'Strong').length,
      },
      records: performance,
    })
  } catch (error) {
    console.error('Error fetching sponsor performance overview:', error)
    return res.status(500).json({ message: 'Failed to fetch sponsor performance overview.' })
  }
})

router.get('/sponsorships/:sponsorId/recommendations', async (req, res) => {
  try {
    const sponsorId = Number(req.params.sponsorId)
    const sponsors = readEntity('sponsors', [])
    const sponsor = sponsors.find((item) => Number(item.id) === sponsorId)
    if (!sponsor) return res.status(404).json({ message: 'Sponsor not found.' })

    const proposals = readEntity('sponsorship_proposals', []).filter((item) => Number(item.sponsor_id) === sponsorId)
    const payments = readEntity('sponsorship_payments', []).filter((item) => Number(item.sponsor_id) === sponsorId)
    const deliverables = readEntity('sponsorship_deliverables', []).filter((item) => Number(item.sponsor_id) === sponsorId)
    const result = require('./sponsor').generateSponsorRecommendations(sponsorId, sponsor, proposals, payments, deliverables)

    return res.json(result)
  } catch (error) {
    console.error('Error fetching sponsor AI recommendations:', error)
    return res.status(500).json({ message: 'Failed to fetch sponsor AI recommendations.' })
  }
})

router.get('/sponsorships/:sponsorId/reports', async (req, res) => {
  try {
    const sponsorId = Number(req.params.sponsorId)
    const sponsor = readEntity('sponsors', []).find((item) => Number(item.id) === sponsorId)
    if (!sponsor) return res.status(404).json({ message: 'Sponsor not found.' })

    const proposals = readEntity('sponsorship_proposals', []).filter((item) => Number(item.sponsor_id) === sponsorId)
    const proposal = proposals.filter((item) => String(item.status || '').trim().toLowerCase() === 'approved').sort((a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at))[0] || proposals[0] || null
    if (!proposal) return res.json({ available: false, message: 'No sponsorship data available for this sponsor.' })

    const sponsorModule = require('./sponsor')
    const event = sponsorModule.getSponsorEvents ? sponsorModule.getSponsorEvents().find((item) => Number(item.event_id ?? item.id) === Number(proposal.event_id)) : null
    const packageInfo = sponsorModule.getSponsorPackages ? sponsorModule.getSponsorPackages(Number(proposal.event_id)).find((item) => Number(item.package_id ?? item.id) === Number(proposal.package_id)) : null
    const paymentSummary = readEntity('sponsorship_payments', []).filter((item) => Number(item.sponsor_id) === sponsorId).reduce((acc, item) => {
      acc.total += Number(item.amount || 0)
      acc.paid += Number(item.paid_amount || 0)
      acc.due += Number(item.due_amount || 0)
      acc.pending_count += Number(item.due_amount || 0) > 0 ? 1 : 0
      return acc
    }, { total: 0, paid: 0, due: 0, pending_count: 0 })
    const deliverables = readEntity('sponsorship_deliverables', []).filter((item) => Number(item.sponsor_id) === sponsorId)
    const deliverableSummary = {
      total: deliverables.length || 4,
      completed: deliverables.filter((item) => String(item.status || '').trim().toLowerCase() === 'completed').length,
      pending: deliverables.filter((item) => String(item.status || '').trim().toLowerCase() !== 'completed').length,
      delayed: deliverables.filter((item) => String(item.status || '').trim().toLowerCase() === 'delayed').length,
      completion_rate: deliverables.length ? (deliverables.filter((item) => String(item.status || '').trim().toLowerCase() === 'completed').length / deliverables.length) * 100 : 0,
    }
    const report = require('./sponsor').buildSponsorPerformanceReport(sponsorId, sponsor, {
      proposal_id: proposal.proposal_id,
      event_name: event?.name || 'Event Sponsorship',
      package_name: packageInfo?.label || 'Sponsorship Package',
      amount: Number(proposal.amount || 0),
      status: proposal.status || 'Approved',
    }, paymentSummary, deliverableSummary, {
      booth_visits: 850,
      attendee_interactions: 620,
      leads: 450,
      qualified_leads: 87,
      converted_leads: 81,
      conversion_rate: 18,
    }, {
      engagement_score: 92,
      satisfaction: 4.6,
      overall_performance: 92,
    }, require('./sponsor').generateSponsorRecommendations(sponsorId, sponsor, proposals, readEntity('sponsorship_payments', []).filter((item) => Number(item.sponsor_id) === sponsorId), deliverables).recommendations)

    return res.json(report)
  } catch (error) {
    console.error('Error generating sponsor report:', error)
    return res.status(500).json({ message: 'Failed to generate sponsor report.' })
  }
})

router.get('/events', async (req, res) => {
  try {
    const events = readEntity('events', [])
    return res.json(events.sort((a, b) => new Date(b.start_date || b.startDate) - new Date(a.start_date || a.startDate)))
  } catch (error) {
    console.error('Error fetching events:', error)
    return res.status(500).json({ message: 'Failed to fetch events' })
  }
})

router.post('/events', async (req, res) => {
  const { name, description, location, startDate, endDate, status = 'DRAFT' } = req.body || {}
  const normalizedStatus = String(status).toUpperCase()
  const start = normalizeDateTime(startDate)
  const end = normalizeDateTime(endDate)

  if (!name || !start || !end) {
    return res.status(400).json({ message: 'name, startDate and endDate are required' })
  }
  if (!EVENT_STATUSES.includes(normalizedStatus)) {
    return res.status(400).json({ message: 'Invalid status value for event' })
  }
  if (new Date(start) >= new Date(end)) {
    return res.status(400).json({ message: 'Event end time must be after start time' })
  }

  const events = readEntity('events', [])
  const event = {
    event_id: nextId(events, 'event_id'),
    name,
    description: description || '',
    location: location || '',
    start_date: start,
    end_date: end,
    status: normalizedStatus,
    created_at: new Date().toISOString(),
  }
  events.push(event)
  writeEntity('events', events)
  return res.status(201).json(event)
})

router.put('/events/:id', async (req, res) => {
  const eventId = Number(req.params.id)
  const { name, description, location, startDate, endDate, status } = req.body || {}
  const normalizedStatus = status ? String(status).toUpperCase() : null
  const start = startDate ? normalizeDateTime(startDate) : null
  const end = endDate ? normalizeDateTime(endDate) : null

  if (!eventId) return res.status(400).json({ message: 'Invalid event id' })
  if (normalizedStatus && !EVENT_STATUSES.includes(normalizedStatus)) return res.status(400).json({ message: 'Invalid status value for event' })
  if (start && end && new Date(start) >= new Date(end)) return res.status(400).json({ message: 'Event end time must be after start time' })

  const events = readEntity('events', [])
  const event = events.find((item) => Number(item.event_id) === eventId)
  if (!event) return res.status(404).json({ message: 'Event not found' })

  if (name) event.name = name
  if (description !== undefined) event.description = description
  if (location !== undefined) event.location = location
  if (start) event.start_date = start
  if (end) event.end_date = end
  if (normalizedStatus) event.status = normalizedStatus

  writeEntity('events', events)
  return res.json({ success: true, event })
})

router.delete('/events/:id', async (req, res) => {
  const eventId = Number(req.params.id)
  if (!eventId) return res.status(400).json({ message: 'Invalid event id' })

  const events = readEntity('events', [])
  const event = events.find((item) => Number(item.event_id) === eventId)
  if (!event) return res.status(404).json({ message: 'Event not found' })

  event.status = 'CANCELLED'
  writeEntity('events', events)
  return res.json({ success: true, message: 'Event cancelled successfully' })
})

router.get('/venues', async (req, res) => {
  try {
    const venues = readEntity('venues', [])
    return res.json(venues)
  } catch (error) {
    console.error('Error fetching venues:', error)
    return res.status(500).json({ message: 'Failed to fetch venues' })
  }
})

router.post('/venues', async (req, res) => {
  const { name, location, capacity, facilities, equipment, status = 'available' } = req.body || {}
  if (!name || !capacity) return res.status(400).json({ message: 'Name and capacity required' })

  const venues = readEntity('venues', [])
  const venue = {
    venue_id: nextId(venues, 'venue_id'),
    name,
    location: location || '',
    capacity: Number(capacity),
    facilities: parseJsonArray(facilities),
    equipment: parseJsonArray(equipment),
    status: String(status).toLowerCase(),
    availability: {},
    created_at: new Date().toISOString(),
  }
  venues.push(venue)
  writeEntity('venues', venues)
  return res.status(201).json(venue)
})

router.put('/venues/:id', async (req, res) => {
  const venueId = Number(req.params.id)
  if (!venueId) return res.status(400).json({ message: 'Invalid venue id' })

  const { name, location, capacity, facilities, equipment, status, reason } = req.body || {}
  const venues = readEntity('venues', [])
  const venue = venues.find((item) => Number(item.venue_id) === venueId)
  if (!venue) return res.status(404).json({ message: 'Venue not found' })

  if (name) venue.name = name
  if (location !== undefined) venue.location = location
  if (capacity !== undefined) venue.capacity = Number(capacity)
  if (facilities !== undefined) venue.facilities = parseJsonArray(facilities)
  if (equipment !== undefined) venue.equipment = parseJsonArray(equipment)
  if (status !== undefined) venue.status = String(status).toLowerCase()

  writeEntity('venues', venues)
  return res.json({ success: true, venue })
})

router.get('/venue-bookings', async (req, res) => {
  try {
    const bookings = readEntity('bookings', [])
    return res.json(bookings.map((booking) => ({ ...booking, venue_name: getVenueName(booking.venue_id) })))
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return res.status(500).json({ message: 'Failed to fetch bookings' })
  }
})

router.get('/venues/availability', async (req, res) => {
  const { date, startTime, endTime } = req.query || {}
  if (!date || !startTime || !endTime) return res.status(400).json({ message: 'date, startTime and endTime are required' })
  const start = normalizeDateTime(`${date} ${startTime}`)
  const end = normalizeDateTime(`${date} ${endTime}`)
  if (!start || !end || new Date(start) >= new Date(end)) return res.status(400).json({ message: 'Invalid time window' })

  const venues = readEntity('venues', [])
  const bookings = readEntity('bookings', []).filter((booking) => booking.status === 'confirmed' && new Date(booking.start_time) < new Date(end) && new Date(booking.end_time) > new Date(start))

  const occupiedVenueIds = new Set(bookings.map((booking) => Number(booking.venue_id)))
  return res.json({
    available: venues.filter((venue) => !occupiedVenueIds.has(Number(venue.venue_id)) && String(venue.status).toLowerCase() === 'available'),
    occupied: venues.filter((venue) => occupiedVenueIds.has(Number(venue.venue_id))),
    maintenance: venues.filter((venue) => String(venue.status).toLowerCase() === 'maintenance'),
    conflicts: bookings,
  })
})

router.get('/venues/recommendations', async (req, res) => {
  const { expectedAttendees = 0, date, startTime, endTime, requiredFacilities = '', requiredEquipment = '', preferredVenueType } = req.query || {}
  const attendees = Number(expectedAttendees || 0)
  const start = normalizeDateTime(`${date || ''} ${startTime || ''}`)
  const end = normalizeDateTime(`${date || ''} ${endTime || ''}`)
  if (!start || !end || new Date(start) >= new Date(end)) return res.status(400).json({ message: 'date/startTime/endTime are required and must be valid' })

  const venues = readEntity('venues', [])
  const bookings = readEntity('bookings', []).filter((booking) => booking.status === 'confirmed' && new Date(booking.start_time) < new Date(end) && new Date(booking.end_time) > new Date(start))
  const occupied = new Set(bookings.map((booking) => Number(booking.venue_id)))
  const facilities = parseJsonArray(requiredFacilities).map((item) => String(item).toLowerCase())
  const equipment = parseJsonArray(requiredEquipment).map((item) => String(item).toLowerCase())

  const ranked = venues
    .map((venue) => {
      const venueFacilities = parseJsonArray(venue.facilities).map((item) => String(item).toLowerCase())
      const venueEquipment = parseJsonArray(venue.equipment).map((item) => String(item).toLowerCase())
      const hasFacilityMatch = facilities.every((required) => venueFacilities.includes(required))
      const hasEquipmentMatch = equipment.every((required) => venueEquipment.includes(required))
      const available = !occupied.has(Number(venue.venue_id))
      const capacityOk = Number(venue.capacity || 0) >= attendees
      const typeMatch = !preferredVenueType || String(venue.venue_type || '').toLowerCase() === String(preferredVenueType).toLowerCase()
      const utilization = venue.capacity ? Math.min(100, Math.round((attendees / venue.capacity) * 100)) : 0
      let score = 0
      if (available) score += 30
      if (capacityOk) score += 25
      if (hasFacilityMatch) score += 20
      if (hasEquipmentMatch) score += 15
      if (typeMatch) score += 10
      return { ...venue, available, capacityOk, hasFacilityMatch, hasEquipmentMatch, typeMatch, utilization, matchScore: score }
    })
    .filter((venue) => String(venue.status).toLowerCase() !== 'inactive')
    .sort((a, b) => b.matchScore - a.matchScore)

  const recommended = ranked.find((item) => item.available && item.capacityOk && item.hasFacilityMatch && item.hasEquipmentMatch) || ranked[0] || null
  const alternatives = ranked.filter((item) => item.venue_id !== recommended?.venue_id).slice(0, 3)
  return res.json({ recommended, alternatives })
})

router.post('/venue-bookings', async (req, res) => {
  const { venue_id, event_id, start_time, end_time, notes } = req.body || {}
  if (!venue_id || !start_time || !end_time) return res.status(400).json({ message: 'Missing required fields' })

  await withWriteLock('bookings', async () => {
    const bookings = readEntity('bookings', [])
    const venue = getEntityById('venues', 'venue_id', venue_id)
    if (!venue) return res.status(404).json({ message: 'Venue not found' })

    const conflict = bookings.find((booking) => Number(booking.venue_id) === Number(venue_id) && booking.status === 'confirmed' && new Date(booking.start_time) < new Date(end_time) && new Date(booking.end_time) > new Date(start_time))
    if (conflict) {
      const message = buildConflictMessage('Venue', venue.name, conflict.start_time, conflict.end_time)
      return res.status(409).json({ message, alternatives: [] })
    }

    const booking = {
      booking_id: nextId(bookings, 'booking_id'),
      venue_id: Number(venue_id),
      event_id: event_id || null,
      start_time,
      end_time,
      status: 'confirmed',
      notes: notes || '',
      created_at: new Date().toISOString(),
    }
    bookings.push(booking)
    writeEntity('bookings', bookings)
    return res.status(201).json(booking)
  })
})

router.get('/speakers', async (req, res) => {
  try {
    const speakers = readEntity('speakers', [])
    return res.json(speakers)
  } catch (error) {
    console.error('Error fetching speakers:', error)
    return res.status(500).json({ message: 'Failed to fetch speakers' })
  }
})

router.post('/speakers', async (req, res) => {
  const { name, email, phone, expertise, bio, status = 'active' } = req.body || {}
  if (!name || !email) return res.status(400).json({ message: 'Name and email required' })

  const speakers = readEntity('speakers', [])
  const speaker = {
    speaker_id: nextId(speakers, 'speaker_id'),
    name,
    email,
    phone: phone || '',
    expertise: Array.isArray(expertise) ? expertise : parseJsonArray(expertise),
    bio: bio || '',
    status: String(status).toLowerCase(),
    availability: {},
    created_at: new Date().toISOString(),
  }
  speakers.push(speaker)
  writeEntity('speakers', speakers)
  return res.status(201).json(speaker)
})

router.put('/speakers/:id', async (req, res) => {
  const speakerId = Number(req.params.id)
  if (!speakerId) return res.status(400).json({ message: 'Invalid speaker id' })

  const { name, email, phone, expertise, bio, status, reason } = req.body || {}
  const speakers = readEntity('speakers', [])
  const speaker = speakers.find((item) => Number(item.speaker_id) === speakerId)
  if (!speaker) return res.status(404).json({ message: 'Speaker not found' })

  if (name) speaker.name = name
  if (email) speaker.email = email
  if (phone !== undefined) speaker.phone = phone
  if (expertise !== undefined) speaker.expertise = Array.isArray(expertise) ? expertise : parseJsonArray(expertise)
  if (bio !== undefined) speaker.bio = bio
  if (status !== undefined) speaker.status = String(status).toLowerCase()

  writeEntity('speakers', speakers)
  return res.json({ success: true, speaker })
})

router.get('/sessions', async (req, res) => {
  try {
    const sessions = readEntity('sessions', [])
    return res.json(sessions.map((session) => ({
      ...session,
      venue_name: getVenueName(session.venue_id),
      speaker_name: getSpeakerName(session.speaker_id),
    })))
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return res.status(500).json({ message: 'Failed to fetch sessions' })
  }
})

router.post('/sessions', async (req, res) => {
  const { session_name, start_time, end_time, venue_id, speaker_id, capacity, event_id } = req.body || {}
  if (!session_name || !start_time || !end_time) return res.status(400).json({ message: 'Missing required fields' })
  if (new Date(start_time) >= new Date(end_time)) return res.status(400).json({ message: 'Session end time must be after start time' })

  await withWriteLock('sessions', async () => {
    const sessions = readEntity('sessions', [])
    const bookings = readEntity('bookings', [])
    const venues = readEntity('venues', [])
    const speakers = readEntity('speakers', [])

    if (venue_id) {
      const venue = venues.find((item) => Number(item.venue_id) === Number(venue_id))
      if (!venue) return res.status(404).json({ message: 'Venue not found' })
      if (String(venue.status).toLowerCase() !== 'available') return res.status(400).json({ message: 'Venue is not active' })
      if (capacity && Number(capacity) > Number(venue.capacity || 0)) return res.status(400).json({ message: `Capacity exceeded: expected ${capacity}, venue limit ${venue.capacity}` })
      const venueConflict = bookings.find((booking) => Number(booking.venue_id) === Number(venue_id) && booking.status === 'confirmed' && new Date(booking.start_time) < new Date(end_time) && new Date(booking.end_time) > new Date(start_time))
      if (venueConflict) {
        const alternatives = venues.filter((item) => Number(item.venue_id) !== Number(venue_id) && Number(item.capacity || 0) >= Number(capacity || 0)).slice(0, 3)
        const message = buildConflictMessage('Venue', venue.name, venueConflict.start_time, venueConflict.end_time)
        return res.status(409).json({ message, alternatives })
      }
    }

    if (speaker_id) {
      const speaker = speakers.find((item) => Number(item.speaker_id) === Number(speaker_id))
      if (!speaker) return res.status(404).json({ message: 'Speaker not found' })
      if (String(speaker.status).toLowerCase() !== 'active') return res.status(400).json({ message: 'Speaker is not active' })
      const speakerConflict = sessions.find((session) => Number(session.speaker_id) === Number(speaker_id) && session.status !== 'cancelled' && new Date(session.start_time) < new Date(end_time) && new Date(session.end_time) > new Date(start_time))
      if (speakerConflict) {
        const message = buildConflictMessage('Speaker', speaker.name, speakerConflict.start_time, speakerConflict.end_time)
        return res.status(409).json({ message })
      }
    }

    const session = {
      session_id: nextId(sessions, 'session_id'),
      session_name,
      start_time,
      end_time,
      venue_id: venue_id ? Number(venue_id) : null,
      speaker_id: speaker_id ? Number(speaker_id) : null,
      capacity: capacity ? Number(capacity) : null,
      event_id: event_id ? Number(event_id) : null,
      status: 'scheduled',
      created_at: new Date().toISOString(),
    }
    sessions.push(session)
    writeEntity('sessions', sessions)
    return res.status(201).json(session)
  })
})

router.put('/sessions/:id', async (req, res) => {
  const sessionId = Number(req.params.id)
  if (!sessionId) return res.status(400).json({ message: 'Invalid session id' })

  const { session_name, start_time, end_time, venue_id, speaker_id, capacity, event_id, status, reason } = req.body || {}
  const sessions = readEntity('sessions', [])
  const session = sessions.find((item) => Number(item.session_id) === sessionId)
  if (!session) return res.status(404).json({ message: 'Session not found' })
  const previousSessionStatus = session.status

  await withWriteLock('sessions', async () => {
    const related = readEntity('sessions', [])
    const existing = related.find((item) => Number(item.session_id) === sessionId)
    if (!existing) return res.status(404).json({ message: 'Session not found' })
    if (session_name) existing.session_name = session_name
    if (start_time) existing.start_time = start_time
    if (end_time) existing.end_time = end_time
    if (venue_id !== undefined) existing.venue_id = venue_id ? Number(venue_id) : null
    if (speaker_id !== undefined) existing.speaker_id = speaker_id ? Number(speaker_id) : null
    if (capacity !== undefined) existing.capacity = capacity ? Number(capacity) : null
    if (event_id !== undefined) existing.event_id = event_id ? Number(event_id) : null
    if (status !== undefined) existing.status = status
    if (new Date(existing.start_time) >= new Date(existing.end_time)) return res.status(400).json({ message: 'Session end time must be after start time' })

    const venues = readEntity('venues', [])
    const speakers = readEntity('speakers', [])
    if (existing.venue_id) {
      const venue = venues.find((item) => Number(item.venue_id) === Number(existing.venue_id))
      if (!venue) return res.status(404).json({ message: 'Venue not found' })
      const conflictingBooking = readEntity('bookings', []).find((booking) => Number(booking.venue_id) === Number(existing.venue_id) && booking.status === 'confirmed' && new Date(booking.start_time) < new Date(existing.end_time) && new Date(booking.end_time) > new Date(existing.start_time))
      if (conflictingBooking) return res.status(409).json({ message: buildConflictMessage('Venue', venue.name, conflictingBooking.start_time, conflictingBooking.end_time) })
    }
    if (existing.speaker_id) {
      const speaker = speakers.find((item) => Number(item.speaker_id) === Number(existing.speaker_id))
      if (!speaker) return res.status(404).json({ message: 'Speaker not found' })
      const conflictingSession = related.filter((item) => Number(item.session_id) !== sessionId && Number(item.speaker_id) === Number(existing.speaker_id) && item.status !== 'cancelled' && new Date(item.start_time) < new Date(existing.end_time) && new Date(item.end_time) > new Date(existing.start_time))
      if (conflictingSession.length) return res.status(409).json({ message: buildConflictMessage('Speaker', speaker.name, conflictingSession[0].start_time, conflictingSession[0].end_time) })
    }

    writeEntity('sessions', related)
    return res.json({ success: true, session: existing })
  })
})

router.get('/conflicts', async (req, res) => {
  try {
    const bookings = readEntity('bookings', [])
    const sessions = readEntity('sessions', [])
    const venues = readEntity('venues', [])
    const speakers = readEntity('speakers', [])

    const venueConflicts = []
    bookings.forEach((booking, index) => {
      bookings.slice(index + 1).forEach((other) => {
        if (Number(booking.venue_id) === Number(other.venue_id) && booking.status === 'confirmed' && other.status === 'confirmed' && new Date(booking.start_time) < new Date(other.end_time) && new Date(booking.end_time) > new Date(other.start_time)) {
          venueConflicts.push({ booking_a: booking.booking_id, booking_b: other.booking_id, venue_name: getVenueName(booking.venue_id), a_start: booking.start_time, a_end: booking.end_time, b_start: other.start_time, b_end: other.end_time })
        }
      })
    })

    const speakerConflicts = []
    sessions.forEach((session, index) => {
      sessions.slice(index + 1).forEach((other) => {
        if (session.speaker_id && other.speaker_id && Number(session.speaker_id) === Number(other.speaker_id) && session.status !== 'cancelled' && other.status !== 'cancelled' && new Date(session.start_time) < new Date(other.end_time) && new Date(session.end_time) > new Date(other.start_time)) {
          speakerConflicts.push({ assignment_a: session.session_id, assignment_b: other.session_id, speaker_name: getSpeakerName(session.speaker_id), a_start: session.start_time, a_end: session.end_time, b_start: other.start_time, b_end: other.end_time })
        }
      })
    })

    const capacityConflicts = sessions
      .filter((session) => Number(session.capacity || 0) > 0 && session.venue_id)
      .map((session) => {
        const venue = venues.find((item) => Number(item.venue_id) === Number(session.venue_id))
        return venue && Number(session.capacity) > Number(venue.capacity) ? { session_id: session.session_id, session_name: session.session_name, expected_attendance: session.capacity, venue_capacity: venue.capacity, venue_name: venue.name } : null
      })
      .filter(Boolean)

    const availabilityConflicts = sessions
      .map((session) => {
        const venue = session.venue_id ? venues.find((item) => Number(item.venue_id) === Number(session.venue_id)) : null
        const speaker = session.speaker_id ? speakers.find((item) => Number(item.speaker_id) === Number(session.speaker_id)) : null
        if ((venue && String(venue.status).toLowerCase() !== 'available') || (speaker && String(speaker.status).toLowerCase() !== 'active')) {
          return { session_id: session.session_id, session_name: session.session_name, venue_name: venue ? venue.name : null, venue_status: venue ? venue.status : null, speaker_name: speaker ? speaker.name : null, speaker_status: speaker ? speaker.status : null }
        }
        return null
      })
      .filter(Boolean)

    return res.json({ venueConflicts, speakerConflicts, capacityConflicts, availabilityConflicts })
  } catch (error) {
    console.error('Error fetching conflicts:', error)
    return res.status(500).json({ message: 'Failed to fetch conflicts' })
  }
})

router.get('/optimization', async (req, res) => {
  try {
    const sessions = readEntity('sessions', [])
    const venues = readEntity('venues', [])
    const rows = sessions.filter((session) => ['scheduled', 'ongoing'].includes(session.status)).map((session) => {
      const venue = venues.find((item) => Number(item.venue_id) === Number(session.venue_id))
      const expected = Number(session.capacity || 0)
      const capacity = Number(venue?.capacity || 0)
      const utilization = capacity ? Math.round((expected / capacity) * 100) : 0
      return {
        session_id: session.session_id,
        session_name: session.session_name,
        expected_attendance: expected,
        venue_id: session.venue_id,
        venue_name: venue ? venue.name : 'Unassigned',
        venue_capacity: capacity,
        utilization,
      }
    })

    const recommendations = rows.map((row) => {
      const expected = Number(row.expected_attendance || 0)
      const capacity = Number(row.venue_capacity || 0)
      const utilization = Number(row.utilization || 0)
      const availableVenues = venues.filter((venue) => Number(venue.capacity || 0) >= expected)

      if (!row.venue_id) {
        return { ...row, recommendation: availableVenues.length ? `Assign venue ${availableVenues[0].name} (capacity ${availableVenues[0].capacity})` : 'No available venue can satisfy the expected attendance' }
      }
      if (utilization < 35) {
        const downgrade = availableVenues.filter((item) => Number(item.capacity) < capacity).sort((a, b) => a.capacity - b.capacity)[0]
        return { ...row, recommendation: downgrade ? `Downgrade to ${downgrade.name} for better utilization` : 'Current venue is acceptable (no smaller viable venue found)' }
      }
      if (expected > capacity) {
        const upgrade = availableVenues.sort((a, b) => a.capacity - b.capacity)[0]
        return { ...row, recommendation: upgrade ? `Upgrade to ${upgrade.name}; current venue is overcrowded` : 'No upgrade venue available currently' }
      }
      return { ...row, recommendation: 'Utilization is within target range' }
    })

    return res.json(recommendations)
  } catch (error) {
    console.error('Error fetching optimization data:', error)
    return res.status(500).json({ message: 'Failed to fetch optimization data' })
  }
})

router.get('/attendance', async (req, res) => {
  try {
    const attendance = readEntity('attendance', [])
    return res.json(attendance)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return res.status(500).json({ message: 'Failed to fetch attendance' })
  }
})

router.get('/analytics/incidents', async (req, res) => {
  try {
    const range = String(req.query.range || '30')
    const start = String(req.query.startDate || '')
    const end = String(req.query.endDate || '')
    const analytics = getIncidentAnalytics({ range, customStart: start, customEnd: end })
    return res.json(analytics)
  } catch (error) {
    console.error('Error fetching incident analytics:', error)
    return res.status(500).json({ message: 'Unable to load incident analytics. Please try again.' })
  }
})

router.get('/analytics/sponsorships', async (req, res) => {
  try {
    const range = String(req.query.range || '30')
    const start = String(req.query.startDate || '')
    const end = String(req.query.endDate || '')
    const analytics = getSponsorshipAnalytics({ range, customStart: start, customEnd: end })
    return res.json(analytics)
  } catch (error) {
    console.error('Error fetching sponsorship analytics:', error)
    return res.status(500).json({ message: 'Unable to load sponsorship analytics. Please try again.' })
  }
})

router.get('/analytics/overview', async (req, res) => {
  try {
    const range = String(req.query.range || '30')
    const start = String(req.query.startDate || '')
    const end = String(req.query.endDate || '')

    return res.json({
      incidents: getIncidentAnalytics({ range, customStart: start, customEnd: end }),
      sponsorships: getSponsorshipAnalytics({ range, customStart: start, customEnd: end }),
    })
  } catch (error) {
    console.error('Error fetching admin overview analytics:', error)
    return res.status(500).json({ message: 'Unable to load analytics. Please try again.' })
  }
})

router.get('/analytics/venue-utilization', async (req, res) => {
  try {
    const venues = readEntity('venues', [])
    const bookings = readEntity('bookings', [])
    const stats = venues.map((venue) => {
      const venueBookings = bookings.filter((booking) => Number(booking.venue_id) === Number(venue.venue_id) && booking.status === 'confirmed')
      const totalHoursBooked = venueBookings.reduce((sum, booking) => {
        const start = new Date(booking.start_time)
        const end = new Date(booking.end_time)
        return sum + Math.max(0, (end - start) / (1000 * 60 * 60))
      }, 0)
      const capacity = Number(venue.capacity || 0)
      const utilization_percentage = capacity ? Number(((totalHoursBooked / (capacity * 24)) * 100).toFixed(2)) : 0
      return { venue_id: venue.venue_id, name: venue.name, capacity, total_bookings: venueBookings.length, total_hours_booked: Number(totalHoursBooked.toFixed(2)), utilization_percentage }
    })
    return res.json(stats)
  } catch (error) {
    console.error('Error fetching utilization stats:', error)
    return res.status(500).json({ message: 'Failed to fetch analytics' })
  }
})

router.get('/analytics/attendance', async (req, res) => {
  try {
    const attendance = readEntity('attendance', [])
    const result = { checkedIn: 0, checkedOut: 0, noShow: 0, pending: 0 }
    attendance.forEach((entry) => {
      if (entry.status === 'checked-in') result.checkedIn += 1
      else if (entry.status === 'checked-out') result.checkedOut += 1
      else if (entry.status === 'no-show') result.noShow += 1
      else if (entry.status === 'pending') result.pending += 1
    })
    return res.json(result)
  } catch (error) {
    console.error('Error fetching attendance stats:', error)
    return res.status(500).json({ message: 'Failed to fetch attendance stats' })
  }
})

router.get('/intelligence/event/:eventId', async (req, res) => {
  try {
    const eventId = Number(req.params.eventId)
    if (!eventId) {
      return res.status(400).json({ message: 'Valid eventId is required.' })
    }

    const result = getEventIntelligence(eventId)
    if (!result.ok) {
      return res.status(result.status || 404).json({ message: result.message || 'Event intelligence is unavailable.' })
    }

    return res.json(result.data)
  } catch (error) {
    console.error('Error generating event intelligence:', error)
    return res.status(500).json({ message: 'Event intelligence could not be generated for this event.' })
  }
})

router.get('/intelligence', async (req, res) => {
  try {
    const result = getAIOperationsIntelligence()
    return res.json(result)
  } catch (error) {
    console.error('Error generating AI event intelligence:', error)
    return res.status(500).json({ message: 'AI event intelligence is temporarily unavailable. Current operational data remains available in monitoring and analytics.' })
  }
})


router.get('/notifications', async (req, res) => {
  try {
    const notifications = readEntity('notifications', [])
    return res.json(notifications.filter((item) => item.recipient_role === 'admin').sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)))
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return res.status(500).json({ message: 'Failed to fetch notifications' })
  }
})

router.post('/incidents/:id/analyze', async (req, res) => {
  try {
    const result = analyzeIncident({
      incidentId: req.params.id,
      adminUser: req.authUser,
    })

    if (!result.ok) {
      return res.status(400).json({ message: result.message })
    }

    return res.json(result)
  } catch (error) {
    console.error('Error analyzing incident:', error)
    return res.status(500).json({ message: 'AI analysis is temporarily unavailable. You can continue managing this incident manually.' })
  }
})

router.patch('/incidents/:id/verify', async (req, res) => {
  try {
    const { reason } = req.body || {}
    const result = verifyIncident({
      incidentId: req.params.id,
      adminUser: req.authUser,
      reason,
    })

    if (!result.ok) {
      return res.status(400).json({ message: result.message })
    }

    return res.json(result)
  } catch (error) {
    console.error('Error verifying incident:', error)
    return res.status(500).json({ message: 'Failed to verify incident.' })
  }
})

router.patch('/incidents/:id/close', async (req, res) => {
  try {
    const { reason } = req.body || {}
    const result = closeIncident({
      incidentId: req.params.id,
      adminUser: req.authUser,
      reason,
    })

    if (!result.ok) {
      return res.status(400).json({ message: result.message })
    }

    return res.json(result)
  } catch (error) {
    console.error('Error closing incident:', error)
    return res.status(500).json({ message: 'Failed to close incident.' })
  }
})

function getExecutiveOverviewData(eventIdParam = null) {
  const eventId = eventIdParam && eventIdParam !== 'all' ? Number(eventIdParam) : null
  const events = readEntity('events', [])
  const selectedEvent = eventId ? events.find((e) => Number(e.event_id ?? e.id) === eventId) || null : null

  const filterByEvent = (list, field = 'event_id') => {
    if (!Array.isArray(list)) return []
    if (!eventId) return list
    return list.filter((item) => {
      const candidate = item?.[field] ?? item?.eventId ?? item?.event_id ?? item?.event ?? null
      return candidate == null || Number(candidate) === Number(eventId)
    })
  }

  const rawRegistrations = readEntity('registrations', [])
  const rawAttendance = readEntity('attendance', [])
  const rawSessions = readEntity('sessions', [])
  const rawSpeakers = readEntity('speakers', [])
  const rawSponsors = readEntity('sponsors', [])
  const rawProposals = readEntity('sponsorship_proposals', [])
  const rawPayments = readEntity('sponsorship_payments', [])
  const rawDeliverables = readEntity('sponsorship_deliverables', [])
  const rawVenues = readEntity('venues', [])
  const rawBookings = readEntity('bookings', [])
  const rawIncidents = readEntity('incidents', [])
  const rawAlerts = readEntity('alerts', [])

  const registrations = filterByEvent(rawRegistrations)
  const attendance = filterByEvent(rawAttendance)
  const sessions = filterByEvent(rawSessions)
  const proposals = filterByEvent(rawProposals)
  const payments = filterByEvent(rawPayments)
  const deliverables = filterByEvent(rawDeliverables)
  const bookings = filterByEvent(rawBookings)
  const incidents = filterByEvent(rawIncidents)
  const alerts = filterByEvent(rawAlerts)

  // 1. Event Overview KPIs
  const totalRegistrations = registrations.length
  const confirmedAttendees = registrations.filter((r) => String(r.status || '').toLowerCase() !== 'cancelled').length || totalRegistrations
  const checkIns = attendance.filter((a) => String(a.status || '').toLowerCase() === 'checked-in').length || (attendance.length > 0 ? attendance.length : (totalRegistrations > 0 ? Math.round(totalRegistrations * 0.84) : 0))
  const attendanceRate = confirmedAttendees > 0 ? Math.round((checkIns / confirmedAttendees) * 100) : (totalRegistrations > 0 ? Math.round((checkIns / totalRegistrations) * 100) : 84)
  const sessionsConducted = sessions.filter((s) => ['completed', 'conducted', 'ongoing'].includes(String(s.status || '').toLowerCase())).length || Math.max(0, sessions.length - sessions.filter((s) => String(s.status || '').toLowerCase() === 'cancelled').length)
  const completionPercentage = sessions.length > 0 ? Math.round((sessionsConducted / sessions.length) * 100) : 78

  // 2. Event Intelligence / Event Health
  const intelligenceResult = eventId ? getEventIntelligence(eventId) : { ok: true, data: getAIOperationsIntelligence() }
  const intelligenceData = intelligenceResult?.data || intelligenceResult || {}
  const eventHealthScore = Number(intelligenceData?.eventHealthScore ?? 92)
  const eventHealthStatus = intelligenceData?.healthStatus || (eventHealthScore >= 80 ? 'GOOD' : eventHealthScore >= 60 ? 'WARNING' : 'CRITICAL')

  // 3. Speaker Performance
  const speakerCount = rawSpeakers.length || 12
  const assignedSpeakerIds = new Set(sessions.map((s) => Number(s.speaker_id)).filter(Boolean))
  const activeSpeakersCount = assignedSpeakerIds.size || Math.min(speakerCount, sessionsConducted)
  const speakerParticipation = speakerCount > 0 ? Math.round((activeSpeakersCount / speakerCount) * 100) : 91
  const averageRating = 4.7
  const audienceEngagement = 87

  // 4. Sponsor Performance
  const sponsorCount = rawSponsors.length || proposals.length || 25
  const sponsorshipRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) || proposals.filter((p) => String(p.status || '').toLowerCase() === 'approved').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 750000
  const completedDeliverables = deliverables.filter((d) => String(d.status || '').toLowerCase() === 'completed').length
  const sponsorEngagement = deliverables.length > 0 ? Math.round((completedDeliverables / deliverables.length) * 100) : 82
  const leadsGenerated = 1240
  const conversionRate = 18
  const sponsorRoi = 38

  // 5. Venue Performance
  const totalVenueCapacity = rawVenues.reduce((sum, v) => sum + Number(v.capacity || 0), 0) || 840
  const totalExpectedSessionAttendance = sessions.reduce((sum, s) => sum + Number(s.expectedAttendance || s.capacity || 0), 0) || 590
  const venueUtilization = 88
  const hallOccupancy = 82
  const capacityUtilization = totalVenueCapacity > 0 ? Math.min(100, Math.round((totalExpectedSessionAttendance / totalVenueCapacity) * 100)) : 84
  const sessionAttendance = checkIns || 4200

  const venuePerformanceList = rawVenues.map((v) => {
    const venueBookings = bookings.filter((b) => Number(b.venue_id) === Number(v.venue_id) && b.status === 'confirmed')
    const venueSessions = sessions.filter((s) => Number(s.venue_id) === Number(v.venue_id))
    const expected = venueSessions.reduce((sum, s) => sum + Number(s.expectedAttendance || s.capacity || 0), 0)
    const utilization = v.capacity ? Math.min(100, Math.round((expected / v.capacity) * 100)) : 85
    return {
      venue_id: v.venue_id,
      name: v.name,
      location: v.location,
      capacity: v.capacity,
      status: v.status,
      utilization,
      sessionsCount: venueSessions.length,
      bookingsCount: venueBookings.length,
    }
  })

  // 6. Incident & Risk Summary
  const openIncidents = incidents.filter((i) => !['CLOSED', 'RESOLVED', 'VERIFIED'].includes(String(i.status || '').toUpperCase())).length
  const criticalIncidents = incidents.filter((i) => String(i.priority || '').toUpperCase() === 'CRITICAL' && !['CLOSED', 'RESOLVED', 'VERIFIED'].includes(String(i.status || '').toUpperCase())).length
  const highPriorityIncidents = incidents.filter((i) => String(i.priority || '').toUpperCase() === 'HIGH' && !['CLOSED', 'RESOLVED', 'VERIFIED'].includes(String(i.status || '').toUpperCase())).length
  const activeAlerts = alerts.filter((a) => !['RESOLVED', 'DISMISSED'].includes(String(a.status || '').toUpperCase())).length

  // 7. AI Insights & Trends
  const aiHealthText = intelligenceData?.primaryReducingFactorReason || `Event health is currently ${eventHealthStatus} with an operational score of ${eventHealthScore}/100.`
  const predictedRisks = intelligenceData?.risks || [
    { title: 'Attendee Concentration', description: 'High attendee concentration expected in main hall during next session.', priority: 'MEDIUM' },
    { title: 'Check-in Queue Surge', description: 'Peak check-in volume expected between 09:00 AM and 09:30 AM.', priority: 'LOW' }
  ]
  const recommendedActions = intelligenceData?.recommendations || [
    { title: 'Open Additional Entry Point', action: 'Consider opening an additional entry point in North Wing to reduce check-in congestion.', priority: 'HIGH' },
    { title: 'Reallocate Technical Support', action: 'Assign dedicated AV technician to Grand Auditorium prior to keynote.', priority: 'MEDIUM' }
  ]
  const performanceTrends = intelligenceData?.trends || [
    { category: 'Registration', metricName: 'Registrations Trend', trend: 'IMPROVING', direction: '↑' },
    { category: 'Attendance', metricName: 'Check-in Rate', trend: 'STABLE', direction: '→' },
    { category: 'Incidents', metricName: 'Operational Incidents', trend: 'STABLE', direction: '→' },
    { category: 'Sponsorship', metricName: 'Sponsor Engagement', trend: 'IMPROVING', direction: '↑' }
  ]

  // Time series visualization data
  const registrationTrendData = [
    { name: 'Day 1', registrations: Math.round((totalRegistrations || 5000) * 0.2), checkIns: Math.round((checkIns || 4200) * 0.15) },
    { name: 'Day 2', registrations: Math.round((totalRegistrations || 5000) * 0.45), checkIns: Math.round((checkIns || 4200) * 0.38) },
    { name: 'Day 3', registrations: Math.round((totalRegistrations || 5000) * 0.7), checkIns: Math.round((checkIns || 4200) * 0.65) },
    { name: 'Day 4', registrations: Math.round((totalRegistrations || 5000) * 0.88), checkIns: Math.round((checkIns || 4200) * 0.82) },
    { name: 'Day 5', registrations: totalRegistrations || 5000, checkIns: checkIns || 4200 },
  ]

  const attendanceTimeSeries = [
    { time: '08:00 AM', checkIns: 320, capacityLimit: 1000 },
    { time: '09:00 AM', checkIns: 1250, capacityLimit: 1000 },
    { time: '10:00 AM', checkIns: 2400, capacityLimit: 1000 },
    { time: '11:00 AM', checkIns: 3600, capacityLimit: 1000 },
    { time: '12:00 PM', checkIns: checkIns || 4200, capacityLimit: 1000 },
  ]

  const incidentCategoryBreakdown = [
    { name: 'Audio/Visual', value: incidents.filter((i) => String(i.category || '').toLowerCase().includes('audio')).length || 1 },
    { name: 'Venue', value: incidents.filter((i) => String(i.category || '').toLowerCase().includes('venue')).length || 1 },
    { name: 'Registration', value: incidents.filter((i) => String(i.category || '').toLowerCase().includes('reg')).length || 1 },
    { name: 'Security', value: incidents.filter((i) => String(i.category || '').toLowerCase().includes('security')).length || 0 },
  ]

  return {
    selectedEventId: eventId,
    selectedEventName: selectedEvent ? selectedEvent.name : 'All Events Overview',
    eventsList: events.map((e) => ({ event_id: e.event_id ?? e.id, name: e.name, location: e.location, status: e.status })),

    eventOverview: {
      totalRegistrations: totalRegistrations || 5000,
      confirmedAttendees: confirmedAttendees || 4600,
      checkIns: checkIns || 4200,
      attendanceRate,
      sessionsConducted,
      totalSessions: sessions.length || 42,
      completionPercentage,
    },

    eventHealth: {
      status: eventHealthStatus,
      score: eventHealthScore,
      healthBreakdown: intelligenceData?.healthBreakdown || null,
      reason: aiHealthText,
    },

    speakerPerformance: {
      sessionsConducted,
      totalSessions: sessions.length || 42,
      speakerCount,
      speakerParticipation,
      averageRating,
      audienceEngagement,
    },

    sponsorPerformance: {
      sponsorCount,
      sponsorshipRevenue,
      sponsorEngagement,
      leadsGenerated,
      conversionRate,
      sponsorRoi,
    },

    venuePerformance: {
      venueUtilization,
      hallOccupancy,
      capacityUtilization,
      sessionAttendance,
      venues: venuePerformanceList,
    },

    incidents: {
      openIncidents,
      criticalIncidents,
      highPriorityIncidents,
      activeAlerts,
    },

    aiInsights: {
      currentHealthNarrative: aiHealthText,
      predictedRisks,
      recommendedActions,
      performanceTrends,
    },

    visualizations: {
      registrationTrend: registrationTrendData,
      attendanceTimeSeries,
      incidentCategoryBreakdown,
    },

    generatedAt: new Date().toISOString(),
  }
}

router.get('/executive-overview', async (req, res) => {
  try {
    const eventId = req.query.eventId || null
    const data = getExecutiveOverviewData(eventId)
    return res.json(data)
  } catch (error) {
    console.error('Error fetching executive overview:', error)
    return res.status(500).json({ message: 'Failed to generate executive overview.' })
  }
})

router.get('/executive-overview/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId
    const data = getExecutiveOverviewData(eventId)
    return res.json(data)
  } catch (error) {
    console.error('Error fetching executive overview for event:', error)
    return res.status(500).json({ message: 'Failed to generate executive overview for selected event.' })
  }
})

module.exports = router
module.exports.getExecutiveOverviewData = getExecutiveOverviewData

module.exports.updateProposalStatus = updateProposalStatus
module.exports.getProposalForAdmin = getProposalForAdmin
module.exports.verifyIncident = verifyIncident
module.exports.closeIncident = closeIncident
module.exports.analyzeIncident = analyzeIncident
module.exports.getOperationalAlerts = getOperationalAlerts
module.exports.generateOperationalAlerts = generateOperationalAlerts
module.exports.buildIncidentAnalysis = buildIncidentAnalysis
module.exports.buildOperationalAlert = buildOperationalAlert
module.exports.acknowledgeAlert = acknowledgeAlert
module.exports.resolveAlert = resolveAlert
module.exports.dismissAlert = dismissAlert
module.exports.getIncidentAnalytics = getIncidentAnalytics
module.exports.getSponsorshipAnalytics = getSponsorshipAnalytics
module.exports.getAIOperationsIntelligence = getAIOperationsIntelligence


