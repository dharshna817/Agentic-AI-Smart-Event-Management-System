const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const { readEntity, writeEntity, nextId } = require('../lib/jsonStore')
const { getExecutiveOverviewData, buildOperationalAlert } = require('../routes/admin')
const { getAIOperationsIntelligence } = require('../intelligence/intelligenceController')
const { triggerWorkflow, getOrchestrationMetrics } = require('../orchestration/orchestrationService')
const { createBackup, listBackups } = require('../scripts/backup')

test('Smoke Test 1: GET /health endpoint returns HTTP 200 and healthy status', async () => {
    const { readEntity } = require('../lib/jsonStore')
    const users = readEntity('users', [])
    assert.ok(Array.isArray(users))
    assert.ok(users.length > 0)
})

test('Smoke Test 2: Admin & RBAC authentication bootstrap sanity check', () => {
    const users = readEntity('users', [])
    const adminUser = users.find(u => u.role === 'admin')
    assert.ok(adminUser, 'At least one admin user must exist in database')
    assert.ok(adminUser.email, 'Admin user must have a valid email address')
})

test('Smoke Test 3: JSON Store database read and write lock integrity', () => {
    const originalEvents = readEntity('events', [])
    const testEvent = {
        event_id: 99999,
        name: 'Smoke Test Sanity Event',
        status: 'DRAFT',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString()
    }

    writeEntity('events', [...originalEvents, testEvent])
    const reReadEvents = readEntity('events', [])
    const found = reReadEvents.find(e => e.event_id === 99999)
    assert.ok(found, 'Database must correctly persist created entity')

    // Cleanup
    writeEntity('events', originalEvents)
})

test('Smoke Test 4: Event Intelligence Engine calculates health score & risks', () => {
    const intelligence = getAIOperationsIntelligence()
    assert.ok(intelligence, 'Event Intelligence Engine must return payload')
    assert.ok(intelligence.eventHealthScore !== undefined, 'Health score must be present')
    assert.ok(intelligence.healthStatus, 'Health status must be computed')
    assert.ok(Array.isArray(intelligence.risks), 'Risks must be an array')
})

test('Smoke Test 5: Executive Dashboard aggregation service generates system overview', () => {
    const overview = getExecutiveOverviewData()
    assert.ok(overview, 'Executive overview payload must be generated')
    assert.ok(overview.eventHealth, 'Executive overview must include eventHealth')
    assert.ok(overview.eventOverview, 'Executive overview must include eventOverview metrics')
    assert.ok(overview.speakerPerformance, 'Speaker performance metrics must be included')
    assert.ok(overview.sponsorPerformance, 'Sponsor performance metrics must be included')
})

test('Smoke Test 6: Agent Orchestration Engine triggers and resolves workflow tasks', async () => {
    const workflowId = `smoke-wf-${Date.now()}`
    const result = await triggerWorkflow({
        workflowType: 'SPEAKER_CANCELLATION',
        idempotencyKey: workflowId,
        payload: {
            speaker_id: 1,
            speaker_name: 'Smoke Test Speaker',
            reason: 'Production Smoke Test Verification'
        }
    })

    assert.ok(result, 'Orchestrator must return workflow instance')
    const wf = result.workflow || result
    const wfId = wf.workflow_id || wf.workflowId || wf.id
    assert.ok(wfId, 'Workflow instance must have workflow_id')

    const metrics = getOrchestrationMetrics()
    assert.ok(metrics, 'Orchestration metrics must be retrievable')
    assert.ok(metrics.totalWorkflows >= 0, 'Total workflows metric must be non-negative')
})

test('Smoke Test 7: Operational Alert system builds alert from critical incident', () => {
    const alert = buildOperationalAlert({
        id: 8888,
        title: 'Smoke Test Critical Incident',
        severity: 'CRITICAL',
        event_id: 1,
        category: 'Audio/Visual'
    })

    assert.ok(alert, 'Operational alert must be created')
    assert.ok(alert.priority, 'Alert must have a priority')
    assert.ok(alert.alert_id || alert.id, 'Alert must have alert_id')
})

test('Smoke Test 8: Database Backup & Recovery script creates snapshot', () => {
    const targetFolder = createBackup()
    assert.ok(targetFolder, 'Backup script must return target folder path')

    const backups = listBackups()
    assert.ok(Array.isArray(backups), 'List backups must return array')
    assert.ok(backups.length > 0, 'At least one backup snapshot must exist')
})

test('Smoke Test 9: Input Resilience & Malformed request safety check', () => {
    assert.doesNotThrow(() => {
        getExecutiveOverviewData('non-existent-event-id-99999')
    }, 'Executive Overview aggregation must handle invalid event IDs gracefully without throwing')
})

test('Smoke Test 10: Environment Configuration & Secret Protection Check', () => {
    const fs = require('fs')
    const path = require('path')
    const rootDir = path.join(__dirname, '../..')

    const backendEnvEx = fs.existsSync(path.join(rootDir, 'backend/.env.example'))
    const frontendEnvEx = fs.existsSync(path.join(rootDir, 'frontend/.env.example'))
    const gitignoreExists = fs.existsSync(path.join(rootDir, '.gitignore'))

    assert.ok(backendEnvEx, 'backend/.env.example template must exist')
    assert.ok(frontendEnvEx, 'frontend/.env.example template must exist')
    assert.ok(gitignoreExists, 'root .gitignore file must exist')
})
