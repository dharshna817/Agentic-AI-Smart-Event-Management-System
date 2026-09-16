const { getAgentById } = require('./agentRegistry');
const { executeAgentTask } = require('./agentAdapters');
const {
    WORKFLOW_STATES,
    getWorkflows,
    findWorkflowById,
    checkIdempotency,
    createWorkflow,
    updateWorkflowState,
} = require('./workflowManager');
const {
    TASK_STATES,
    getTasksForWorkflow,
    createTask,
    updateTaskState,
} = require('./taskManager');
const { getExecutionPlan, getNextExecutableTasks } = require('./dependencyResolver');
const ContextManager = require('./contextManager');
const RetryManager = require('./retryManager');
const TimeoutManager = require('./timeoutManager');
const {
    getApprovalsForWorkflow,
    requestApproval,
    approveRequest,
    rejectRequest,
} = require('./approvalManager');
const { createEscalation } = require('./escalationManager');
const { logAudit } = require('./auditLogger');

async function triggerWorkflow({
    triggerType,
    source = 'system',
    eventId = 1,
    metadata = {},
    idempotencyKey = null,
}) {
    const resolvedKey = idempotencyKey || `${triggerType}_${eventId}_${metadata.sessionId || ''}_${metadata.speakerId || ''}`;

    const existing = checkIdempotency(resolvedKey);
    if (existing) {
        logAudit({
            workflowId: existing.workflowId,
            action: 'DUPLICATE_TRIGGER_IGNORED',
            status: 'WARNING',
            metadata: { triggerType, idempotencyKey: resolvedKey },
        });
        return { workflow: existing, isDuplicate: true };
    }

    const { workflow } = createWorkflow({
        triggerType,
        source,
        eventId,
        metadata,
        idempotencyKey: resolvedKey,
    });

    const workflowId = workflow.workflowId;
    const initialContext = ContextManager.createInitialContext({
        workflowId,
        eventId,
        trigger: { triggerType, eventType: triggerType, source, ...metadata },
    });

    updateWorkflowState(workflowId, WORKFLOW_STATES.RUNNING, { context: initialContext });

    logAudit({
        workflowId,
        action: 'WORKFLOW_CREATED',
        status: 'SUCCESS',
        metadata: { triggerType, source, eventId },
    });

    logAudit({
        workflowId,
        action: 'TRIGGER_RECEIVED',
        status: 'SUCCESS',
        metadata: { triggerType, metadata },
    });

    const plan = getExecutionPlan(triggerType);
    for (const step of plan) {
        createTask({
            workflowId,
            agentId: step.agentId,
            sequenceOrder: step.sequenceOrder,
            dependencies: step.dependencies,
            input: ContextManager.getSanitizedInputForAgent(step.agentId, initialContext),
        });
    }

    // Execute workflow asynchronously in background execution loop
    await runWorkflowExecutionLoop(workflowId);

    const updatedWf = findWorkflowById(workflowId);
    return { workflow: updatedWf, isDuplicate: false };
}

