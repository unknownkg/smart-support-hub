import test from 'node:test';
import assert from 'node:assert/strict';

// Импорт общего UI создаёт store; адаптер изолирован от данных браузера.
const values = new Map();
globalThis.window = {localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}};
const ui = await import('../assets/js/ui.js');

test('Календарная дата не меняет день в отрицательном UTC-смещении (#2)', () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = 'America/Los_Angeles';
    assert.equal(ui.dateText('2026-11-08'),'8 нояб. 2026 г.');
    assert.equal(ui.dateText('2027-01-01'),'1 янв. 2027 г.');
    assert.equal(ui.dateText('2026-11-08T00:30:00Z',true),'07.11.2026, 16:30');
    assert.equal(ui.dateText(null),'—');
  } finally {
    if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
  }
});

test('Начальная дата релиза использует местный календарь на границах дня и года (#2)', () => {
  const previous = process.env.TZ;
  try {
    assert.equal(typeof ui.localDateValue,'function');
    for (const [zone,instant,want] of [
      ['Asia/Bishkek','2026-11-09T00:30:00+06:00','2026-11-09'],
      ['Asia/Bishkek','2027-01-01T00:30:00+06:00','2027-01-01'],
      ['America/Los_Angeles','2026-12-31T23:30:00-08:00','2026-12-31'],
      ['Pacific/Kiritimati','2028-03-01T00:30:00+14:00','2028-03-01']
    ]) {
      process.env.TZ = zone;
      assert.equal(ui.localDateValue(new Date(instant)),want);
    }
  } finally {
    if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
  }
});
