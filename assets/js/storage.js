import {initialData} from './data.js';
import {validateRecord} from './core.js';
export const DATA_KEY = 'smart-support-hub:v1';
export function validateData(data) {
  if (!data || typeof data !== 'object') throw new Error('Неверный формат данных.');
  for (const key of ['deployments','incidents','requests','releases']) {
    if (!Array.isArray(data[key])) throw new Error('Неполный набор данных.');
    const ids = new Set();
    for (const item of data[key]) {
      validateRecord(key,item);
      if (typeof item.id !== 'string' || !item.id || ids.has(item.id)) throw new Error('Неверный или повторяющийся идентификатор.');
      ids.add(item.id);
    }
  }
  return data;
}
export function createStore(adapter) {
  return {
    data:null, warning:'', blocked:false,
    loadData() {
      try {
        const raw = adapter.getItem(DATA_KEY);
        if (raw === null) {
          this.data = initialData();
          adapter.setItem(DATA_KEY, JSON.stringify({schema:1,data:this.data}));
        } else {
          const saved = JSON.parse(raw);
          if (saved.schema !== 1) throw new Error('Неизвестная версия хранилища.');
          this.data = validateData(saved.data);
        }
        this.warning = ''; this.blocked = false;
      } catch {
        this.data ??= initialData();
        this.blocked = true;
        this.warning = 'Хранилище недоступно или содержит повреждённые данные. Показан доступный набор только для чтения. Исходные данные не перезаписаны. Проверьте разрешения браузера или обратитесь за помощью.';
      }
      return this.data;
    },
    saveData(next) {
      if (this.blocked) throw new Error(this.warning);
      validateData(next);
      try { adapter.setItem(DATA_KEY, JSON.stringify({schema:1,data:next})); }
      catch { throw new Error('Не удалось сохранить изменения. Освободите место или разрешите хранение данных в браузере.'); }
      this.data = next;
    },
    update(mutator) {
      const next = structuredClone(this.data);
      mutator(next); this.saveData(next); return this.data;
    }
  };
}
export function browserStore() {
  let adapter;
  try { adapter = window.localStorage; } catch { adapter = {getItem(){throw new Error('Storage denied');}}; }
  const store = createStore(adapter); store.loadData(); return store;
}
