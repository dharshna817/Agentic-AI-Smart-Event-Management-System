const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')

const sponsorModule = require('../routes/sponsor')

const filePath = path.join(__dirname, '..', 'sponsorship_requirements.json')

function resetFile() {
  fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8')
}

test('Sponsor requirement payload is persisted and mapped to saved sponsorship record', () => {
  resetFile()

  const payload = {
    sponsor_id: 7,
    event_id: 2,
    package_id: 2,
    amount: 300000,
    booth_required: true,
    booth_preference: 'Near Entrance',
    branding_requirements: ['Main Stage', 'Digital Screens'],
    promotional_sessions: 2,
    special_requirements: 'Need extra signage and lead capture support.'
  }

  const result = sponsorModule.saveSponsorshipRequirements(payload)

  assert.equal(result.sponsor_id, 7)
  assert.equal(result.event_id, 2)
  assert.equal(result.package_id, 2)
  assert.equal(result.booth_preference, 'Near Entrance')
  assert.equal(result.promotional_sessions, 2)
  assert.deepEqual(result.branding_requirements, ['Main Stage', 'Digital Screens'])

  const saved = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  assert.equal(saved.length, 1)
  assert.equal(saved[0].event_id, 2)
  assert.equal(saved[0].sponsor_id, 7)
})
