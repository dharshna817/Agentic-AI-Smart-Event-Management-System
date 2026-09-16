const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')

const adminRoutes = require('../routes/admin')
const sponsorRoutes = require('../routes/sponsor')

const proposalFile = path.join(__dirname, '..', 'sponsorship_proposals.json')
const notificationsFile = path.join(__dirname, '..', 'notifications.json')

function resetData() {
  fs.writeFileSync(proposalFile, JSON.stringify([
    {
      id: 1,
      proposal_id: 'SP-2026-0001',
      sponsor_id: 1,
      event_id: 1,
      package_id: 1,
      amount: 500000,
      status: 'Pending Review',
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      branding_requirements: ['Main Stage'],
      promotional_sessions: 2,
      special_requirements: 'Premium booth near entrance',
      notes: 'Premium booth near entrance',
      rejection_reason: '',
      negotiation_message: '',
      negotiated_amount: 0,
      reviewed_by: '',
      reviewed_at: '',
      status_history: [],
    }
  ], null, 2), 'utf8')

  fs.writeFileSync(notificationsFile, JSON.stringify([], null, 2), 'utf8')
}

test('Admin sponsorship update stores status history and notification payload', () => {
  resetData()

  const outcome = adminRoutes.updateProposalStatus({
    proposalId: 'SP-2026-0001',
    decision: 'approve',
    reviewer: 'admin@eventai.local',
    rejectionReason: '',
    negotiationMessage: '',
    negotiatedAmount: 0,
  })

  assert.equal(outcome.status, 'Approved')
  assert.ok(Array.isArray(outcome.status_history))
  assert.equal(outcome.status_history.at(-1).status, 'Approved')
  assert.equal(outcome.reviewed_by, 'admin@eventai.local')

  const notifications = JSON.parse(fs.readFileSync(notificationsFile, 'utf8'))
  assert.equal(notifications.length, 1)
  assert.match(notifications[0].message, /approved/i)

  const updated = adminRoutes.getProposalForAdmin('SP-2026-0001')
  assert.equal(updated.status, 'Approved')
})

test('Approved proposals generate payment and deliverable tracking records', () => {
  resetData()

  const outcome = adminRoutes.updateProposalStatus({
    proposalId: 'SP-2026-0001',
    decision: 'approve',
    reviewer: 'admin@eventai.local',
  })

  assert.equal(outcome.status, 'Approved')

  const payments = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'sponsorship_payments.json'), 'utf8'))
  const deliverables = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'sponsorship_deliverables.json'), 'utf8'))

  assert.ok(payments.some((entry) => String(entry.proposal_id) === 'SP-2026-0001'))
  assert.ok(deliverables.some((entry) => String(entry.proposal_id) === 'SP-2026-0001'))
  assert.ok(payments.some((entry) => Number(entry.amount) > 0))
  assert.ok(deliverables.some((entry) => String(entry.status).toLowerCase() !== 'completed'))
})

test('Approved proposals reuse branding and special requirements in deliverable names', () => {
  resetData()

  const updated = adminRoutes.updateProposalStatus({
    proposalId: 'SP-2026-0001',
    decision: 'approve',
    reviewer: 'admin@eventai.local',
  })

  assert.equal(updated.status, 'Approved')

  const deliverables = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'sponsorship_deliverables.json'), 'utf8'))
  const proposalDeliverables = deliverables.filter((entry) => String(entry.proposal_id) === 'SP-2026-0001')

  assert.ok(proposalDeliverables.length > 0)
  assert.ok(proposalDeliverables.some((entry) => String(entry.title).toLowerCase().includes('main stage')))
  assert.ok(proposalDeliverables.some((entry) => String(entry.title).toLowerCase().includes('premium booth')))
})
