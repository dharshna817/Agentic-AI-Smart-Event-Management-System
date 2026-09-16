const EXECUTION_PLANS = {
    'speaker.cancelled': [
        { sequenceOrder: 1, agentId: 'speaker-agent', dependencies: [] },
        { sequenceOrder: 2, agentId: 'intelligence-agent', dependencies: ['speaker-agent'] },
        { sequenceOrder: 3, agentId: 'venue-agent', dependencies: ['intelligence-agent'] },
        { sequenceOrder: 3, agentId: 'registration-agent', dependencies: ['intelligence-agent'] },
        { sequenceOrder: 4, agentId: 'incident-agent', dependencies: ['intelligence-agent', 'venue-agent', 'registration-agent'] },
        { sequenceOrder: 5, agentId: 'notification-agent', dependencies: ['incident-agent'] },
    ],

    'venue.unavailable': [
        { sequenceOrder: 1, agentId: 'venue-agent', dependencies: [] },
        { sequenceOrder: 2, agentId: 'intelligence-agent', dependencies: ['venue-agent'] },
        { sequenceOrder: 3, agentId: 'registration-agent', dependencies: ['intelligence-agent'] },
        { sequenceOrder: 4, agentId: 'incident-agent', dependencies: ['intelligence-agent', 'venue-agent'] },
        { sequenceOrder: 5, agentId: 'notification-agent', dependencies: ['incident-agent'] },
    ],

    'registration.spike': [
        { sequenceOrder: 1, agentId: 'registration-agent', dependencies: [] },
        { sequenceOrder: 2, agentId: 'intelligence-agent', dependencies: ['registration-agent'] },
        { sequenceOrder: 3, agentId: 'incident-agent', dependencies: ['intelligence-agent'] },
        { sequenceOrder: 4, agentId: 'notification-agent', dependencies: ['incident-agent'] },
    ],

    'incident.created': [
        { sequenceOrder: 1, agentId: 'incident-agent', dependencies: [] },
        { sequenceOrder: 2, agentId: 'intelligence-agent', dependencies: ['incident-agent'] },
        { sequenceOrder: 3, agentId: 'notification-agent', dependencies: ['intelligence-agent'] },
    ],

    'sponsor.payment_pending': [
        { sequenceOrder: 1, agentId: 'sponsorship-agent', dependencies: [] },
        { sequenceOrder: 2, agentId: 'intelligence-agent', dependencies: ['sponsorship-agent'] },
        { sequenceOrder: 3, agentId: 'notification-agent', dependencies: ['intelligence-agent'] },
    ],
};

function getExecutionPlan(triggerType) {
    const plan = EXECUTION_PLANS[triggerType];
    if (plan) return JSON.parse(JSON.stringify(plan));

    // Default fallback execution plan for any unhandled trigger
    return [
        { sequenceOrder: 1, agentId: 'intelligence-agent', dependencies: [] },
        { sequenceOrder: 2, agentId: 'notification-agent', dependencies: ['intelligence-agent'] },
    ];
}

function areDependenciesSatisfied(task, completedTaskAgentIds = []) {
    if (!task.dependencies || task.dependencies.length === 0) return true;
    return task.dependencies.every((depAgentId) => completedTaskAgentIds.includes(depAgentId));
}

function getNextExecutableTasks(tasks = []) {
    const completedTaskAgentIds = tasks
        .filter((t) => t.status === 'COMPLETED')
        .map((t) => t.agentId);

    return tasks.filter(
        (task) =>
            task.status === 'PENDING' &&
            areDependenciesSatisfied(task, completedTaskAgentIds)
    );
}

module.exports = {
    EXECUTION_PLANS,
    getExecutionPlan,
    areDependenciesSatisfied,
    getNextExecutableTasks,
};
