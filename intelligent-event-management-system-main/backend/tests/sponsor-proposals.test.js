const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')

const sponsorModule = require('../routes/sponsor')

const filePath = path.join(__dirname, '..', 'sponsorship_proposals.json')

function resetFile() {
  fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8')
}

test('Sponsor proposal payload is persisted with proposal_id and pending review status', () => {
  resetFile()

  const payload = {
    sponsor_id: 1,
    event_id: 1,
    package_id: 1,
    requirement_id: 1,
    amount: 500000,
    status: 'Pending Review',
    submitted_at: new Date().toISOString(),
    notes: 'Premium booth near entrance',
  }

  const result = sponsorModule.saveProposal(payload)

  assert.equal(result.sponsor_id, 1)
  assert.equal(result.event_id, 1)
  assert.equal(result.package_id, 1)
  assert.equal(result.status, 'Pending Review')
  assert.match(result.proposal_id, /^SP-\d{4}-\d{4}$/)

  const saved = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  assert.equal(saved.length, 1)
  assert.equal(saved[0].proposal_id, result.proposal_id)
})
