"use client";
import { useState } from "react";
import { HealthState } from "@/lib/health/model";
import { calendarDay, calendarMonth } from "@/lib/health/calendar";
export default function HomeCalendar({state,today,sample,onCheckIn}: {state:HealthState;today:string;sample:boolean;onCheckIn:()=>void}) {
  const [selected,setSelected]=useState(today);
  const [month,setMonth]=useState(today.slice(0,7));
  const [year,index]=month.split("-").map(Number);
  const date=new Date(year,index-1,1,12);
  const days=calendarMonth(year,index-1);
  const record=calendarDay(state,selected);
  function move(delta:number) {
    const next=new Date(year,index-1+delta,1,12);
    const key=`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,"0")}`;
    setMonth(key);setSelected(key===today.slice(0,7) ? today : key+"-01");
  }
  const longDate=(key:string)=>new Date(key+"T12:00:00").toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"});
  return <section className="home-calendar" aria-label="Your health calendar">
    <div className="calendar-header"><div><span className="eyebrow">YOUR DAYS{sample ? " · SAMPLE" : ""}</span><h2>Your rhythm</h2></div><button className="quiet-button" onClick={()=>{setSelected(today);setMonth(today.slice(0,7));}}>Today</button></div>
    <div className="calendar-layout"><div><div className="calendar-month"><button className="icon-button" aria-label="Previous month" onClick={()=>move(-1)}>‹</button><h3 aria-live="polite">{date.toLocaleDateString(undefined,{month:"long",year:"numeric"})}</h3><button className="icon-button" aria-label="Next month" onClick={()=>move(1)}>›</button></div>
      <div className="calendar-weekdays" aria-hidden="true">{["M","T","W","T","F","S","S"].map((d,i)=><span key={i}>{d}</span>)}</div>
      <div className="calendar-days" role="group" aria-label="Choose a day">{days.map((day,i)=>day ? <button key={day} type="button" aria-pressed={selected===day} aria-current={day===today ? "date" : undefined} aria-label={`${longDate(day)}${day===today ? ", today" : ""}${calendarDay(state,day).hasRecord ? ", records available" : ", no records"}`} onClick={()=>setSelected(day)}><span>{Number(day.slice(-2))}</span><i className={calendarDay(state,day).hasRecord ? "has-record" : ""} aria-hidden="true"/></button> : <span key={`blank-${i}`}/>)}</div>
      <p className="calendar-key"><i/> Recorded check-ins, movement & daily signals</p></div>
      <div className="calendar-agenda" aria-live="polite"><span className="eyebrow">{selected===today ? "TODAY" : "DAY IN VIEW"}</span><h3>{longDate(selected)}</h3>
        {!record.hasRecord && <p>{selected>today ? "A little space for what comes next. No records for this day yet." : "Nothing recorded. Every day doesn’t need a score."}</p>}
        {record.check && <article><strong>Daily check-in</strong><p>{record.check.sleepHours}h sleep · Energy {record.check.energy}/5</p>{record.check.note && <p>{record.check.note}</p>}</article>}
        {record.activities.map(a=><article key={a.id}><strong>{a.name}</strong><p>{a.minutes} min · {a.source==="manual" ? "You logged this" : "Garmin"}</p></article>)}
        {record.metric && <article><strong>Garmin daily signals</strong><p>{[record.metric.steps!==undefined ? `${record.metric.steps.toLocaleString()} steps` : null,record.metric.sleepHours!==undefined ? `${record.metric.sleepHours}h sleep` : null,record.metric.restingHeartRate!==undefined ? `${record.metric.restingHeartRate} bpm resting` : null].filter(Boolean).join(" · ") || "Daily record received"}</p></article>}
        {record.completed.length>0 && <article><strong>{record.completed.length} daily {record.completed.length===1 ? "step" : "steps"} completed</strong></article>}
        {selected===today && <button className="secondary" onClick={onCheckIn}>{record.check ? "Update check-in" : "Check in today"}</button>}
      </div></div>
  </section>;
}
