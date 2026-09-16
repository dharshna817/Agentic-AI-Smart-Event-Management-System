const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const fs = require('fs')

const adminRoutes = require('../routes/admin')
const { getEventIntelligence, buildEventIntelligence } = require('../intelligence/intelligenceService')
const { getAIOperationsIntelligence } = require('../intelligence/intelligenceController')
const { triggerWorkflow, approveWorkflowStep, getOrchestrationMetrics } = require('../orchestration/orchestrationService')

// Test Data File paths
const incidentsFile = path.join(__dirname, '..', 'incidents.json')
const sponsorsFile = path.join(__dirname, '..', 'sponsors.json')
const proposalsFile = path.join(__dirname, '..', 'sponsorship_proposals.json')
const paymentsFile = path.join(__dirname, '..', 'sponsorship_payments.json')
const deliverablesFile = path.join(__dirname, '..', 'sponsorship_deliverables.json')
const attendanceFile = path.join(__dirname, '..', 'attendance.json')
const registrationsFile = path.join(__dirname, '..', 'registrations.json')

function seedComprehensiveData() {
    const sampleRegistrations = [
        { id: 1, event_id: 1, name: 'Alice Smith', email: 'alice@example.com', status: 'confirmed', registered_at: '2026-08-01T10:00:00Z' },
        { id: 2, event_id: 1, name: 'Bob Jones', email: 'bob@example.com', status: 'confirmed', registered_at: '2026-08-02T11:00:00Z' },
        { id: 3, event_id: 1, name: 'Charlie Brown', email: 'charlie@example.com', status: 'confirmed', registered_at: '2026-08-03T12:00:00Z' },
        { id: 4, event_id: 1, name: 'Diana Prince', email: 'diana@example.com', status: 'cancelled', registered_at: '2026-08-04T13:00:00Z' }
    ]
    fs.writeFileSync(registrationsFile, JSON.stringify(sampleRegistrations, null, 2))

    const sampleAttendance = [
        { id: 1, event_id: 1, user_id: 1, status: 'checked-in', checked_in_at: '2026-08-05T08:30:00Z' },
        { id: 2, event_id: 1, user_id: 2, status: 'checked-in', checked_in_at: '2026-08-05T08:45:00Z' },
        { id: 3, event_id: 1, user_id: 3, status: 'pending', checked_in_at: null }
    ]
    fs.writeFileSync(attendanceFile, JSON.stringify(sampleAttendance, null, 2))

    const sampleIncidents = [
        {
            id: 1,
            incident_id: 1,
            event_id: 1,
            title: 'Microphone Failure in Main Hall',
            description: 'Audio cutout during opening keynote.',
            category: 'Audio/Visual',
            priority: 'CRITICAL',
            status: 'NEW',
            location: 'Grand Hall',
            created_at: '2026-08-05T09:00:00.000Z',
            staff_assigned_to: 'Staff Alpha',
            timeline: [{ action: 'CREATED', timestamp: '2026-08-05T09:00:00.000Z' }]
        },
        {
            id: 2,
            incident_id: 2,
            event_id: 1,
            title: 'Queue bottleneck at Registration Desk A',
            description: 'Scanner lag causing 10 min delay.',
            category: 'Registration',
            priority: 'HIGH',
            status: 'IN PROGRESS',
            location: 'Entrance Lobby',
            created_at: '2026-08-05T09:15:00.000Z',
            staff_assigned_to: 'Staff Beta',
            timeline: [{ action: 'CREATED', timestamp: '2026-08-05T09:15:00.000Z' }]
        }
    ]
    fs.writeFileSync(incidentsFile, JSON.stringify(sampleIncidents, null, 2))

    const sampleSponsors = [
        { id: 1, name: 'Tech Global', status: 'Active', tier: 'Platinum' },
        { id: 2, name: 'Innovate AI', status: 'Active', tier: 'Gold' }
    ]
    fs.writeFileSync(sponsorsFile, JSON.stringify(sampleSponsors, null, 2))

    const sampleProposals = [
        { proposal_id: 'SP-101', company_name: 'Tech Global', status: 'Approved', package_id: 1, amount: 500000 },
        { proposal_id: 'SP-102', company_name: 'Innovate AI', status: 'Approved', package_id: 2, amount: 250000 }
    ]
    fs.writeFileSync(proposalsFile, JSON.stringify(sampleProposals, null, 2))

    const samplePayments = [
        { proposal_id: 'SP-101', amount: 500000, due_amount: 0, status: 'Paid', sponsor_id: 1 },
        { proposal_id: 'SP-102', amount: 250000, due_amount: 0, status: 'Paid', sponsor_id: 2 }
    ]
    fs.writeFileSync(paymentsFile, JSON.stringify(samplePayments, null, 2))

    const sampleDeliverables = [
        { proposal_id: 'SP-101', title: 'Main Stage Branding', status: 'Completed', sponsor_id: 1 },
        { proposal_id: 'SP-101', title: 'Keynote Slot', status: 'Completed', sponsor_id: 1 },
        { proposal_id: 'SP-102', title: 'Booth Space', status: 'Completed', sponsor_id: 2 }
    ]
    fs.writeFileSync(deliverablesFile, JSON.stringify(sampleDeliverables, null, 2))
}

// -------------------------------------------------------------
// 1. FUNCTIONAL & MODULE TESTING
// -------------------------------------------------------------
test('E2E - Functional: Incident Analytics & Lifecycle state transitions', () => {
    seedComprehensiveData()
    const result = adminRoutes.getIncidentAnalytics({ range: '30' })
    assert.equal(result.totalIncidents, 2)
    assert.equal(result.openIncidents, 2)
    assert.equal(result.criticalIncidents, 1)
    assert.equal(result.highPriorityIncidents, 1)
})

