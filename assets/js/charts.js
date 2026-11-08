import {names} from './core.js';
let charts=[];
export function renderCharts(data){
  const available=typeof window.Chart==='function';
  document.querySelectorAll('.chart-error').forEach(node=>node.hidden=available);
  if(!available)return;
  charts.forEach(chart=>chart.destroy());charts=[];
  const css=getComputedStyle(document.documentElement),text=css.getPropertyValue('--muted').trim(),border=css.getPropertyValue('--soft').trim();
  const font = {size:14, family:css.getPropertyValue('--font-ui').trim()};
  const color = name => css.getPropertyValue(name).trim();
  const narrow = matchMedia('(max-width:480px)').matches;
  const config=[['priority-chart','bar',names.priority,data.incidents,'priority',[1,2,3,4].map(i=>color(`--chart-${i}`))],['request-chart','doughnut',names.type,data.requests,'type',[1,2,3,4].map(i=>color(`--request-${i}`))]];
  for(const [id,type,labels,items,key,colors] of config){
    const counts=Object.keys(labels).map(value=>items.filter(item=>item[key]===value).length);
    const summary=document.querySelector(`#${id}-summary`);
    summary.replaceChildren();
    Object.values(labels).forEach((name,i)=>{
      const item=document.createElement('span');item.className='chart-legend-item';item.style.setProperty('--series-color',colors[i]);
      const label=document.createElement('span');label.textContent=name;
      const value=document.createElement('b');value.textContent=counts[i];
      item.append(label,value);summary.append(item);
    });
    const countAxis={beginAtZero:true,ticks:{stepSize:1,color:text,precision:0,font},grid:{color:border},border:{display:false}};
    const labelAxis={grid:{display:false},ticks:{color:text,font},border:{display:false}};
    charts.push(new window.Chart(document.getElementById(id),{
      type,data:{labels:Object.values(labels),datasets:[{label:'Количество',data:counts,backgroundColor:colors,borderWidth:0,borderRadius:type==='bar'?6:0,maxBarThickness:42}]},
      options:{responsive:true,maintainAspectRatio:false,indexAxis:type==='bar'&&narrow?'y':'x',animation:false,cutout:type==='doughnut'?'72%':undefined,
        plugins:{legend:{display:false},tooltip:{titleFont:font,bodyFont:font,padding:12}},
        scales:type==='bar'?(narrow?{x:countAxis,y:labelAxis}:{x:labelAxis,y:countAxis}):undefined}
    }));
  }
}
