export const settings = {slaHours:{critical:4, high:8, medium:24, low:72}};
export const names = {
  stage:{planning:'Планирование', setup:'Настройка', training:'Обучение', production:'Эксплуатация'},
  priority:{critical:'Критический', high:'Высокий', medium:'Средний', low:'Низкий'},
  incidentStatus:{new:'Новый', in_progress:'В работе', resolved:'Решён'},
  type:{corrective:'Корректирующее', adaptive:'Адаптивное', perfective:'Совершенствующее', preventive:'Профилактическое'},
  requestStatus:{new:'Новая', planned:'Запланирована', done:'Выполнена'},
  sla:{on_track:'В срок', breached:'Срок нарушен', met:'Решён вовремя'},
  level:{patch:'Исправления', minor:'Новые возможности', major:'Несовместимые изменения'}
};
function requireValue(condition, message) { if (!condition) throw new Error(message); }
export function parseVersion(value) {
  requireValue(typeof value === 'string' && /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value), 'Введите версию в формате v1.2.3 без ведущих нулей.');
  const parts = value.replace(/^v/, '').split('.').map(Number);
  requireValue(parts.every(n => Number.isSafeInteger(n) && n < Number.MAX_SAFE_INTEGER), 'Номер версии слишком велик.');
  return parts;
}
export function getNextVersion(current, level) {
  const [major, minor, patch] = parseVersion(current);
  requireValue(Object.hasOwn(names.level, level), 'Выберите уровень изменения версии.');
  return level === 'major' ? `v${major + 1}.0.0` : level === 'minor' ? `v${major}.${minor + 1}.0` : `v${major}.${minor}.${patch + 1}`;
}
export function validDate(value) { return typeof value === 'string' && value.trim() !== '' && Number.isFinite(Date.parse(value)); }
export function getSlaState(incident, config = settings, now = Date.now()) {
  requireValue(Object.hasOwn(config.slaHours, incident.priority) && validDate(incident.createdAt), 'Неверный приоритет или дата инцидента.');
  const created = Date.parse(incident.createdAt);
  const deadline = created + config.slaHours[incident.priority] * 3600000;
  if (incident.status === 'resolved') {
    requireValue(validDate(incident.resolvedAt) && Date.parse(incident.resolvedAt) >= created, 'У решённого инцидента должна быть корректная дата решения.');
    return Date.parse(incident.resolvedAt) <= deadline ? 'met' : 'breached';
  }
  return now > deadline ? 'breached' : 'on_track';
}
export function getSlaPercent(incidents, config = settings) {
  const resolved = incidents.filter(item => item.status === 'resolved');
  return resolved.length ? Math.round(resolved.filter(item => getSlaState(item, config) === 'met').length / resolved.length * 100) : 100;
}
export function latestVersion(releases) {
  if (!releases.length) return '—';
  return [...releases].sort((a,b) => {
    const x = parseVersion(a.version), y = parseVersion(b.version);
    return y[0]-x[0] || y[1]-x[1] || y[2]-x[2];
  })[0].version;
}
export function getMetrics(data) {
  return {active:data.deployments.filter(item => item.stage !== 'production').length,
    open:data.incidents.filter(item => item.status !== 'resolved').length,
    sla:getSlaPercent(data.incidents), resolved:data.incidents.filter(item => item.status === 'resolved').length,
    version:latestVersion(data.releases)};
}
export function validateRecord(collection, item) {
  const text = (key, label) => requireValue(typeof item[key] === 'string' && item[key].trim().length > 0 && item[key].length <= 200, `${label}: введите от 1 до 200 символов.`);
  const choice = (key, options) => requireValue(Object.hasOwn(options, item[key]), 'Недопустимое значение поля.');
  const date = key => {
    requireValue(validDate(item[key]), 'Укажите корректную дату.');
    if (/^\d{4}-\d{2}-\d{2}$/.test(item[key])) requireValue(new Date(item[key]).toISOString().slice(0,10) === item[key], 'Такой даты не существует.');
  };
  requireValue(item && typeof item === 'object', 'Неверная запись.');
  if (collection === 'deployments') {
    text('client','Заказчик'); text('product','Продукт'); text('owner','Ответственный'); parseVersion(item.version); choice('stage',names.stage); date('plannedDate');
    requireValue(Number.isSafeInteger(item.done) && Number.isSafeInteger(item.total) && item.total > 0 && item.done >= 0 && item.done <= item.total, 'Готовность: выполнено от 0 до общего числа задач; всего — больше нуля.');
  } else if (collection === 'incidents') {
    text('title','Название'); choice('priority',names.priority); choice('status',names.incidentStatus); date('createdAt'); getSlaState(item);
    requireValue(item.status === 'resolved' || item.resolvedAt === null, 'У открытого инцидента не должно быть даты решения.');
  } else if (collection === 'requests') {
    text('title','Название'); choice('type',names.type); choice('status',names.requestStatus); parseVersion(item.targetVersion);
  } else if (collection === 'releases') {
    parseVersion(item.version); date('date'); choice('level',names.level);
    requireValue(Array.isArray(item.changes) && item.changes.length > 0 && item.changes.every(s => typeof s === 'string' && s.trim() && s.length <= 500), 'Добавьте непустой список изменений (до 500 символов на строку).');
  } else throw new Error('Неизвестный вид записи.');
  return item;
}
export function resolveIncident(item, now = new Date().toISOString()) {
  if (item.status === 'resolved') return {...item};
  return validateRecord('incidents', {...item, status:'resolved', resolvedAt:now});
}
