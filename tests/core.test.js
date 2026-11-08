import test from 'node:test';
import assert from 'node:assert/strict';
const core = await import('../assets/js/core.js').catch(() => ({}));
test('SLA: все четыре порога, точная граница и просрочка', () => {
  assert.equal(typeof core.getSlaState, 'function');
  for (const [priority, hours] of Object.entries({critical:4, high:8, medium:24, low:72})) {
    const created = Date.parse('2026-01-01T00:00:00Z');
    const end = created + hours * 3600000;
    const incident = {priority, status:'new', createdAt:new Date(created).toISOString(), resolvedAt:null};
    assert.equal(core.getSlaState(incident, core.settings, end), 'on_track');
    assert.equal(core.getSlaState(incident, core.settings, end + 1), 'breached');
    incident.status = 'resolved';
    incident.resolvedAt = new Date(end).toISOString();
    assert.equal(core.getSlaState(incident), 'met');
    incident.resolvedAt = new Date(end + 1).toISOString();
    assert.equal(core.getSlaState(incident), 'breached');
    incident.resolvedAt = null;
    assert.throws(() => core.getSlaState(incident));
  }
});
test('SemVer: перенос разрядов и отказ на неверном вводе', () => {
  assert.equal(typeof core.getNextVersion, 'function');
  assert.equal(core.getNextVersion('v1.2.9', 'patch'), 'v1.2.10');
  assert.equal(core.getNextVersion('v1.2.9', 'minor'), 'v1.3.0');
  assert.equal(core.getNextVersion('v1.2.9', 'major'), 'v2.0.0');
  for (const value of ['v01.2.3', '1.2', '-1.2.3', '1.2.x', '', '1.2.3.4']) assert.throws(() => core.getNextVersion(value, 'patch'));
  assert.throws(() => core.getNextVersion('1.2.3', 'unknown'));
});
test('Валидация: пробелы, диапазон готовности, типы и даты', () => {
  assert.equal(typeof core.validateRecord, 'function');
  assert.throws(() => core.validateRecord('incidents', {title:'  ', priority:'high', status:'new', createdAt:new Date().toISOString(), resolvedAt:null}));
  assert.throws(() => core.validateRecord('deployments', {client:'A', product:'B', owner:'C', version:'v1.0.0', stage:'setup', done:4, total:3, plannedDate:'2026-01-01'}));
  assert.throws(() => core.validateRecord('requests', {title:'A', type:'wrong', status:'new', targetVersion:'v1.0.0'}));
  assert.throws(() => core.validateRecord('incidents', {title:'A', priority:'high', status:'resolved', createdAt:'bad', resolvedAt:null}));
});
test('KPI: только активные внедрения, открытые инциденты, SLA решённых', () => {
  assert.equal(typeof core.getMetrics, 'function');
  const incidents = [
    {priority:'high', status:'resolved', createdAt:'2026-01-01T00:00:00Z', resolvedAt:'2026-01-01T08:00:00Z'},
    {priority:'high', status:'resolved', createdAt:'2026-01-01T00:00:00Z', resolvedAt:'2026-01-01T09:00:00Z'},
    {priority:'high', status:'new', createdAt:'2026-01-01T00:00:00Z', resolvedAt:null}
  ];
  const metrics = core.getMetrics({deployments:[{stage:'setup'},{stage:'production'}], incidents, releases:[{version:'v1.9.0'},{version:'v1.10.0'}]});
  assert.equal(metrics.active, 1); assert.equal(metrics.open, 1); assert.equal(metrics.sla, 50); assert.equal(metrics.version, 'v1.10.0');
  assert.equal(core.getSlaPercent([]), 100);
});
test('Повторное решение сохраняет первую дату и исходный объект', () => {
  assert.equal(typeof core.resolveIncident, 'function');
  const item = {title:'A', priority:'high', status:'new', createdAt:'2026-01-01T00:00:00Z', resolvedAt:null};
  const result = core.resolveIncident(item, '2026-01-01T01:00:00Z');
  assert.equal(item.status, 'new'); assert.equal(result.status, 'resolved');
  assert.equal(core.resolveIncident(result, '2026-01-02T01:00:00Z').resolvedAt, result.resolvedAt);
});
