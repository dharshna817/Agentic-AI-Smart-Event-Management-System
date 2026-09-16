const { readEntity, writeEntity, nextId } = require('../lib/jsonStore');

const WORKFLOW_FILE = 'workflows';

const WORKFLOW_STATES = {
    PENDING: 'PENDING',
    RUNNING: 'RUNNING',
    WAITING_FOR_AGENT: 'WAITING_FOR_AGENT',
    WAITING_FOR_APPROVAL: 'WAITING_FOR_APPROVAL',
    ESCALATED: 'ESCALATED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
};

function getWorkflows() {
    const data = readEntity(WORKFLOW_FILE, []);
    return Array.isArray(data) ? data : [];
}

function saveWorkflows(workflows) {
    writeEntity(WORKFLOW_FILE, workflows);
}

function findWorkflowById(workflowId) {
    const workflows = getWorkflows();
    return (
        workflows.find(
            (wf) => String(wf.workflowId) === String(workflowId) || String(wf.id) === String(workflowId)
        ) || null
    );
}

function checkIdempotency(idempotencyKey) {
    if (!idempotencyKey) return null;
    const workflows = getWorkflows();
    return (
        workflows.find(
            (wf) => String(wf.idempotencyKey || '') === String(idempotencyKey)
        ) || null
    );
}

function createWorkflow({
    triggerType,
    source = 'system',
    eventId = 1,
    metadata = {},
    idempotencyKey = null,
}) {
    const existing = checkIdempotency(idempotencyKey);
    if (existing) {
        return { workflow: existing, isDuplicate: true };
    }

    const workflows = getWorkflows();
    const numId = nextId(workflows, 'id');
    const workflowId = `WF-2026-${String(numId).padStart(3, '0')}`;

    const newWorkflow = {
        id: numId,
        workflowId,
        eventId: Number(eventId),
        triggerType,
        triggerSource: source,
        status: WORKFLOW_STATES.PENDING,
        currentTask: null,
        context: {
            eventId: Number(eventId),
            ...metadata,
        },
        idempotencyKey: idempotencyKey || `${triggerType}_${eventId}_${Date.now()}`,
        tasks: [],
        approvals: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        failureReason: null,
    };

    workflows.unshift(newWorkflow);
    saveWorkflows(workflows);
    return { workflow: newWorkflow, isDuplicate: false };
}

function updateWorkflowState(workflowId, status, payload = {}) {
    const workflows = getWorkflows();
    const index = workflows.findIndex(
        (wf) => String(wf.workflowId) === String(workflowId) || String(wf.id) === String(workflowId)
    );

    if (index === -1) return null;

    const current = workflows[index];
    current.status = status;
    current.updatedAt = new Date().toISOString();

    if (payload.currentTask) current.currentTask = payload.currentTask;
    if (payload.context) current.context = { ...current.context, ...payload.context };
    if (payload.failureReason) current.failureReason = payload.failureReason;

    if (status === WORKFLOW_STATES.COMPLETED || status === WORKFLOW_STATES.FAILED || status === WORKFLOW_STATES.CANCELLED) {
        current.completedAt = new Date().toISOString();
    }

    workflows[index] = current;
    saveWorkflows(workflows);
    return current;
}

module.exports = {
    WORKFLOW_STATES,
    getWorkflows,
    findWorkflowById,
    checkIdempotency,
    createWorkflow,
    updateWorkflowState,
};
