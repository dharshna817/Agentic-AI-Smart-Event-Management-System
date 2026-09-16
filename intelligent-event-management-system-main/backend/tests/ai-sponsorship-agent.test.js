const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')

const { analyzeProposal, getProposalAnalysis } = require('../lib/sponsorshipAgent')

const analysisFile = path.join(__dirname, '..', 'sponsorship_agent_analysis.json')

function resetAnalysisFile() {
  fs.writeFileSync(analysisFile, JSON.stringify([], null, 2), 'utf8')
}

test('AI sponsorship agent produces a scored analysis and recommendation', () => {
  resetAnalysisFile()

  const proposal = {
    proposal_id: 'SP-2026-0001',
    sponsor_id: 1,
    event_id: 1,
    package_id: 1,
    amount: 500000,
    booth_required: true,
    booth_preference: 'Premium',
    branding_requirements: ['Main Stage', 'Entrance'],
    promotional_sessions: 2,
    special_requirements: 'Premium booth near entrance',
    status: 'Pending Review',
    submitted_at: new Date().toISOString(),
  }

  const sponsor = {
    id: 1,
    company_name: 'ABC Technologies',
    industry: 'Technology',
    status: 'Active',
    role: 'sponsor',
  }

  const event = {
    id: 1,
    name: 'Tech Innovation Summit',
    location: 'Chennai',
    start_date: '2026-09-25T09:00:00.000Z',
  }

  const packageInfo = {
    id: 1,
    name: 'Platinum',
    price: 500000,
  }

  const analysis = analyzeProposal({ proposal, sponsor, event, packageInfo })

  assert.equal(analysis.proposal_id, 'SP-2026-0001')
  assert.ok(Number(analysis.sponsor_score) >= 0)
  assert.match(analysis.proposal_risk, /Low|Medium|High/)
  assert.match(analysis.package_suitability, /High|Medium|Low/)
  assert.match(analysis.expected_engagement, /High|Medium|Low/)
  assert.match(analysis.recommendation, /Suitable for Approval|Review Carefully|Requires Negotiation|High Risk — Manual Review/)

  const stored = getProposalAnalysis('SP-2026-0001')
  assert.ok(stored)
  assert.equal(stored.proposal_id, 'SP-2026-0001')
})
