class ContextManager {
    static createInitialContext({ workflowId, eventId, trigger }) {
        return {
            workflowId,
            eventId: Number(eventId || 1),
            trigger: {
                type: trigger.eventType || trigger.type,
                source: trigger.source || 'system',
                timestamp: new Date().toISOString(),
                ...trigger,
            },
            speaker: null,
            impact: null,
            venueOptions: null,
            attendeeImpact: null,
            incident: null,
            notification: null,
            sponsorship: null,
            meta: {
                startedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        };
    }

    static getSanitizedInputForAgent(agentId, context = {}) {
        const base = {
            workflowId: context.workflowId,
            eventId: context.eventId,
        };

        switch (agentId) {
            case 'speaker-agent':
                return {
                    ...base,
                    speakerId: context.trigger?.speakerId || 1,
                    sessionId: context.trigger?.sessionId || 1,
                };

            case 'intelligence-agent':
                return {
                    ...base,
                    speaker: context.speaker,
                    triggerType: context.trigger?.type,
                };

            case 'venue-agent':
                return {
                    ...base,
                    sessionId: context.speaker?.sessionId || 1,
                    impact: context.impact,
                    requiredCapacity: context.impact?.affectedAttendees || 180,
                };

            case 'registration-agent':
                return {
                    ...base,
                    sessionId: context.speaker?.sessionId || 1,
                    impact: context.impact,
                };

            case 'incident-agent':
                return {
                    ...base,
                    speaker: context.speaker,
                    impact: context.impact,
                    venueOptions: context.venueOptions,
                    attendeeImpact: context.attendeeImpact,
                };

            case 'notification-agent':
                return {
                    ...base,
                    speaker: context.speaker,
                    impact: context.impact,
                    venueOptions: context.venueOptions,
                    incident: context.incident,
                    attendeeImpact: context.attendeeImpact,
                };

            case 'sponsorship-agent':
                return {
                    ...base,
                    proposalId: context.trigger?.proposalId || 'SP-001',
                    sponsorId: context.trigger?.sponsorId || 1,
                };

            default:
                return { ...base };
        }
    }

    static updateContextWithAgentResult(context, agentId, agentResult) {
        const updated = { ...context };
        updated.meta.updatedAt = new Date().toISOString();

        switch (agentId) {
            case 'speaker-agent':
                updated.speaker = agentResult;
                break;

            case 'intelligence-agent':
                updated.impact = agentResult;
                break;

            case 'venue-agent':
                updated.venueOptions = agentResult;
                break;

            case 'registration-agent':
                updated.attendeeImpact = agentResult;
                break;

            case 'incident-agent':
                updated.incident = agentResult;
                break;

            case 'notification-agent':
                updated.notification = agentResult;
                break;

            case 'sponsorship-agent':
                updated.sponsorship = agentResult;
                break;

            default:
                updated[agentId] = agentResult;
                break;
        }

        return updated;
    }
}

module.exports = ContextManager;
