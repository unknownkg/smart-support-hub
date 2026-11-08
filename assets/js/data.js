const now = Date.now();
const ago = hours => new Date(now - hours * 3600000).toISOString();
export const startDeployments = [
  {id:'DEP-01',client:'Лицей «Вектор»',product:'Электронное расписание',version:'v1.2.0',stage:'training',owner:'Алексей Ветров',plannedDate:'2026-11-20',done:7,total:10},
  {id:'DEP-02',client:'Библиотека «Орбита»',product:'Каталог изданий',version:'v1.1.0',stage:'setup',owner:'Мария Северова',plannedDate:'2026-11-25',done:3,total:8},
  {id:'DEP-03',client:'Студия «Контур»',product:'Учёт обращений',version:'v1.2.1',stage:'production',owner:'Денис Ларин',plannedDate:'2026-11-05',done:6,total:6}
];
export const startIncidents = [
  {id:'INC-001',title:'Недоступен сервис авторизации',priority:'critical',status:'in_progress',createdAt:ago(2),resolvedAt:null},
  {id:'INC-002',title:'Не формируется сводный отчёт',priority:'high',status:'new',createdAt:ago(10),resolvedAt:null},
  {id:'INC-003',title:'Дублируются уведомления',priority:'medium',status:'new',createdAt:ago(5),resolvedAt:null},
  {id:'INC-004',title:'Смещена подпись в карточке',priority:'low',status:'new',createdAt:ago(18),resolvedAt:null},
  {id:'INC-005',title:'Ошибка загрузки расписания',priority:'high',status:'resolved',createdAt:ago(30),resolvedAt:ago(25)},
  {id:'INC-006',title:'Задержка синхронизации каталога',priority:'medium',status:'resolved',createdAt:ago(60),resolvedAt:ago(30)}
];
export const startRequests = [
  {id:'REQ-001',title:'Исправить повторную отправку формы',type:'corrective',status:'planned',targetVersion:'v1.2.2'},
  {id:'REQ-002',title:'Поддержать новый формат импорта',type:'adaptive',status:'new',targetVersion:'v1.3.0'},
  {id:'REQ-003',title:'Добавить сводку по подразделениям',type:'perfective',status:'planned',targetVersion:'v1.3.0'},
  {id:'REQ-004',title:'Обновить устаревшую библиотеку',type:'preventive',status:'done',targetVersion:'v1.2.1'}
];
export const startReleases = [
  {id:'REL-001',version:'v1.2.0',date:'2026-10-28',level:'minor',changes:['Добавлены фильтры обращений','Расширена карточка заказчика']},
  {id:'REL-002',version:'v1.2.1',date:'2026-11-05',level:'patch',changes:['Исправлена загрузка расписания','Обновлены зависимости']}
];
export function initialData() { return structuredClone({deployments:startDeployments,incidents:startIncidents,requests:startRequests,releases:startReleases}); }
