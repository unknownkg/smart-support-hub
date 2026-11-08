import {initUI,store,$,el,names,fillSelect,bindForm,dateText,badge,localDateValue} from './ui.js';
import {getNextVersion,latestVersion} from './core.js';
initUI('releases');fillSelect($('#level'),names.level);fillSelect($('#next-level'),names.level);
bindForm('releases',v=>({...v,changes:v.changes.split('\n').map(s=>s.trim()).filter(Boolean)}));
function calculate(){try{$('#next-version').textContent=getNextVersion($('#current-version').value.trim(),$('#next-level').value);$('#version-error').textContent='';}catch(error){$('#next-version').textContent='—';$('#version-error').textContent=error.message;}}
$('#current-version').addEventListener('input',calculate);$('#next-level').addEventListener('change',calculate);
$('#use-version').addEventListener('click',()=>{calculate();if($('#next-version').textContent!=='—'){$('#version').value=$('#next-version').textContent;$('#level').value=$('#next-level').value;$('#version').focus();}});
function render(){const list=$('#release-list');list.replaceChildren();$('#record-count').textContent=store.data.releases.length;
  if(!store.data.releases.length)list.append(el('p','Релизов пока нет. Добавьте первую версию.','empty'));
  for(const item of [...store.data.releases].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))){const card=el('article',undefined,'release-card'),head=el('div',undefined,'release-title');head.append(el('h2',item.version),badge(names.level[item.level],item.level),el('span',dateText(item.date),'hint'));const changes=el('ul');item.changes.forEach(text=>changes.append(el('li',text)));card.append(head,changes);list.append(card);}
}
function syncVersion(){
  const latest=latestVersion(store.data.releases);
  $('#current-version').value=latest==='—'?'v0.0.0':latest;
  calculate();
}
$('#date').defaultValue=localDateValue();
window.addEventListener('datachange',()=>{render();syncVersion();});render();syncVersion();
