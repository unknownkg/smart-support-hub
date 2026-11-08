import {browserStore, DATA_KEY} from './storage.js';
import {getMetrics, names, validateRecord} from './core.js';
export const store = browserStore();
export const $ = selector => document.querySelector(selector);
export function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
export function badge(text, value) { return el('span',text,`badge badge-${value}`); }
export function dateText(value, time = false) {
  return value ? new Date(value).toLocaleString('ru-RU', time ? {dateStyle:'short',timeStyle:'short'} : {dateStyle:'medium'}) : '—';
}
const pages = [['index','Панель','◫'],['deployments','Внедрения','↗'],['incidents','Инциденты','!'],['maintenance','Заявки','≡'],['releases','Релизы','◇']];
const navIcons = {
  index:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  deployments:'<path d="M5 16V5h11M5 5l14 14M13 19h6v-6"/>',
  incidents:'<path d="M12 3 2 20h20L12 3Z"/><path d="M12 9v5m0 3v.1"/>',
  maintenance:'<path d="m8 3 2 4-3 3-4-2a7 7 0 0 0 9 9l4 4 5-5-4-4a7 7 0 0 0-9-9Z"/>',
  releases:'<path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10"/>'
};
export function message(text, error = false) {
  const target = $('#message'); target.textContent = text; target.className = error ? 'notice error' : 'notice success'; target.hidden = false;
}
function updateVersion() { $('#product-version').textContent = getMetrics(store.data).version; }
export function initUI(page) {
  const sidebar = $('#sidebar');
  const brand = el('a',undefined,'brand'); brand.href = 'index.html'; brand.append(el('span','S','brand-mark'),el('span','Smart Support\nHub')); sidebar.append(brand);
  sidebar.append(el('p','РАБОЧЕЕ ПРОСТРАНСТВО','nav-label'));
  const nav = el('nav'); nav.setAttribute('aria-label','Основная навигация');
  for (const [id,label,icon] of pages) {
    const link = el('a',undefined,id === page ? 'nav-link active' : 'nav-link'); link.href = `${id}.html`;
    if (id === page) link.setAttribute('aria-current','page');
    const symbol = el('span',undefined,'nav-icon'); symbol.setAttribute('aria-hidden','true');
    symbol.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${navIcons[id]}</svg>`;
    link.append(symbol,el('span',label)); nav.append(link);
  }
  sidebar.append(nav);
  const footer = el('div',undefined,'sidebar-footer'); footer.append(el('span','v1.0.0','local-label'),el('p','Учебные данные\nХранятся в этом браузере')); sidebar.append(footer);
  $('#topbar').innerHTML = '<button id="menu-button" class="icon-button mobile-toggle" aria-label="Открыть меню" aria-controls="sidebar" aria-expanded="false">☰</button><div class="breadcrumbs">Рабочее пространство <span>/</span> <strong></strong></div><div class="topbar-actions"><span class="version-label">Обслуживаемый продукт <b id="product-version"></b></span><button id="theme-button" class="icon-button" type="button"></button></div>';
  $('.breadcrumbs strong').textContent = pages.find(([id]) => id === page)[1]; updateVersion();
  const menu = $('#menu-button');
  const close = () => {document.body.classList.remove('menu-open'); $('#main').inert=false; menu.setAttribute('aria-expanded','false'); menu.setAttribute('aria-label','Открыть меню');};
  menu.addEventListener('click',() => {const opened = document.body.classList.toggle('menu-open'); $('#main').inert=opened; menu.setAttribute('aria-expanded',String(opened)); menu.setAttribute('aria-label',opened?'Закрыть меню':'Открыть меню'); if(opened) requestAnimationFrame(()=>nav.querySelector('a').focus());});
  $('#menu-backdrop').addEventListener('click',close);
  document.addEventListener('keydown',event => {
    if(!document.body.classList.contains('menu-open')) return;
    if(event.key === 'Escape') {close();menu.focus();}
    if(event.key === 'Tab') {
      const targets=[menu,...nav.querySelectorAll('a')];
      const index=targets.indexOf(document.activeElement);
      event.preventDefault(); targets[(index+(event.shiftKey?-1:1)+targets.length)%targets.length].focus();
    }
  });
  matchMedia('(min-width:769px)').addEventListener('change',event=>{if(event.matches)close();});
  const theme = $('#theme-button');
  const label = () => {const dark = document.documentElement.dataset.theme === 'dark'; theme.textContent = dark ? '☀' : '◐';theme.setAttribute('aria-label',dark?'Включить светлую тему':'Включить тёмную тему');}; label();
  theme.addEventListener('click',() => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; label();
    try {localStorage.setItem('smart-support-hub:theme',document.documentElement.dataset.theme);} catch {message('Тема изменена, но браузер не разрешил сохранить выбор.',true);}
    window.dispatchEvent(new Event('themechange'));
  });
  if (store.warning) message(store.warning,true);
  window.addEventListener('storage',event => {if(event.key === DATA_KEY || event.key === null){store.loadData();if(store.warning) message(store.warning,true); refresh();}});
  window.addEventListener('datachange',updateVersion);
}
export function refresh() {window.dispatchEvent(new Event('datachange'));}
export function change(mutator, text = 'Изменения сохранены.') {
  try {store.update(mutator); refresh(); message(text); return true;} catch(error) {message(error.message,true);return false;}
}
export function fillSelect(select, values, first) {
  select.replaceChildren();
  if (first) select.append(new Option(first[1], first[0]));
  Object.entries(values).forEach(([value,label]) => select.append(new Option(label,value)));
}
export function bindForm(collection, transform = value => value) {
  const form = $('#entry-form');
  form.addEventListener('submit',event => {
    event.preventDefault(); const errorBox = $('#form-error');errorBox.textContent = '';
    try {
      const values = Object.fromEntries(new FormData(form));
      Object.keys(values).forEach(key => values[key] = values[key].trim());
      const item = transform(values);
      item.id = `${{deployments:'DEP',incidents:'INC',requests:'REQ',releases:'REL'}[collection]}-${crypto.randomUUID()}`;
      validateRecord(collection,item);
      if (!change(data => {
        if(collection === 'releases' && data.releases.some(r => r.version.replace(/^v/,'') === item.version.replace(/^v/,''))) throw new Error('Такая версия уже есть в истории.');
        data[collection].push(item);
      },'Запись добавлена и сохранена.')) return;
      form.reset(); refresh();
    } catch(error) {errorBox.textContent = error.message;errorBox.focus();}
  });
}
export function tableRows(body, rows, columns) {
  body.replaceChildren();
  if(!rows.length) {const row = el('tr');const cell = el('td','Записей пока нет. Добавьте первую запись или измените фильтр.','empty');cell.colSpan = columns;row.append(cell);body.append(row);}
}
export function rowCells(body, cells) {
  const row = el('tr'); cells.forEach(value => {const cell = el('td');cell.append(value instanceof Node ? value : document.createTextNode(String(value)));row.append(cell);});body.append(row);return row;
}
export function statusSelect(collection,item,key,options) {
  const select = el('select',undefined,'table-select'); select.setAttribute('aria-label',`Статус: ${item.title || item.client}`); fillSelect(select,options);select.value = item[key];
  select.dataset.recordId = item.id;
  select.dataset.recordField = key;
  select.addEventListener('change',() => {
    if(!change(data => {data[collection].find(r=>r.id === item.id)[key] = select.value;})) select.value = item[key];
    // После перерисовки строки клавиатурный фокус остаётся на том же поле.
    const replacement = [...document.querySelectorAll('.table-select')].find(node => node.dataset.recordId === item.id && node.dataset.recordField === key);
    replacement?.focus({preventScroll:true});
  }); return select;
}
export {names};