async function runWorkflowExecutionLoop(workflowId) {
    let workflow = findWorkflowById(workflowId);
    if (!workflow || [WORKFLOW_STATES.COMPLETED, WORKFLOW_STATES.FAILED, WORKFLOW_STATES.CANCELLED].includes(workflow.status)) {
        return workflow;
    }

    let continueLoop = true;

    while (continueLoop) {
        workflow = findWorkflowById(workflowId);
        if (!workflow || [WORKFLOW_STATES.COMPLETED, WORKFLOW_STATES.FAILED, WORKFLOW_STATES.CANCELLED, WORKFLOW_STATES.WAITING_FOR_APPROVAL].includes(workflow.status)) {
            break;
        }

        const tasks = getTasksForWorkflow(workflowId);

        const allCompleted = tasks.length > 0 && tasks.every((t) => t.status === TASK_STATES.COMPLETED);
        if (allCompleted) {
            updateWorkflowState(workflowId, WORKFLOW_STATES.COMPLETED);
            logAudit({
                workflowId,
                action: 'WORKFLOW_COMPLETED',
                status: 'SUCCESS',
                metadata: { taskCount: tasks.length },
            });
            break;
        }

        const executableTasks = getNextExecutableTasks(tasks);

        if (executableTasks.length === 0) {
            const pendingApprovalTask = tasks.find((t) => t.status === TASK_STATES.WAITING_FOR_APPROVAL);
            if (pendingApprovalTask) {
                updateWorkflowState(workflowId, WORKFLOW_STATES.WAITING_FOR_APPROVAL, {
                    currentTask: pendingApprovalTask.taskId,
                });
                break;
            }

            const failedTask = tasks.find((t) => t.status === TASK_STATES.FAILED || t.status === TASK_STATES.TIMED_OUT);
            if (failedTask) {
                updateWorkflowState(workflowId, WORKFLOW_STATES.FAILED, {
                    failureReason: `Task ${failedTask.taskId} (${failedTask.agentId}) failed: ${failedTask.error}`,
                });
                logAudit({
                    workflowId,
                    agentId: failedTask.agentId,
                    taskId: failedTask.taskId,
                    action: 'WORKFLOW_FAILED',
                    status: 'ERROR',
                    metadata: { error: failedTask.error },
                });
                break;
            }

            break;
        }

        // Process next batch of executable tasks
        for (const task of executableTasks) {
            const agent = getAgentById(task.agentId);
            const agentTimeout = agent?.timeout || 5000;
            const maxRetries = agent?.retryPolicy?.maxRetries || 3;
            const backoffMs = agent?.retryPolicy?.backoffMs || 1000;

            updateTaskState(task.taskId, TASK_STATES.RUNNING);
            updateWorkflowState(workflowId, WORKFLOW_STATES.RUNNING, { currentTask: task.taskId });

            const sanitizedInput = ContextManager.getSanitizedInputForAgent(task.agentId, workflow.context);

            logAudit({
                workflowId,
                agentId: task.agentId,
                taskId: task.taskId,
                action: 'AGENT_SELECTED',
                status: 'INFO',
                metadata: { sequenceOrder: task.sequenceOrder },
            });

            logAudit({
                workflowId,
                agentId: task.agentId,
                taskId: task.taskId,
                action: 'TASK_STARTED',
                status: 'INFO',
                metadata: { input: sanitizedInput },
            });

            const taskExecutionFn = async () => {
                return await TimeoutManager.executeWithTimeout(
                    () => executeAgentTask(task.agentId, { taskId: task.taskId, trigger: workflow.context.trigger, context: workflow.context }),
                    agentTimeout
                );
            };

            const result = await RetryManager.executeWithRetry(taskExecutionFn, maxRetries, backoffMs);

            if (result.success) {
                updateTaskState(task.taskId, TASK_STATES.COMPLETED, {
                    output: result.result,
                    confidence: result.confidence,
                });

                const updatedContext = ContextManager.updateContextWithAgentResult(
                    workflow.context,
                    task.agentId,
                    result.result
                );

                workflow.context = updatedContext;
                updateWorkflowState(workflowId, WORKFLOW_STATES.RUNNING, { context: updatedContext });

                logAudit({
                    workflowId,
                    agentId: task.agentId,
                    taskId: task.taskId,
                    action: 'OUTPUT_RECEIVED',
                    status: 'SUCCESS',
                    metadata: { confidence: result.confidence, result: result.result },
                });

                const requiresApproval =
                    result.requiresHumanApproval ||
                    Boolean(agent?.humanApprovalRequirement) ||
                    (task.agentId === 'venue-agent');

                if (requiresApproval) {
                    updateTaskState(task.taskId, TASK_STATES.WAITING_FOR_APPROVAL);
                    const approvalReq = requestApproval({
                        workflowId,
                        taskId: task.taskId,
                        agentId: task.agentId,
                        action: result.nextSuggestedAction || 'Approve Operational Reschedule & Notification',
                        description: `Agent ${task.agentId} proposed: ${JSON.stringify(result.result)}. Requires admin review before execution.`,
                        recommendedOption: result.result,
                    });

                    updateWorkflowState(workflowId, WORKFLOW_STATES.WAITING_FOR_APPROVAL, {
                        currentTask: task.taskId,
                    });

                    logAudit({
                        workflowId,
                        agentId: task.agentId,
                        taskId: task.taskId,
                        action: 'APPROVAL_REQUESTED',
                        status: 'WARNING',
                        metadata: { approvalId: approvalReq.approvalId },
                    });

                    continueLoop = false;
                    break;
                }
            } else {
                updateTaskState(task.taskId, TASK_STATES.FAILED, {
                    error: result.error,
                    retryCount: result.retryAttempts,
                });

                const escalation = createEscalation({
                    workflowId,
                    failedAgentId: task.agentId,
                    reason: `Agent ${task.agentId} failed: ${result.error}`,
                    severity: 'HIGH',
                    responsibleRole: 'Event Manager',
                });

                updateWorkflowState(workflowId, WORKFLOW_STATES.ESCALATED, {
                    failureReason: `Task ${task.taskId} failed: ${result.error}`,
                });

                logAudit({
                    workflowId,
                    agentId: task.agentId,
                    taskId: task.taskId,
                    action: 'ESCALATION_TRIGGERED',
                    status: 'ERROR',
                    metadata: { escalationId: escalation.escalationId, error: result.error },
                });

                continueLoop = false;
                break;
            }
        }
    }

    return findWorkflowById(workflowId);
}

