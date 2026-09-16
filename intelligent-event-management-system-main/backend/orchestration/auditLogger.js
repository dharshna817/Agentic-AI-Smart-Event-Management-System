const { readEntity, writeEntity, nextId } = require('../lib/jsonStore');

const AUDIT_FILE = 'orchestration_audit';

function getAuditLogs(workflowId = null) {
    const logs = readEntity(AUDIT_FILE, []);
    const list = Array.isArray(logs) ? logs : [];
    if (workflowId) {
        return list.filter((log) => String(log.workflowId) === String(workflowId));
    }
    return list;
}

function logAudit({ workflowId, agentId = null, taskId = null, action, status = 'INFO', metadata = {} }) {
    const logs = readEntity(AUDIT_FILE, []);
    const numId = nextId(logs, 'id');
    const auditId = `AUD-${String(numId).padStart(4, '0')}`;

    const entry = {
        id: numId,
        auditId,
        workflowId,
        agentId,
        taskId,
        action,
        status,
        timestamp: new Date().toISOString(),
        metadata,
    };

    logs.unshift(entry);
    writeEntity(AUDIT_FILE, logs);
    return entry;
}

module.exports = {
    getAuditLogs,
    logAudit,
};
