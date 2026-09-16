const { readEntity, writeEntity, nextId } = require('../lib/jsonStore');

const APPROVALS_FILE = 'workflow_approvals';

const APPROVAL_STATUSES = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};

function getApprovals() {
    const data = readEntity(APPROVALS_FILE, []);
    return Array.isArray(data) ? data : [];
}

function saveApprovals(approvals) {
    writeEntity(APPROVALS_FILE, approvals);
}

function getPendingApprovals() {
    const approvals = getApprovals();
    return approvals.filter((app) => app.status === APPROVAL_STATUSES.PENDING);
}

function getApprovalsForWorkflow(workflowId) {
    const approvals = getApprovals();
    return approvals.filter((app) => String(app.workflowId) === String(workflowId));
}

function requestApproval({
    workflowId,
    taskId,
    agentId,
    action,
    description,
    recommendedOption = {},
    requestedBy = 'Agent Orchestrator',
}) {
    const approvals = getApprovals();
    const numId = nextId(approvals, 'id');
    const approvalId = `APP-${String(numId).padStart(3, '0')}`;

    const newApproval = {
        id: numId,
        approvalId,
        workflowId,
        taskId,
        agentId,
        action,
        description: description || `Approval requested for ${action}`,
        recommendedOption,
        requestedBy,
        status: APPROVAL_STATUSES.PENDING,
        requestedAt: new Date().toISOString(),
        decidedBy: null,
        decidedAt: null,
        note: null,
    };

    approvals.unshift(newApproval);
    saveApprovals(approvals);
    return newApproval;
}

function approveRequest(approvalId, approvedBy = 'Admin', note = 'Approved by Event Manager') {
    const approvals = getApprovals();
    const index = approvals.findIndex(
        (app) => String(app.approvalId) === String(approvalId) || String(app.id) === String(approvalId)
    );

    if (index === -1) return null;

    const current = approvals[index];
    current.status = APPROVAL_STATUSES.APPROVED;
    current.decidedBy = approvedBy;
    current.decidedAt = new Date().toISOString();
    current.note = note;

    approvals[index] = current;
    saveApprovals(approvals);
    return current;
}

function rejectRequest(approvalId, rejectedBy = 'Admin', reason = 'Rejected by Event Manager') {
    const approvals = getApprovals();
    const index = approvals.findIndex(
        (app) => String(app.approvalId) === String(approvalId) || String(app.id) === String(approvalId)
    );

    if (index === -1) return null;

    const current = approvals[index];
    current.status = APPROVAL_STATUSES.REJECTED;
    current.decidedBy = rejectedBy;
    current.decidedAt = new Date().toISOString();
    current.note = reason;

    approvals[index] = current;
    saveApprovals(approvals);
    return current;
}

module.exports = {
    APPROVAL_STATUSES,
    getApprovals,
    getPendingApprovals,
    getApprovalsForWorkflow,
    requestApproval,
    approveRequest,
    rejectRequest,
};
