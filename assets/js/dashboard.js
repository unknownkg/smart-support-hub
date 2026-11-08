import {initUI,store,$,el,badge,tableRows,rowCells,names,dateText} from './ui.js';
import {getMetrics,getSlaState} from './core.js';
import {renderCharts} from './charts.js';
initUI('index');
function render(){const m=getMetrics(store.data);$('#kpi-active').textContent=m.active;$('#kpi-open').textContent=m.open;$('#kpi-sla').textContent=m.resolved?`${m.sla}%`:'Нет данных';$('#kpi-version').textContent=m.version;$('#sla-note').textContent=m.resolved?`Среди решённых: ${m.resolved}`:'Нет решённых; расчётные 100% условны.';
  const data=[...store.data.incidents].filter(item=>item.status!=='resolved').sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,5),body=$('#records');tableRows(body,data,4);$('#record-count').textContent=data.length;
  for(const item of data){const title=el('div');title.append(el('span',item.title,'cell-title'),el('span',dateText(item.createdAt,true),'subtext'));const sla=getSlaState(item);rowCells(body,[title,badge(names.priority[item.priority],item.priority),badge(names.incidentStatus[item.status],item.status),badge(names.sla[sla],sla)]);}
  renderCharts(store.data);
}
window.addEventListener('datachange',render);window.addEventListener('themechange',()=>renderCharts(store.data));window.addEventListener('load',()=>renderCharts(store.data));setInterval(render,60000);render();
matchMedia('(max-width:480px)').addEventListener('change',()=>renderCharts(store.data));
document.fonts.ready.then(()=>renderCharts(store.data));
