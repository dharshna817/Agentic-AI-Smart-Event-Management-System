const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildSponsorPerformanceSummary,
  generateSponsorRecommendations,
  buildSponsorPerformanceReport,
  markSponsorPaymentPaid,
} = require('../routes/sponsor')

test('buildSponsorPerformanceSummary returns real performance metrics', () => {
  const summary = buildSponsorPerformanceSummary(1, {
    id: 1,
    company_name: 'Alpha Labs',
    role: 'sponsor',
  }, [
    { sponsor_id: 1, status: 'Approved', amount: 500000 },
    { sponsor_id: 1, status: 'Approved', amount: 300000 },
    { sponsor_id: 1, status: 'Pending Review', amount: 200000 },
    { sponsor_id: 1, status: 'Rejected', amount: 100000 },
  ], [
    { sponsor_id: 1, paid_amount: 400000, due_amount: 100000, amount: 500000 },
    { sponsor_id: 1, paid_amount: 200000, due_amount: 100000, amount: 300000 },
  ], [
    { sponsor_id: 1, status: 'Completed', progress: 100 },
    { sponsor_id: 1, status: 'Pending', progress: 40 },
    { sponsor_id: 1, status: 'Completed', progress: 100 },
  ])

  assert.equal(summary.companyName, 'Alpha Labs')
  assert.equal(summary.totalSponsorships, 2)
  assert.equal(summary.approvedValue, 800000)
  assert.ok(summary.conversionRate > 0)
  assert.ok(summary.engagementScore >= 0)
  assert.ok(['Healthy', 'Strong'].includes(summary.performanceStatus))
  assert.ok(Array.isArray(summary.engagementBreakdown))
})

test('generateSponsorRecommendations creates sponsor-scoped AI guidance using available data', () => {
  const result = generateSponsorRecommendations(1, {
    company_name: 'Alpha Labs',
    id: 1,
    role: 'sponsor',
  }, [
    { sponsor_id: 1, status: 'Approved', amount: 500000, package_id: 1, event_id: 1 },
    { sponsor_id: 1, status: 'Approved', amount: 300000, package_id: 2, event_id: 2 },
  ], [
    { sponsor_id: 1, amount: 800000, paid_amount: 400000, due_amount: 400000, status: 'Pending' },
  ], [
    { sponsor_id: 1, status: 'Completed', proposal_id: 'SP-2026-0001' },
    { sponsor_id: 1, status: 'Completed', proposal_id: 'SP-2026-0002' },
    { sponsor_id: 1, status: 'Pending', proposal_id: 'SP-2026-0003' },
  ])

  assert.ok(Array.isArray(result.recommendations))
  assert.ok(result.recommendations.length > 0)
  assert.ok(result.recommendations.some((item) => item.category === 'Payments' || item.category === 'Package Selection' || item.category === 'Deliverables'))
  assert.match(result.summary || '', /Alpha Labs|recommendation/i)
})

test('buildSponsorPerformanceReport assembles a sponsor report with metric sections', () => {
  const report = buildSponsorPerformanceReport(1, {
    company_name: 'Alpha Labs',
  }, {
    proposal_id: 'SP-2026-0001',
    event_name: 'Tech Innovation Summit',
    package_name: 'Platinum',
    amount: 500000,
    status: 'Approved',
  }, {
    total: 500000,
    paid: 350000,
    due: 150000,
    pending_count: 1,
  }, {
    total: 4,
    completed: 3,
    pending: 1,
    delayed: 0,
    completion_rate: 75,
  }, {
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
  }, [
    { category: 'Lead Generation', priority: 'Medium', recommendation: 'Improve lead qualification', reason: 'Conversion is lower than expected.' },
  ])

  assert.equal(report.company_name, 'Alpha Labs')
  assert.equal(report.event_name, 'Tech Innovation Summit')
  assert.equal(report.package_name, 'Platinum')
  assert.equal(report.performance.overall_performance, 92)
  assert.ok(Array.isArray(report.recommendations))
  assert.ok(report.summary.includes('Sponsor Performance Report'))
})

test('markSponsorPaymentPaid settles a sponsor payment due amount', () => {
  const result = markSponsorPaymentPaid(1, 1, 150000)

  assert.equal(result.updated, true)
  assert.ok(result.payment)
  assert.equal(result.payment.due_amount, 0)
  assert.equal(result.payment.status, 'Paid')
})
