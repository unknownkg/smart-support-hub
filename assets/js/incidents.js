import {initUI,store,$,el,names,fillSelect,bindForm,tableRows,rowCells,badge,dateText,change} from './ui.js';
import {getSlaState,settings,resolveIncident} from './core.js';
initUI('incidents');fillSelect($('#priority'),names.priority);fillSelect($('#status-filter'),names.incidentStatus,['all','Все статусы']);
bindForm('incidents',v=>({...v,status:'new',createdAt:new Date().toISOString(),resolvedAt:null}));
function render(){
  const data=store.data.incidents.filter(item=>$('#status-filter').value==='all'||item.status===$('#status-filter').value),body=$('#records');tableRows(body,data,6);$('#record-count').textContent=data.length;
  for(const item of data){
    const title=el('div');title.append(el('span',item.title,'cell-title'),el('span',`Создан: ${dateText(item.createdAt,true)}`,'subtext'));
    const sla=getSlaState(item),slaCell=el('div');slaCell.append(badge(names.sla[sla],sla),el('span',`До ${dateText(new Date(Date.parse(item.createdAt)+settings.slaHours[item.priority]*3600000).toISOString(),true)}`,'subtext'));
    const actions=el('div');
    if(item.status!=='resolved'){
      const resolve=el('button','Решить','button small');resolve.addEventListener('click',()=>change(d=>{const index=d.incidents.findIndex(r=>r.id===item.id);d.incidents[index]=resolveIncident(d.incidents[index]);},'Инцидент решён. Дата и показатели обновлены.'));actions.append(resolve);
      if(item.status==='new'){const start=el('button','В работу','button secondary small');start.style.marginTop='6px';start.addEventListener('click',()=>change(d=>{d.incidents.find(r=>r.id===item.id).status='in_progress';}));actions.append(start);}
    }else actions.append(el('span','Закрыт','hint'));
    rowCells(body,[title,badge(names.priority[item.priority],item.priority),badge(names.incidentStatus[item.status],item.status),slaCell,dateText(item.resolvedAt,true),actions]);
  }
}
$('#status-filter').addEventListener('change',render);window.addEventListener('datachange',render);setInterval(render,60000);render();