test('E2E - Functional: Sponsorship Analytics & Financial metrics', () => {
    seedComprehensiveData()
    const result = adminRoutes.getSponsorshipAnalytics({ range: '30' })
    assert.equal(result.totalSponsors, 2)
    assert.equal(result.activeSponsors, 2)
    assert.equal(result.totalSponsorshipValue, 750000)
    assert.equal(result.deliverableStatus.Completed, 3)
})

// -------------------------------------------------------------
// 2. EXECUTIVE DASHBOARD TESTING
// -------------------------------------------------------------
test('E2E - Executive Dashboard: System Overview & Event Filtering', () => {
    seedComprehensiveData()
    const overviewAll = adminRoutes.getExecutiveOverviewData()
    assert.ok(overviewAll.eventOverview.totalRegistrations >= 4)
    assert.ok(overviewAll.eventOverview.confirmedAttendees >= 3)
    assert.ok(overviewAll.eventOverview.checkIns >= 2)
    assert.ok(overviewAll.eventOverview.attendanceRate > 0)

    assert.ok(overviewAll.eventHealth.status)
    assert.ok(overviewAll.eventHealth.score >= 0)

    assert.ok(overviewAll.sponsorPerformance.sponsorshipRevenue >= 750000)
    assert.ok(overviewAll.sponsorPerformance.sponsorCount >= 2)

    assert.equal(overviewAll.incidents.openIncidents, 2)
    assert.equal(overviewAll.incidents.criticalIncidents, 1)

    const overviewEvent1 = adminRoutes.getExecutiveOverviewData('1')
    assert.equal(overviewEvent1.selectedEventId, 1)
    assert.ok(overviewEvent1.selectedEventName)
})

// -------------------------------------------------------------
// 3. AI AGENT & EVENT INTELLIGENCE TESTING
// -------------------------------------------------------------
test('E2E - AI & Intelligence Engine: Health calculation & risk identification', () => {
    seedComprehensiveData()
    const intelligence = getAIOperationsIntelligence()
    assert.ok(intelligence.eventHealthScore >= 0 && intelligence.eventHealthScore <= 100)
    assert.ok(['GOOD', 'WARNING', 'CRITICAL'].includes(intelligence.healthStatus))
    assert.ok(Array.isArray(intelligence.risks))
    assert.ok(Array.isArray(intelligence.recommendations))
    assert.ok(Array.isArray(intelligence.trends))
})

// -------------------------------------------------------------
// 4. AGENT ORCHESTRATION — PRIMARY E2E SCENARIO (SPEAKER CANCELLATION)
// -------------------------------------------------------------
test('E2E - Primary Scenario: Speaker Cancellation Agent Orchestration Workflow', async () => {
    seedComprehensiveData()

    // Trigger Speaker Cancellation workflow with unique key
    const uniqueKey = `SPEAKER_CANCELLATION_E2E_${Date.now()}`
    const triggerResult = await triggerWorkflow({
        triggerType: 'SPEAKER_CANCELLATION',
        source: 'speaker_portal',
        eventId: 1,
        idempotencyKey: uniqueKey,
        metadata: {
            speakerId: 5,
            sessionId: 12,
            reason: 'Urgent medical emergency',
            speakerName: 'Dr. Jane Doe'
        }
    })

    assert.ok(triggerResult.workflow, 'Workflow created successfully')
    assert.equal(triggerResult.isDuplicate, false)
    const wfId = triggerResult.workflow.workflowId

    // Check state: workflow executes through Speaker Agent -> Intelligence Engine -> Venue Agent and pauses for approval
    assert.ok(['WAITING_FOR_APPROVAL', 'COMPLETED', 'RUNNING'].includes(triggerResult.workflow.status))

    // Approve the operational rescheduling proposal if waiting for approval
    if (triggerResult.workflow.status === 'WAITING_FOR_APPROVAL') {
        const approvalResult = await approveWorkflowStep(
            wfId,
            triggerResult.workflow.approvals?.[0]?.approvalId || 1,
            'Event Manager',
            'Approved re-allocation to Hall B'
        )
        assert.equal(approvalResult.success, true)
        assert.ok(['COMPLETED', 'RUNNING'].includes(approvalResult.workflow.status))
    }

    // Verify orchestration metrics update
    const metrics = getOrchestrationMetrics()
    assert.ok(metrics.totalWorkflows >= 1)
    assert.ok(metrics.successRate >= 0)
})

// -------------------------------------------------------------
// 5. SECURITY & INPUT VALIDATION TESTING
// -------------------------------------------------------------
test('E2E - Security & Input Resilience: Malformed data & injection attempt handling', () => {
    const resultMalformed = adminRoutes.getExecutiveOverviewData("'; DROP TABLE events; --")
    assert.ok(resultMalformed.eventOverview)

    const resultNull = adminRoutes.getExecutiveOverviewData(null)
    assert.ok(resultNull.eventOverview)
})

// -------------------------------------------------------------
// 6. PERFORMANCE & RESPONSE TIME TESTING
// -------------------------------------------------------------
test('E2E - Performance Benchmark: Executive Overview aggregation under 200ms', () => {
    const startTime = Date.now()
    adminRoutes.getExecutiveOverviewData()
    const duration = Date.now() - startTime
    assert.ok(duration < 200, `Execution time ${duration}ms is under 200ms threshold`)
})
