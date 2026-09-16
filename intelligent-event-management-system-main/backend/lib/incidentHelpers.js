function buildIncidentAnalysis(incident = {}) {
  const text = `${incident.title || ''} ${incident.description || ''} ${incident.category || ''} ${incident.location || ''}`.toLowerCase();
  const hasSecurity = /(security|unauthorized|restricted|backstage|access|badge|barricade|intruder)/i.test(text);
  const hasMedical = /(medical|injury|first aid|emergency|ambulance|health|medical aid)/i.test(text);
  const hasAudioVisual = /(microphone|audio|av|speaker|projector|screen|video|display|sound|lighting|visual)/i.test(text);
  const hasRegistration = /(registration|check-in|checkin|qr|scanner|badge|attendee|pass)/i.test(text);
  const hasCrowd = /(crowd|queue|overflow|capacity|stampede|congestion|traffic)/i.test(text);
  const hasMinorVenue = /(chair|seat|damaged|broken|repair|worn|table|furniture)/i.test(text);
  const hasVenue = /(venue|room|hall|layout|lighting|temp|temperature)/i.test(text);
  const hasSpeaker = /(speaker|keynote|podium|stage|panel)/i.test(text);
  const hasElectrical = /(electrical|power|outage|socket|breaker|circuit|lighting)/i.test(text);
  const hasTransport = /(transport|parking|shuttle|bus|traffic|road)/i.test(text);
  const hasSponsorship = /(sponsor|booth|vendor|exhibitor|branding|stand)/i.test(text);

  let category = 'Other';
  if (hasSecurity) category = 'Security';
  else if (hasMedical) category = 'Medical';
  else if (hasAudioVisual) category = 'Audio/Visual';
  else if (hasRegistration) category = 'Registration';
  else if (hasCrowd) category = 'Crowd Management';
  else if (hasVenue) category = 'Venue';
  else if (hasSpeaker) category = 'Speaker';
  else if (hasElectrical) category = 'Electrical';
  else if (hasTransport) category = 'Transport';
  else if (hasSponsorship) category = 'Sponsorship';
  else if (incident.category) category = String(incident.category).trim() || 'Other';

  let severity = 'LOW';
  if (hasSecurity || hasMedical) severity = 'CRITICAL';
  else if (hasAudioVisual || hasSpeaker || hasRegistration || hasElectrical) severity = 'HIGH';
  else if (hasCrowd || hasTransport) severity = 'MEDIUM';
  else if (hasVenue && hasMinorVenue) severity = 'LOW';
  else if (hasVenue) severity = 'MEDIUM';

  const priority = severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'HIGH' : severity === 'MEDIUM' ? 'MEDIUM' : 'LOW';
  const riskLevel = severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'HIGH' : severity === 'MEDIUM' ? 'MEDIUM' : 'LOW';

  const recommendedActions = {
    'Audio/Visual': [
      'Check the active audio or video source and confirm the signal path.',
      'Swap to backup equipment or a fallback microphone if available.',
      'Escalate to AV support and keep the session team updated on recovery status.',
    ],
    Security: [
      'Verify the access point and identify the unauthorized individual.',
      'Notify security operations and isolate the affected restricted area.',
      'Keep a brief incident log for the event safety and admin review.',
    ],
    Medical: [
      'Provide immediate first-aid support and isolate the affected area if needed.',
      'Notify the medical response team and keep the attendee or staff member comfortable.',
      'Capture event details for the admin review and follow-up documentation.',
    ],
    Registration: [
      'Check scanner connectivity, network state, and recent registration sync status.',
      'Use an alternate check-in method while the primary system is unavailable.',
      'Notify registration operations and track the impact on attendee flow.',
    ],
    'Crowd Management': [
      'Assess crowd density and redirect attendees away from the affected zone.',
      'Coordinate with floor staff to maintain safe movement and queue flow.',
      'Notify operations leads if the issue affects capacity or staffing.',
    ],
    Venue: [
      'Inspect the affected room, furniture, or safety condition immediately.',
      'Apply a temporary workaround if the issue impacts attendee comfort or access.',
      'Record the repair need and notify venue operations for follow-up.',
    ],
    Speaker: [
      'Coordinate with the speaker and stage crew to maintain continuity.',
      'Switch to a backup presenter setup if the issue affects the session flow.',
      'Keep the stage operations lead informed of the latest recovery action.',
    ],
    Electrical: [
      'Check the affected power path, breaker, or equipment source before proceeding.',
      'Keep the zone clear until electrical safety is confirmed.',
      'Escalate to facilities and provide an operational update to event leads.',
    ],
    Transport: [
      'Confirm the transport issue and update attendees or staff with the latest guidance.',
      'Coordinate with the transport or venue lead for rerouting or backup support.',
      'Record the disruption and keep operations on the latest status.',
    ],
    Sponsorship: [
      'Check the sponsor booth, signage, or delivery issue with the event team.',
      'Coordinate with the sponsor contact if booth operations are affected.',
      'Keep the admin informed if the issue affects the sponsor experience.',
    ],
    Other: [
      'Inspect the affected area and determine whether the issue blocks event operations.',
      'Notify the appropriate on-site team for immediate support.',
      'Document the status and keep the admin updated.',
    ],
  };

  const recommendedStaffTypeMap = {
    'Audio/Visual': 'AV / Technical Support',
    Security: 'Security Operations',
    Medical: 'Medical Response Team',
    Registration: 'Registration Support',
    'Crowd Management': 'Operations & Floor Management',
    Venue: 'Venue Operations',
    Speaker: 'Stage Operations',
    Electrical: 'Facilities & Electrical Team',
    Transport: 'Logistics & Transport Team',
    Sponsorship: 'Sponsor Relations Team',
    Other: 'General Operations Support',
  };

  const summary = `The incident involving ${incident.title || 'the reported issue'} may ${severity === 'LOW' ? 'have a limited operational impact.' : severity === 'MEDIUM' ? 'affect part of the event operations.' : severity === 'HIGH' ? 'create a significant disruption to the event flow.' : 'pose an immediate risk to event continuity or attendee safety.'}`;
  const explanation = severity === 'LOW'
    ? 'The issue appears localized and contains limited operational risk.'
    : severity === 'MEDIUM'
      ? 'The incident affects part of the event experience and should be actively monitored.'
      : severity === 'HIGH'
        ? 'The issue impacts a key operational area and may disrupt the event experience for many attendees.'
        : 'The problem creates a major operational or safety risk and may require immediate escalation.';

  return {
    category,
    severity,
    priority,
    riskLevel,
    summary,
    recommendedActions: recommendedActions[category] || recommendedActions.Other,
    recommendedStaffType: recommendedStaffTypeMap[category] || 'General Operations Support',
    escalationRecommendation: severity === 'CRITICAL' || severity === 'HIGH' ? 'YES' : 'NO',
    escalationReason: severity === 'CRITICAL' || severity === 'HIGH'
      ? 'The incident affects a key operational area or has elevated safety risk.'
      : 'The issue appears manageable with the assigned on-site support team.',
    explanation,
    analyzedAt: new Date().toISOString(),
  };
}

