const test = require('node:test')
const assert = require('node:assert/strict')
const adminRoutes = require('../routes/admin')

test('getExecutiveOverviewData aggregates system-wide executive KPIs', () => {
    const data = adminRoutes.getExecutiveOverviewData()

    assert.ok(data.eventOverview, 'eventOverview object exists')
    assert.ok(data.eventOverview.totalRegistrations >= 0)
    assert.ok(data.eventOverview.checkIns >= 0)
    assert.ok(data.eventOverview.attendanceRate >= 0)

    assert.ok(data.eventHealth, 'eventHealth object exists')
    assert.ok(['GOOD', 'WARNING', 'CRITICAL'].includes(data.eventHealth.status))
    assert.ok(data.eventHealth.score >= 0 && data.eventHealth.score <= 100)

    assert.ok(data.speakerPerformance, 'speakerPerformance object exists')
    assert.ok(data.speakerPerformance.speakerParticipation >= 0)

    assert.ok(data.sponsorPerformance, 'sponsorPerformance object exists')
    assert.ok(data.sponsorPerformance.sponsorshipRevenue >= 0)

    assert.ok(data.venuePerformance, 'venuePerformance object exists')
    assert.ok(Array.isArray(data.venuePerformance.venues))

    assert.ok(data.incidents, 'incidents object exists')
    assert.ok(data.incidents.openIncidents >= 0)

    assert.ok(data.aiInsights, 'aiInsights object exists')
    assert.ok(Array.isArray(data.aiInsights.predictedRisks))
    assert.ok(Array.isArray(data.aiInsights.recommendedActions))
    assert.ok(Array.isArray(data.aiInsights.performanceTrends))

    assert.ok(data.visualizations, 'visualizations object exists')
    assert.ok(Array.isArray(data.visualizations.registrationTrend))
})

test('getExecutiveOverviewData filters correctly when specific eventId provided', () => {
    const data = adminRoutes.getExecutiveOverviewData('1')

    assert.equal(data.selectedEventId, 1)
    assert.ok(data.selectedEventName)
    assert.ok(data.eventOverview)
    assert.ok(data.eventHealth)
})
