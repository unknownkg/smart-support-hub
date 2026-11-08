import {initUI,store,$,el,names,fillSelect,bindForm,tableRows,rowCells,statusSelect,badge} from './ui.js';
initUI('maintenance');fillSelect($('#type'),names.type);fillSelect($('#status'),names.requestStatus);bindForm('requests');
function render(){const data=store.data.requests,body=$('#records');tableRows(body,data,4);$('#record-count').textContent=data.length;
  for(const item of data)rowCells(body,[el('span',item.title,'cell-title'),badge(names.type[item.type],item.type),statusSelect('requests',item,'status',names.requestStatus),item.targetVersion]);
}
window.addEventListener('datachange',render);render();