function buildOperationalAlert({
  type,
  title,
  description,
  priority = 'MEDIUM',
  sourceType,
  sourceId,
  sourceLabel = '',
  relatedEntity = null,
  reason = '',
  recommendedAction = '',
  status = 'ACTIVE',
  adminUser = null,
  metadata = {},
  id = null,
  alertId = null,
}) {
  const { readEntity, nextId } = require('../lib/jsonStore');
  const idValue = Number.isFinite(Number(id)) ? Number(id) : nextId(readEntity('alerts', []), 'id');
  const resolvedAlertId = String(alertId || `ALERT-${String(idValue).padStart(4, '0')}`);

  return {
    id: idValue,
    alertId: resolvedAlertId,
    type: String(type || 'GENERAL').toUpperCase(),
    title: String(title || 'Operational alert').trim(),
    description: String(description || '').trim(),
    priority: String(priority || 'MEDIUM').toUpperCase(),
    sourceType: String(sourceType || 'system').toLowerCase(),
    sourceId: sourceId ?? null,
    sourceLabel: String(sourceLabel || '').trim(),
    relatedEntity: relatedEntity || null,
    status: String(status || 'ACTIVE').toUpperCase(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolvedBy: null,
    resolvedAt: null,
    dismissedBy: null,
    dismissedAt: null,
    reason: String(reason || '').trim(),
    recommendedAction: String(recommendedAction || '').trim(),
    adminUser: adminUser ? { id: adminUser.id || null, name: adminUser.name || 'Admin', email: adminUser.email || '' } : null,
    metadata: metadata || {},
    timeline: [{ action: 'Alert Created', actor: adminUser?.name || 'System', timestamp: new Date().toISOString(), description: 'Operational alert generated.' }],
  };
}

module.exports = {
  buildIncidentAnalysis,
  buildOperationalAlert,
};
