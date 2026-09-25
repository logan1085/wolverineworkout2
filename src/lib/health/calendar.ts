import type { HealthState } from "./model";
export function calendarMonth(year:number, month:number) {
  const first=new Date(year,month,1,12);
  const last=new Date(year,month+1,0,12);
  const offset=(first.getDay()+6)%7;
  return Array.from({length:Math.ceil((offset+last.getDate())/7)*7},(_,i)=>{
    const day=i-offset+1;
    if(day<1 || day>last.getDate()) return null;
    return `${first.getFullYear()}-${String(first.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  });
}
export function calendarDay(state:HealthState,date:string) {
  const check=state.checkIns.find(c=>c.date===date);
  const metric=state.metrics.find(m=>m.date===date);
  const activities=state.activities.filter(a=>a.date===date);
  const completed=state.completed.filter(key=>key.startsWith(date+":"));
  return {check,metric,activities,completed,hasRecord:!!check || !!metric || activities.length>0 || completed.length>0};
}
