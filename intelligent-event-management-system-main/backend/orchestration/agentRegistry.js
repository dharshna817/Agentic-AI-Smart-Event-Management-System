const DEFAULT_AGENTS = [
    {
        agentId: 'speaker-agent',
        name: 'Speaker Agent',
        description: 'Monitors speaker availability, manages session schedules, and detects speaker cancellation events.',
        capabilities: ['speaker_cancellation', 'speaker_schedule', 'speaker_availability', 'speaker_conflict'],
        supportedTriggers: ['speaker.cancelled', 'speaker.unavailable'],
        inputRequirements: ['speakerId', 'sessionId', 'eventId'],
        outputFormat: 'json',
        priority: 'HIGH',
        status: 'ACTIVE',
        timeout: 5000,
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
        humanApprovalRequirement: false,
    },
    {
        agentId: 'intelligence-agent',
        name: 'Event Intelligence Engine',
        description: 'Calculates real-time health scores, assesses operational impact, detects risks, and generates AI recommendations.',
        capabilities: ['health_score_calculation', 'risk_detection', 'impact_analysis', 'trend_analysis', 'ai_recommendations'],
        supportedTriggers: ['speaker.cancelled', 'venue.unavailable', 'registration.spike', 'incident.created', 'attendance.decline_detected', 'event.health_warning'],
        inputRequirements: ['eventId', 'sessionId', 'speakerId'],
        outputFormat: 'json',
        priority: 'HIGH',
        status: 'ACTIVE',
        timeout: 8000,
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
        humanApprovalRequirement: false,
    },
    {
        agentId: 'venue-agent',
        name: 'Venue Agent',
        description: 'Evaluates venue utilization, recommends optimal room allocations, and checks availability for session rescheduling.',
        capabilities: ['venue_recommendation', 'venue_booking', 'capacity_check', 'alternative_venue_search', 'schedule_conflict_resolution'],
        supportedTriggers: ['speaker.cancelled', 'venue.unavailable', 'session.rescheduled'],
        inputRequirements: ['eventId', 'sessionId', 'requiredCapacity'],
        outputFormat: 'json',
        priority: 'HIGH',
        status: 'ACTIVE',
        timeout: 5000,
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
        humanApprovalRequirement: true,
    },
    {
        agentId: 'registration-agent',
        name: 'Registration & Attendee Agent',
        description: 'Assesses attendee impact, tracks check-in spikes, monitors attendance trends, and coordinates affected attendee lists.',
        capabilities: ['attendee_impact_assessment', 'checkin_tracking', 'registration_spike_analysis', 'attendee_communication_list'],
        supportedTriggers: ['speaker.cancelled', 'registration.failed', 'registration.spike', 'attendance.decline_detected'],
        inputRequirements: ['eventId', 'sessionId'],
        outputFormat: 'json',
        priority: 'MEDIUM',
        status: 'ACTIVE',
        timeout: 5000,
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
        humanApprovalRequirement: false,
    },
    {
        agentId: 'incident-agent',
        name: 'Incident Agent',
        description: 'Automatically creates, categorizes, prioritizes operational incidents, and matches technical support staff.',
        capabilities: ['incident_creation', 'ai_technician_matching', 'severity_classification', 'resolution_tracking'],
        supportedTriggers: ['speaker.cancelled', 'venue.unavailable', 'registration.spike', 'incident.created', 'incident.escalated'],
        inputRequirements: ['title', 'description', 'category', 'severity'],
        outputFormat: 'json',
        priority: 'HIGH',
        status: 'ACTIVE',
        timeout: 5000,
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
        humanApprovalRequirement: false,
    },
    {
        agentId: 'notification-agent',
        name: 'Operational Notification Agent',
        description: 'Dispatches operational alerts to event managers, admins, and sends broadcast notifications to attendees.',
        capabilities: ['operational_alert_creation', 'manager_notification', 'attendee_announcement', 'role_based_alerting'],
        supportedTriggers: ['speaker.cancelled', 'venue.unavailable', 'incident.created', 'incident.escalated', 'registration.spike'],
        inputRequirements: ['recipientRole', 'title', 'message'],
        outputFormat: 'json',
        priority: 'MEDIUM',
        status: 'ACTIVE',
        timeout: 4000,
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
        humanApprovalRequirement: false,
    },
    {
        agentId: 'sponsorship-agent',
        name: 'Sponsorship Agent',
        description: 'Evaluates sponsor proposals, calculates reliability scores, tracks deliverables, and identifies financial risks.',
        capabilities: ['proposal_analysis', 'sponsor_reliability_scoring', 'deliverable_tracking', 'financial_impact_analysis'],
        supportedTriggers: ['sponsor.payment_pending', 'sponsor.deliverable_overdue'],
        inputRequirements: ['proposalId', 'sponsorId'],
        outputFormat: 'json',
        priority: 'MEDIUM',
        status: 'ACTIVE',
        timeout: 5000,
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
        humanApprovalRequirement: true,
    },
];

let registryState = [...DEFAULT_AGENTS];

function getRegisteredAgents() {
    return registryState;
}

function getAgentById(agentId) {
    return registryState.find((agent) => agent.agentId === agentId) || null;
}

function getAgentsByTrigger(triggerType) {
    return registryState.filter((agent) =>
        agent.supportedTriggers.includes(triggerType)
    );
}

function updateAgentStatus(agentId, status) {
    const agent = getAgentById(agentId);
    if (agent) {
        agent.status = status;
        return true;
    }
    return false;
}

function resetRegistry() {
    registryState = JSON.parse(JSON.stringify(DEFAULT_AGENTS));
}

module.exports = {
    getRegisteredAgents,
    getAgentById,
    getAgentsByTrigger,
    updateAgentStatus,
    resetRegistry,
    DEFAULT_AGENTS,
};