async function approveWorkflowStep(workflowId, approvalId, approvedBy = 'Admin', note = '') {
    const approval = approveRequest(approvalId, approvedBy, note);
    if (!approval) return { success: false, message: 'Approval request not found.' };

    logAudit({
        workflowId,
        agentId: approval.agentId,
        taskId: approval.taskId,
        action: 'APPROVAL_RECEIVED',
        status: 'SUCCESS',
        metadata: { approvalId, approvedBy, note },
    });

    updateTaskState(approval.taskId, TASK_STATES.COMPLETED);
    updateWorkflowState(workflowId, WORKFLOW_STATES.RUNNING);

    // Resume orchestration execution loop
    await runWorkflowExecutionLoop(workflowId);

    return { success: true, workflow: findWorkflowById(workflowId) };
}

async function rejectWorkflowStep(workflowId, approvalId, rejectedBy = 'Admin', reason = '') {
    const approval = rejectRequest(approvalId, rejectedBy, reason);
    if (!approval) return { success: false, message: 'Approval request not found.' };

    logAudit({
        workflowId,
        agentId: approval.agentId,
        taskId: approval.taskId,
        action: 'APPROVAL_REJECTED',
        status: 'WARNING',
        metadata: { approvalId, rejectedBy, reason },
    });

    updateTaskState(approval.taskId, TASK_STATES.FAILED, { error: `Rejected by ${rejectedBy}: ${reason}` });
    updateWorkflowState(workflowId, WORKFLOW_STATES.CANCELLED, {
        failureReason: `Workflow cancelled due to human rejection: ${reason}`,
    });

    return { success: true, workflow: findWorkflowById(workflowId) };
}

function getOrchestrationMetrics() {
    const workflows = getWorkflows();
    const tasks = getTasksForWorkflow(null); // all tasks if handled or fetch all
    const approvals = getApprovalsForWorkflow(null);

    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter((w) => [WORKFLOW_STATES.RUNNING, WORKFLOW_STATES.WAITING_FOR_AGENT, WORKFLOW_STATES.PENDING].includes(w.status)).length;
    const completedWorkflows = workflows.filter((w) => w.status === WORKFLOW_STATES.COMPLETED).length;
    const failedWorkflows = workflows.filter((w) => w.status === WORKFLOW_STATES.FAILED || w.status === WORKFLOW_STATES.CANCELLED).length;
    const waitingApprovalWorkflows = workflows.filter((w) => w.status === WORKFLOW_STATES.WAITING_FOR_APPROVAL).length;
    const escalatedWorkflows = workflows.filter((w) => w.status === WORKFLOW_STATES.ESCALATED).length;

    const successRate = totalWorkflows > 0 ? Math.round((completedWorkflows / totalWorkflows) * 100) : 100;

    return {
        totalWorkflows,
        activeWorkflows,
        completedWorkflows,
        failedWorkflows,
        waitingApprovalWorkflows,
        escalatedWorkflows,
        successRate,
        agentCount: 7,
    };
}

module.exports = {
    triggerWorkflow,
    runWorkflowExecutionLoop,
    approveWorkflowStep,
    rejectWorkflowStep,
    getOrchestrationMetrics,
};
