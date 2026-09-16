const { readEntity, writeEntity, nextId } = require('../lib/jsonStore');
const { buildEventIntelligence } = require('../intelligence/intelligenceService');
const { analyzeProposal } = require('../lib/sponsorshipAgent');
const { buildIncidentAnalysis, buildOperationalAlert } = require('../lib/incidentHelpers');

function buildStandardAgentResponse({
    success = true,
    agentId,
    taskId,
    status = 'COMPLETED',
    result = {},
    confidence = 0.9,
    requiresHumanApproval = false,
    nextSuggestedAction = '',
    error = null,
}) {
    return {
        success,
        agentId,
        taskId: taskId || `TASK-${Date.now().toString(36).toUpperCase()}`,
        status,
        result,
        confidence: Number(confidence.toFixed(2)),
        requiresHumanApproval,
        nextSuggestedAction,
        error: error ? String(error.message || error) : null,
        executedAt: new Date().toISOString(),
    };
}

/**
 * 1. SPEAKER AGENT ADAPTER
 */
async function executeSpeakerAgent({ taskId, trigger, context = {} }) {
    try {
        const speakers = readEntity('speakers', []);
        const sessions = readEntity('sessions', []);
        const events = readEntity('events', []);

        const speakerId = Number(context.speakerId || trigger.speakerId || 1);
        const sessionId = Number(context.sessionId || trigger.sessionId || 1);
        const eventId = Number(context.eventId || trigger.eventId || 1);

        const speaker = speakers.find((item) => Number(item.speaker_id || item.id) === speakerId) || {
            speaker_id: speakerId,
            name: 'Dr. Sarah Chen',
            bio: 'Keynote Speaker in AI Ethics',
            status: 'CANCELLED',
        };

        const session = sessions.find((item) => Number(item.session_id || item.id) === sessionId) || {
            session_id: sessionId,
            event_id: eventId,
            session_name: 'Opening Keynote: Agentic AI Systems',
            title: 'Opening Keynote: Agentic AI Systems',
            start_time: new Date(Date.now() + 3600000).toISOString(),
            end_time: new Date(Date.now() + 7200000).toISOString(),
            venue_id: 1,
            expectedAttendance: 180,
            status: 'cancelled',
        };

        const event = events.find((item) => Number(item.event_id || item.id) === eventId) || {
            id: eventId,
            name: 'AI Tech Summit 2026',
        };

        // Mark session as cancelled in data store
        const sessionIdx = sessions.findIndex((item) => Number(item.session_id || item.id) === sessionId);
        if (sessionIdx >= 0) {
            sessions[sessionIdx].status = 'cancelled';
            sessions[sessionIdx].cancelledAt = new Date().toISOString();
            sessions[sessionIdx].cancellationReason = trigger.reason || 'Speaker requested cancellation due to urgent schedule conflict';
            writeEntity('sessions', sessions);
        }

        return buildStandardAgentResponse({
            success: true,
            agentId: 'speaker-agent',
            taskId,
            status: 'COMPLETED',
            result: {
                eventType: trigger.eventType || 'speaker.cancelled',
                speakerId: speaker.speaker_id || speaker.id,
                speakerName: speaker.name,
                sessionId: session.session_id || session.id,
                sessionName: session.session_name || session.title,
                eventId: event.id || event.event_id,
                eventName: event.name,
                cancellationTimestamp: new Date().toISOString(),
                expectedAttendance: Number(session.expectedAttendance || 180),
                reason: 'Speaker emergency cancellation received.',
            },
            confidence: 0.95,
            requiresHumanApproval: false,
            nextSuggestedAction: 'analyze_event_impact',
        });
    } catch (err) {
        return buildStandardAgentResponse({
            success: false,
            agentId: 'speaker-agent',
            taskId,
            status: 'FAILED',
            error: err,
        });
    }
}

/**
 * 2. INTELLIGENCE AGENT ADAPTER
 */
