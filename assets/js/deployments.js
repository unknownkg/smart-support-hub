import {initUI,store,$,el,names,fillSelect,bindForm,tableRows,rowCells,statusSelect,dateText,change} from './ui.js';
initUI('deployments'); fillSelect($('#stage'),names.stage);
bindForm('deployments',v => ({...v,done:Number(v.done),total:Number(v.total)}));
function render() {
  const data=store.data.deployments, body=$('#records'); tableRows(body,data,6);$('#record-count').textContent=data.length;
  for(const item of data) {
    const title=el('div');title.append(el('span',item.client,'cell-title'),el('span',item.product,'subtext'));
    const progress=el('div',undefined,'progress-line'); const bar=el('progress');bar.max=item.total;bar.value=item.done;bar.setAttribute('aria-label',`Готовность ${item.client}`);progress.append(bar,el('span',`${Math.round(item.done/item.total*100)}%`));
    const action=el('button','+ задача','button secondary small');action.disabled=item.done===item.total;action.setAttribute('aria-label',`Завершить задачу: ${item.client}`);action.addEventListener('click',()=>change(d=>{d.deployments.find(r=>r.id===item.id).done+=1;}));progress.append(action);
    rowCells(body,[title,item.version,statusSelect('deployments',item,'stage',names.stage),progress,item.owner,dateText(item.plannedDate)]);
  }
}
window.addEventListener('datachange',render);render();
