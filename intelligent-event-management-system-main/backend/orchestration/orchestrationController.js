const { getRegisteredAgents, updateAgentStatus } = require('./agentRegistry');
const { getWorkflows, findWorkflowById, updateWorkflowState, WORKFLOW_STATES } = require('./workflowManager');
const { getTasksForWorkflow } = require('./taskManager');
const { getApprovalsForWorkflow, getPendingApprovals } = require('./approvalManager');
const { getAuditLogs } = require('./auditLogger');
const {
    triggerWorkflow,
    approveWorkflowStep,
    rejectWorkflowStep,
    getOrchestrationMetrics,
} = require('./orchestrationService');

async function handleTriggerWorkflow(req, res) {
    try {
        const { triggerType, eventId = 1, source = 'system', metadata = {}, idempotencyKey = null } = req.body || {};
        if (!triggerType) {
            return res.status(400).json({ message: 'triggerType is required' });
        }

        const result = await triggerWorkflow({
            triggerType,
            source,
            eventId,
            metadata,
            idempotencyKey,
        });

        return res.status(result.isDuplicate ? 200 : 201).json({
            success: true,
            isDuplicate: result.isDuplicate,
            workflow: result.workflow,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

async function handleGetWorkflows(req, res) {
    try {
        const { status, triggerType } = req.query || {};
        let workflows = getWorkflows();
        if (status) {
            workflows = workflows.filter((w) => String(w.status).toUpperCase() === String(status).toUpperCase());
        }
        if (triggerType) {
            workflows = workflows.filter((w) => String(w.triggerType) === String(triggerType));
        }
        return res.json(workflows);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

async function handleGetWorkflowById(req, res) {
    try {
        const { workflowId } = req.params;
        const workflow = findWorkflowById(workflowId);
        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }
        const tasks = getTasksForWorkflow(workflowId);
        const approvals = getApprovalsForWorkflow(workflowId);
        const audit = getAuditLogs(workflowId);

        return res.json({
            ...workflow,
            tasks,
            approvals,
            audit,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

async function handleGetWorkflowTasks(req, res) {
    try {
        const { workflowId } = req.params;
        const tasks = getTasksForWorkflow(workflowId);
        return res.json(tasks);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

async function handleApproveWorkflow(req, res) {
    try {
        const { workflowId } = req.params;
        const { approvalId, approvedBy = 'Admin', note = '' } = req.body || {};

        const pendingList = getApprovalsForWorkflow(workflowId).filter((a) => a.status === 'PENDING');
        const targetApprovalId = approvalId || pendingList[0]?.approvalId;

        if (!targetApprovalId) {
            return res.status(400).json({ message: 'No pending approval found for this workflow.' });
        }

        const result = await approveWorkflowStep(workflowId, targetApprovalId, approvedBy, note);
        return res.json(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

async function handleRejectWorkflow(req, res) {
    try {
        const { workflowId } = req.params;
        const { approvalId, rejectedBy = 'Admin', reason = 'Admin rejected action' } = req.body || {};

        const pendingList = getApprovalsForWorkflow(workflowId).filter((a) => a.status === 'PENDING');
        const targetApprovalId = approvalId || pendingList[0]?.approvalId;

        if (!targetApprovalId) {
            return res.status(400).json({ message: 'No pending approval found for this workflow.' });
        }

        const result = await rejectWorkflowStep(workflowId, targetApprovalId, rejectedBy, reason);
        return res.json(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

async function handleCancelWorkflow(req, res) {
    try {
        const { workflowId } = req.params;
        const { reason = 'Cancelled by Admin' } = req.body || {};
        const updated = updateWorkflowState(workflowId, WORKFLOW_STATES.CANCELLED, { failureReason: reason });
        if (!updated) return res.status(404).json({ message: 'Workflow not found' });
        return res.json({ success: true, workflow: updated });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

async function handleGetAgents(req, res) {
    try {
        const agents = getRegisteredAgents();
        return res.json(agents);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

async function handleGetAuditLog(req, res) {
    try {
        const { workflowId } = req.params;
        const logs = getAuditLogs(workflowId);
        return res.json(logs);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

async function handleGetMetrics(req, res) {
    try {
        const metrics = getOrchestrationMetrics();
        const pendingApprovals = getPendingApprovals();
        return res.json({
            ...metrics,
            pendingApprovalsCount: pendingApprovals.length,
            pendingApprovals,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports = {
    handleTriggerWorkflow,
    handleGetWorkflows,
    handleGetWorkflowById,
    handleGetWorkflowTasks,
    handleApproveWorkflow,
    handleRejectWorkflow,
    handleCancelWorkflow,
    handleGetAgents,
    handleGetAuditLog,
    handleGetMetrics,
};
