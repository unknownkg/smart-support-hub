import test from 'node:test';
import assert from 'node:assert/strict';
import {initialData} from '../assets/js/data.js';
const storage = await import('../assets/js/storage.js').catch(() => ({}));
function memory() { const data = new Map(); return {getItem:key => data.get(key) ?? null,setItem:(key,value) => data.set(key,value)}; }
test('Сохранение и повторное чтение изменённых данных', () => {
  assert.equal(typeof storage.createStore, 'function');
  const adapter = memory(); const store = storage.createStore(adapter); store.loadData();
  store.update(data => {data.requests[0].title = 'Новое название';});
  assert.equal(storage.createStore(adapter).loadData().requests[0].title, 'Новое название');
});
test('Повреждённые данные не заменяются демонстрационными при записи', () => {
  assert.equal(typeof storage.createStore, 'function');
  const adapter = memory(); adapter.setItem(storage.DATA_KEY, '{broken');
  const store = storage.createStore(adapter); store.loadData();
  assert.ok(store.warning); assert.throws(() => store.update(data => data.requests.pop()));
  assert.equal(adapter.getItem(storage.DATA_KEY), '{broken');
});
test('Ошибка записи не меняет состояние; неверная структура отклоняется', () => {
  assert.equal(typeof storage.createStore, 'function');
  const adapter = memory(); const store = storage.createStore(adapter); store.loadData();
  const original = store.data.requests.length;
  adapter.setItem = () => {throw new Error('quota');};
  assert.throws(() => store.update(data => data.requests.pop())); assert.equal(store.data.requests.length,original);
  assert.throws(() => storage.validateData({requests:[]}));
  const data = initialData(); data.incidents[0].id = data.incidents[1].id;
  assert.throws(() => storage.validateData(data));
});

test('Устаревший экземпляр сохраняет новые записи другого экземпляра (#1)', () => {
  const adapter = memory();
  const first = storage.createStore(adapter), second = storage.createStore(adapter);
  first.loadData(); second.loadData();
  first.update(data => data.requests.push({...data.requests[0],id:'REQ-OTHER-TAB',title:'Новая заявка в другой вкладке'}));
  const done = second.data.deployments[0].done;
  second.update(data => {data.deployments[0].done++;});
  const saved = storage.createStore(adapter).loadData();
  assert.ok(saved.requests.some(item => item.id === 'REQ-OTHER-TAB'));
  assert.equal(saved.deployments[0].done, done + 1);
});

test('Повреждение после загрузки блокирует запись и сохраняет исходную строку (#1)', () => {
  const adapter = memory(), store = storage.createStore(adapter);
  store.loadData(); adapter.setItem(storage.DATA_KEY,'{damaged-after-load');
  assert.throws(() => store.update(data => data.requests.pop()));
  assert.equal(adapter.getItem(storage.DATA_KEY),'{damaged-after-load');
});
