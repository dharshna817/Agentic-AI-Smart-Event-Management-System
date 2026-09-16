const test = require('node:test');
const assert = require('node:assert/strict');

function loadModules() {
  delete require.cache[require.resolve('../routes/admin')];
  delete require.cache[require.resolve('../orchestration/agentAdapters')];
  delete require.cache[require.resolve('../orchestration/orchestrationService')];

  const adminRoutes = require('../routes/admin');
  const agentAdapters = require('../orchestration/agentAdapters');

  return { adminRoutes, agentAdapters };
}

test('admin and orchestration adapters load without circular export breakage', () => {
  const { adminRoutes, agentAdapters } = loadModules();

  assert.ok(agentAdapters, 'agent adapters should load');
  assert.equal(typeof adminRoutes.buildOperationalAlert, 'function');
  assert.equal(typeof adminRoutes.buildIncidentAnalysis, 'function');
});