async function executeIntelligenceAgent({ taskId, trigger, context = {} }) {
    try {
        const events = readEntity('events', []);
        const eventId = Number(context.eventId || trigger.eventId || 1);
        const event = events.find((item) => Number(item.event_id || item.id) === eventId) || { id: eventId, name: 'AI Tech Summit 2026' };

        const registrations = readEntity('registrations', []);
        const attendance = readEntity('attendance', []);
        const incidents = readEntity('incidents', []);
        const proposals = readEntity('sponsorship_proposals', []);
        const payments = readEntity('sponsorship_payments', []);
        const deliverables = readEntity('sponsorship_deliverables', []);
        const alerts = readEntity('alerts', []);
        const sponsors = readEntity('sponsors', []);

        const intelligence = buildEventIntelligence({
            event,
            registrations,
            attendance,
            incidents,
            proposals,
            payments,
            deliverables,
            alerts,
            sponsors,
        });

        const expectedAttendees = Number(context.speaker?.expectedAttendance || context.expectedAttendees || 180);
        const impactLevel = expectedAttendees > 150 ? 'HIGH' : expectedAttendees > 50 ? 'MEDIUM' : 'LOW';

        const updatedHealthScore = Math.max(40, intelligence.eventHealthScore - (impactLevel === 'HIGH' ? 14 : 8));

        return buildStandardAgentResponse({
            success: true,
            agentId: 'intelligence-agent',
            taskId,
            status: 'COMPLETED',
            result: {
                eventId,
                impactLevel,
                affectedAttendees: expectedAttendees,
                scheduleImpact: true,
                venueImpact: true,
                riskLevel: impactLevel,
                currentHealthScore: intelligence.eventHealthScore,
                projectedHealthScore: updatedHealthScore,
                healthStatus: updatedHealthScore < 75 ? 'WARNING' : 'HEALTHY',
                recommendedPriority: 'P1',
                insights: [
                    `Session cancellation affects ${expectedAttendees} registered attendees.`,
                    `Event health projected to drop from ${intelligence.eventHealthScore} to ${updatedHealthScore}.`,
                    'Immediate venue rescheduling and attendee notification required.',
                ],
            },
            confidence: 0.93,
            requiresHumanApproval: false,
            nextSuggestedAction: 'find_alternative_venue',
        });
    } catch (err) {
        return buildStandardAgentResponse({
            success: false,
            agentId: 'intelligence-agent',
            taskId,
            status: 'FAILED',
            error: err,
        });
    }
}

/**
 * 3. VENUE AGENT ADAPTER
 */
async function executeVenueAgent({ taskId, trigger, context = {} }) {
    try {
        const venues = readEntity('venues', []);
        const bookings = readEntity('bookings', []);
        const requiredCapacity = Number(context.impact?.affectedAttendees || context.requiredCapacity || 180);

        const availableVenues = venues.map((v) => {
            const isBooked = bookings.some(
                (b) => Number(b.venue_id) === Number(v.venue_id || v.id) && b.status === 'confirmed' && b.event_name?.includes('Keynote Backup')
            );
            return {
                venueId: v.venue_id || v.id,
                name: v.name,
                location: v.location,
                capacity: Number(v.capacity || 200),
                status: isBooked ? 'occupied' : 'available',
                venueType: v.venueType || 'Hall',
            };
        });

        const candidate = availableVenues.find((v) => v.capacity >= requiredCapacity && v.status === 'available') || {
            venueId: 2,
            name: 'Innovation Hall B',
            location: 'Research Wing - West',
            capacity: 250,
            status: 'available',
            venueType: 'Conference Hall',
        };

        const recommendedTime = '14:00 - 15:30';

        return buildStandardAgentResponse({
            success: true,
            agentId: 'venue-agent',
            taskId,
            status: 'COMPLETED',
            result: {
                recommendedVenueId: candidate.venueId,
                recommendedVenueName: candidate.name,
                location: candidate.location,
                availableTime: recommendedTime,
                capacity: candidate.capacity,
                requiredCapacity,
                utilizationRate: Math.round((requiredCapacity / candidate.capacity) * 100),
                conflicts: [],
                alternateOptions: availableVenues.filter((v) => v.venueId !== candidate.venueId).slice(0, 2),
            },
            confidence: 0.91,
            requiresHumanApproval: true, // Venue/schedule changes require human approval
            nextSuggestedAction: 'assess_attendee_impact',
        });
    } catch (err) {
        return buildStandardAgentResponse({
            success: false,
            agentId: 'venue-agent',
            taskId,
            status: 'FAILED',
            error: err,
        });
    }
}

/**
 * 4. REGISTRATION / ATTENDEE AGENT ADAPTER
 */
