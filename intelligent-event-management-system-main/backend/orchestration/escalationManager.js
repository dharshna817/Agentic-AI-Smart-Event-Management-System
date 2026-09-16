const { readEntity, writeEntity, nextId } = require('../lib/jsonStore');
const { buildOperationalAlert } = require('../lib/incidentHelpers');

const ESCALATIONS_FILE = 'workflow_escalations';

function getEscalations() {
    const data = readEntity(ESCALATIONS_FILE, []);
    return Array.isArray(data) ? data : [];
}

function saveEscalations(escalations) {
    writeEntity(ESCALATIONS_FILE, escalations);
}

function createEscalation({
    workflowId,
    failedAgentId = null,
    reason,
    severity = 'HIGH',
    responsibleRole = 'Event Manager',
    metadata = {},
}) {
    const escalations = getEscalations();
    const numId = nextId(escalations, 'id');
    const escalationId = `ESC-${String(numId).padStart(3, '0')}`;

    const record = {
        id: numId,
        escalationId,
        workflowId,
        failedAgentId,
        reason: reason || 'Workflow failed after max retries or critical timeout',
        severity,
        responsibleRole,
        status: 'ACTIVE',
        metadata,
        createdAt: new Date().toISOString(),
    };

    escalations.unshift(record);
    saveEscalations(escalations);

    // Generate operational alert in admin alert feed
    const alerts = readEntity('alerts', []);
    const alertRecord = buildOperationalAlert({
        type: 'WORKFLOW_ESCALATION',
        title: `🚨 Escalation: Workflow ${workflowId}`,
        description: `Workflow ${workflowId} escalated: ${reason}. Responsible role: ${responsibleRole}.`,
        priority: severity,
        sourceType: 'agent-orchestrator',
        sourceId: workflowId,
        sourceLabel: 'Orchestration Escalation',
        reason,
        recommendedAction: 'Inspect workflow detail view and perform manual intervention.',
        status: 'ACTIVE',
    });
    alerts.unshift(alertRecord);
    writeEntity('alerts', alerts);

    return record;
}

module.exports = {
    getEscalations,
    createEscalation,
};
