// backend/orchestration/orchestratorService.js
// Central Orchestrator Service for real event‑driven workflows

const { v4: uuidv4 } = require('uuid');
const workflowStore = require('../utils/workflowStore');
const auditLogger = require('../utils/auditLogger');
const socket = require('../socket');
const agents = require('../agents/registry');

class Orchestrator {
    /**
     * Handle an incoming business event and start a workflow.
     * @param {Object} event - The event payload (e.g., {eventType:'SPEAKER_CANCELLED', ...})
     */
    static async handleEvent(event) {
        try {
            // 1. Create workflow record
            const workflow = await workflowStore.createWorkflow({
                eventId: event.eventId || uuidv4(),
                triggerType: event.eventType,
                triggerSource: event.source || 'system',
                status: 'PENDING',
                currentAgent: null,
                tasks: [],
                approvalRequired: false,
                approvalStatus: null,
                retryCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            // 2. Log audit entry and emit socket event
            await auditLogger.log({
                workflowId: workflow.id,
                agent: 'Orchestrator',
                action: 'WorkflowCreated',
                status: 'SUCCESS',
                result: `Workflow ${workflow.id} created for event ${event.eventType}`,
            });
            socket.emit('workflowCreated', { workflowId: workflow.id });

            // 3. Determine required agents based on event type
            const agentSequence = Orchestrator._determineAgentSequence(event);
            // Store the sequence in the workflow for later execution
            await workflowStore.updateWorkflow(workflow.id, { tasks: agentSequence, status: 'RUNNING' });

            // 4. Start execution loop (fire‑and‑forget – actual execution is async)
            Orchestrator._executeWorkflow(workflow.id, event, agentSequence);
        } catch (err) {
            console.error('Orchestrator.handleEvent error:', err);
        }
    }

    /** Determine ordered list of agents for a given event */
    static _determineAgentSequence(event) {
        // Simple mapping – can be expanded later
        const map = {
            SPEAKER_CANCELLED: ['speakerAgent', 'intelligenceAgent', 'venueAgent', 'registrationAgent', 'incidentAgent'],
            VENUE_FAILURE: ['venueAgent', 'intelligenceAgent', 'registrationAgent', 'incidentAgent'],
            REGISTRATION_SURGE: ['registrationAgent', 'intelligenceAgent'],
        };
        return (map[event.eventType] || []).map((name) => ({ name, status: 'PENDING' }));
    }

    /** Execute agents sequentially respecting dependencies */
    static async _executeWorkflow(workflowId, event, agentSequence) {
        for (let i = 0; i < agentSequence.length; i++) {
            const task = agentSequence[i];
            const agent = agents.getAgent(task.name);
            if (!agent) {
                await Orchestrator._handleAgentError(workflowId, task.name, new Error('Agent not found'));
                return;
            }
            // Update currentAgent in workflow
            await workflowStore.updateWorkflow(workflowId, { currentAgent: task.name, updatedAt: new Date().toISOString() });
            socket.emit('workflowUpdated', { workflowId, status: 'RUNNING', currentAgent: task.name });
            try {
                const result = await agent.run({ event, workflowId });
                // Mark task completed
                task.status = 'COMPLETED';
                task.result = result;
                await auditLogger.log({
                    workflowId,
                    agent: task.name,
                    action: 'Execute',
                    status: 'SUCCESS',
                    result: JSON.stringify(result),
                });
                socket.emit('workflowUpdated', { workflowId, status: 'RUNNING', currentAgent: task.name, taskStatus: 'COMPLETED' });
            } catch (err) {
                await Orchestrator._handleAgentError(workflowId, task.name, err);
                return; // stop further execution on error
            }
        }
        // All agents completed
        await workflowStore.updateWorkflow(workflowId, { status: 'COMPLETED', currentAgent: null, updatedAt: new Date().toISOString() });
        await auditLogger.log({ workflowId, agent: 'Orchestrator', action: 'WorkflowCompleted', status: 'SUCCESS', result: `Workflow ${workflowId} completed` });
        socket.emit('workflowUpdated', { workflowId, status: 'COMPLETED' });
    }

    static async _handleAgentError(workflowId, agentName, error) {
        console.error(`Agent ${agentName} failed:`, error);
        await workflowStore.updateWorkflow(workflowId, { status: 'FAILED', currentAgent: agentName, updatedAt: new Date().toISOString() });
        await auditLogger.log({ workflowId, agent: agentName, action: 'Execute', status: 'FAILED', result: error.message });
        socket.emit('workflowUpdated', { workflowId, status: 'FAILED', currentAgent: agentName });
        // Retry logic – simple exponential back‑off up to 3 attempts
        const workflow = await workflowStore.getWorkflow(workflowId);
        if (workflow.retryCount < 3) {
            const newRetry = workflow.retryCount + 1;
            await workflowStore.updateWorkflow(workflowId, { retryCount: newRetry, status: 'RETRYING', updatedAt: new Date().toISOString() });
            socket.emit('workflowUpdated', { workflowId, status: 'RETRYING' });
            setTimeout(() => {
                Orchestrator._executeWorkflow(workflowId, workflow.eventPayload, workflow.tasks);
            }, 1000 * Math.pow(2, newRetry));
        } else {
            // Escalate – create incident and alert
            const incidentAgent = agents.getAgent('incidentAgent');
            if (incidentAgent) {
                await incidentAgent.run({ workflowId, error: error.message });
            }
            // TODO: generate operational alert via alert service
        }
    }
}

module.exports = Orchestrator;