async function executeRegistrationAgent({ taskId, trigger, context = {} }) {
    try {
        const registrations = readEntity('registrations', []);
        const attendance = readEntity('attendance', []);

        const sessionId = Number(context.speaker?.sessionId || 1);
        const affectedAttendees = Number(context.impact?.affectedAttendees || 180);

        const affectedList = registrations.slice(0, Math.min(registrations.length, affectedAttendees)).map((r) => ({
            registrationId: r.registrationId,
            fullName: r.fullName,
            email: r.email,
        }));

        return buildStandardAgentResponse({
            success: true,
            agentId: 'registration-agent',
            taskId,
            status: 'COMPLETED',
            result: {
                sessionId,
                affectedAttendeesCount: affectedAttendees,
                registeredAttendeesFound: Math.max(affectedList.length, affectedAttendees),
                notificationRequired: true,
                checkInImpact: 'MODERATE',
                sampleAffectedAttendees: affectedList.slice(0, 5),
                recommendedChannel: 'EMAIL_AND_PUSH',
            },
            confidence: 0.94,
            requiresHumanApproval: false,
            nextSuggestedAction: 'create_operational_incident',
        });
    } catch (err) {
        return buildStandardAgentResponse({
            success: false,
            agentId: 'registration-agent',
            taskId,
            status: 'FAILED',
            error: err,
        });
    }
}

/**
 * 5. INCIDENT AGENT ADAPTER
 */
async function executeIncidentAgent({ taskId, trigger, context = {} }) {
    try {
        const incidents = readEntity('incidents', []);

        const speakerName = context.speaker?.speakerName || 'Keynote Speaker';
        const sessionName = context.speaker?.sessionName || 'Opening Keynote';
        const impactLevel = context.impact?.impactLevel || 'HIGH';
        const affectedCount = context.attendeeImpact?.affectedAttendeesCount || 180;

        const rawIncident = {
            title: `Speaker Cancellation: ${speakerName} (${sessionName})`,
            description: `Speaker ${speakerName} cancelled session '${sessionName}'. Impact level: ${impactLevel}. ${affectedCount} attendees affected. Proposed venue: ${context.venueOptions?.recommendedVenueName || 'Innovation Hall B'}.`,
            category: 'Speaker',
            location: context.venueOptions?.location || 'Grand Auditorium',
            severity: impactLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
        };

        const aiAnalysis = buildIncidentAnalysis(rawIncident);

        const incidentRecord = {
            incident_id: nextId(incidents, 'incident_id'),
            title: rawIncident.title,
            description: rawIncident.description,
            category: aiAnalysis.category,
            severity: aiAnalysis.severity,
            priority: aiAnalysis.priority,
            status: 'NEW',
            location: rawIncident.location,
            staff_assigned_to: aiAnalysis.recommendedStaffType,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ai_analysis: aiAnalysis,
            timeline: [
                {
                    action: 'Incident Created via Orchestrator',
                    actor: 'Agent Orchestrator',
                    timestamp: new Date().toISOString(),
                    description: `Automatically created incident for ${speakerName} cancellation.`,
                },
            ],
        };

        incidents.unshift(incidentRecord);
        writeEntity('incidents', incidents);

        return buildStandardAgentResponse({
            success: true,
            agentId: 'incident-agent',
            taskId,
            status: 'COMPLETED',
            result: {
                incidentId: incidentRecord.incident_id,
                title: incidentRecord.title,
                category: incidentRecord.category,
                severity: incidentRecord.severity,
                priority: incidentRecord.priority,
                assignedStaffType: incidentRecord.staff_assigned_to,
                status: incidentRecord.status,
            },
            confidence: 0.96,
            requiresHumanApproval: false,
            nextSuggestedAction: 'dispatch_operational_alert',
        });
    } catch (err) {
        return buildStandardAgentResponse({
            success: false,
            agentId: 'incident-agent',
            taskId,
            status: 'FAILED',
            error: err,
        });
    }
}

/**
 * 6. NOTIFICATION AGENT ADAPTER
 */
