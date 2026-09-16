const { readEntity } = require('../lib/jsonStore');
const { buildEventIntelligence } = require('./intelligenceService');

function getEventIdValue(item, fallback = null) {
  if (!item) return fallback;
  const value = item.event_id ?? item.eventId ?? item.id ?? item.event ?? fallback;
  return value == null ? fallback : Number(value);
}

function filterEventRecords(records, eventId, fieldName = 'event_id') {
  if (!Array.isArray(records) || records.length === 0) return [];
  if (!eventId) return records;
  return records.filter((item) => {
    const candidate = item?.[fieldName] ?? item?.eventId ?? item?.event_id ?? item?.event ?? null;
    return candidate == null || Number(candidate) === Number(eventId);
  });
}

function getEventIntelligencePayload(eventId) {
  const events = readEntity('events', []);
  const event = eventId ? events.find((item) => Number(item.event_id ?? item.id) === Number(eventId)) || null : null;

  if (eventId && !event) {
    return { ok: false, status: 404, message: 'Event not found.' };
  }

  const registrations = readEntity('registrations', []);
  const attendance = readEntity('attendance', []);
  const incidents = readEntity('incidents', []);
  const proposals = readEntity('sponsorship_proposals', []);
  const payments = readEntity('sponsorship_payments', []);
  const deliverables = readEntity('sponsorship_deliverables', []);
  const alerts = readEntity('alerts', []);
  const sponsors = readEntity('sponsors', []);

  if (eventId) {
    return {
      ok: true,
      event,
      registrations: filterEventRecords(registrations, eventId, 'event_id'),
      attendance: filterEventRecords(attendance, eventId, 'event_id'),
      incidents: filterEventRecords(incidents, eventId, 'event_id'),
      proposals: filterEventRecords(proposals, eventId, 'event_id'),
      payments: filterEventRecords(payments, eventId, 'event_id'),
      deliverables: filterEventRecords(deliverables, eventId, 'event_id'),
      alerts: filterEventRecords(alerts, eventId, 'event_id'),
      sponsors,
    };
  }

  return {
    ok: true,
    event: events[0] || { id: 1, name: 'Overall Event System' },
    registrations,
    attendance,
    incidents,
    proposals,
    payments,
    deliverables,
    alerts,
    sponsors,
  };
}

function getEventIntelligence(eventId) {
  const payload = getEventIntelligencePayload(eventId);
  if (!payload.ok) {
    return payload;
  }

  return {
    ok: true,
    data: buildEventIntelligence(payload),
  };
}

function getAIOperationsIntelligence() {
  const payload = getEventIntelligencePayload(null);
  if (!payload.ok) {
    return payload;
  }

  return buildEventIntelligence(payload);
}

module.exports = {
  getEventIntelligence,
  getEventIntelligencePayload,
  getAIOperationsIntelligence,
};
