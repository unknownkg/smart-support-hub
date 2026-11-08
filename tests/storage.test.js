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