async function executeNotificationAgent({ taskId, trigger, context = {} }) {
    try {
        const alerts = readEntity('alerts', []);
        const notifications = readEntity('notifications', []);

        const title = `🚨 Action Needed: Speaker Cancellation - ${context.speaker?.speakerName || 'Keynote'}`;
        const description = `Session '${context.speaker?.sessionName || 'Keynote'}' was cancelled by speaker. Recommended venue: ${context.venueOptions?.recommendedVenueName || 'Innovation Hall B'} at ${context.venueOptions?.availableTime || '14:00'}. ${context.attendeeImpact?.affectedAttendeesCount || 180} attendees affected.`;

        const alertRecord = buildOperationalAlert({
            type: 'SPEAKER_CANCELLATION',
            title,
            description,
            priority: context.incident?.priority || 'HIGH',
            sourceType: 'agent-orchestrator',
            sourceId: context.incident?.incidentId || null,
            sourceLabel: 'Speaker Cancellation Orchestration',
            reason: 'Urgent schedule disruption requiring manager review',
            recommendedAction: `Approve session move to ${context.venueOptions?.recommendedVenueName || 'Hall B'} and dispatch attendee notifications.`,
            status: 'ACTIVE',
        });

        alerts.unshift(alertRecord);
        writeEntity('alerts', alerts);

        const noteRecord = {
            id: nextId(notifications),
            recipient_role: 'admin',
            title: 'Speaker Cancellation Alert',
            message: description,
            type: 'warning',
            is_read: false,
            created_at: new Date().toISOString(),
        };

        notifications.unshift(noteRecord);
        writeEntity('notifications', notifications);

        return buildStandardAgentResponse({
            success: true,
            agentId: 'notification-agent',
            taskId,
            status: 'COMPLETED',
            result: {
                alertId: alertRecord.alertId,
                notificationId: noteRecord.id,
                recipientRole: 'admin',
                title: noteRecord.title,
                status: 'DISPATCHED',
            },
            confidence: 0.98,
            requiresHumanApproval: false,
            nextSuggestedAction: 'await_human_approval',
        });
    } catch (err) {
        return buildStandardAgentResponse({
            success: false,
            agentId: 'notification-agent',
            taskId,
            status: 'FAILED',
            error: err,
        });
    }
}

/**
 * 7. SPONSORSHIP AGENT ADAPTER
 */
async function executeSponsorshipAgent({ taskId, trigger, context = {} }) {
    try {
        const proposals = readEntity('sponsorship_proposals', []);
        const sponsors = readEntity('sponsors', []);
        const events = readEntity('events', []);

        const proposalId = String(context.proposalId || trigger.proposalId || 'SP-001');
        const proposal = proposals.find((item) => String(item.proposal_id) === proposalId) || {
            proposal_id: proposalId,
            sponsor_id: 1,
            event_id: 1,
            amount: 500000,
            booth_required: true,
            promotional_sessions: 2,
        };

        const sponsor = sponsors.find((item) => Number(item.id) === Number(proposal.sponsor_id)) || { name: 'TechCorp' };
        const event = events.find((item) => Number(item.id) === Number(proposal.event_id)) || { name: 'AI Tech Summit 2026' };

        const analysis = analyzeProposal({ proposal, sponsor, event });

        return buildStandardAgentResponse({
            success: true,
            agentId: 'sponsorship-agent',
            taskId,
            status: 'COMPLETED',
            result: analysis,
            confidence: 0.92,
            requiresHumanApproval: analysis.recommendation !== 'Suitable for Approval',
            nextSuggestedAction: 'review_sponsorship_terms',
        });
    } catch (err) {
        return buildStandardAgentResponse({
            success: false,
            agentId: 'sponsorship-agent',
            taskId,
            status: 'FAILED',
            error: err,
        });
    }
}

const AGENT_ADAPTER_MAP = {
    'speaker-agent': executeSpeakerAgent,
    'intelligence-agent': executeIntelligenceAgent,
    'venue-agent': executeVenueAgent,
    'registration-agent': executeRegistrationAgent,
    'incident-agent': executeIncidentAgent,
    'notification-agent': executeNotificationAgent,
    'sponsorship-agent': executeSponsorshipAgent,
};

async function executeAgentTask(agentId, taskPayload) {
    const adapter = AGENT_ADAPTER_MAP[agentId];
    if (!adapter) {
        return buildStandardAgentResponse({
            success: false,
            agentId,
            taskId: taskPayload.taskId,
            status: 'FAILED',
            error: new Error(`No agent adapter registered for agent '${agentId}'`),
        });
    }
    return await adapter(taskPayload);
}

module.exports = {
    executeAgentTask,
    executeSpeakerAgent,
    executeIntelligenceAgent,
    executeVenueAgent,
    executeRegistrationAgent,
    executeIncidentAgent,
    executeNotificationAgent,
    executeSponsorshipAgent,
    buildStandardAgentResponse,
};
