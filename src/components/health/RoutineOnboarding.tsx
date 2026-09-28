"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { HealthProfile, RoutineGoal, dayKey } from "@/lib/health/model";
import { characters } from "./useCharacter";
const goals=[{id:"movement" as const,title:"Move more often",detail:"Find a rhythm that fits your energy."},{id:"rest" as const,title:"Make room for rest",detail:"Build a calmer end to your day."},{id:"reflection" as const,title:"Understand myself",detail:"Notice patterns in sleep and mood."}];
export default function RoutineOnboarding({profile,characterId,busy,onSave}: {profile:HealthProfile;characterId:string;busy:boolean;onSave:(profile:HealthProfile,characterId:string)=>Promise<void>}) {
  const [step,setStep]=useState(0),[name,setName]=useState(profile.name),[selected,setSelected]=useState<RoutineGoal[]>(profile.routine?.goals || ["reflection"]),[minutes,setMinutes]=useState(profile.minutes),[pace,setPace]=useState<"gentle"|"steady">(profile.routine?.pace || "gentle"),[character,setCharacter]=useState(characterId);
  const [error,setError]=useState("");
  const heading=useRef<HTMLHeadingElement>(null);
  const initialStep=useRef(true);
  useEffect(()=>{if(initialStep.current){initialStep.current=false;return;}heading.current?.focus();},[step]);
  const timeOptions=[...new Set([5,10,20,30,profile.minutes])].sort((a,b)=>a-b);
  return <form className="routine-onboarding" onSubmit={async e=>{e.preventDefault();if(busy || !selected.length)return;if(step<2){setStep(step+1);return;}setError("");try{await onSave({...profile,name:name.trim(),minutes,routine:{goals:selected,pace,startedAt:profile.routine?.startedAt || dayKey()}},character);}catch(e){setError(e instanceof Error ? e.message : "Could not save your routine. Try again.");}}}>
    <fieldset className="onboarding-fields" disabled={busy}>
    <p className="eyebrow">YOUR ROUTINE · {step+1} OF 3</p><div className="onboarding-progress" aria-hidden="true">{[0,1,2].map(i=><i key={i} className={i<=step?"active":""}/>)}</div>
    {step===0 && <><h3 ref={heading} tabIndex={-1}>What brings you here?</h3><p>Pick the things you want a little more of. You can change these anytime.</p><label>Your name <span>(optional)</span><input value={name} onChange={e=>setName(e.target.value)} maxLength={60} autoComplete="given-name"/></label><div className="routine-options">{goals.map(g=><button type="button" key={g.id} aria-pressed={selected.includes(g.id)} onClick={()=>setSelected(selected.includes(g.id)?selected.filter(x=>x!==g.id):[...selected,g.id])}><strong>{g.title}</strong><small>{g.detail}</small><span aria-hidden="true">{selected.includes(g.id)?"✓":"+"}</span></button>)}</div></>}
    {step===1 && <><h3 ref={heading} tabIndex={-1}>Start at your pace.</h3><p>A small routine you can return to, even on a busy day.</p><fieldset><legend>How much time can you make?</legend><div className="routine-chips">{timeOptions.map(n=><button type="button" key={n} aria-pressed={minutes===n} onClick={()=>setMinutes(n)}>{n} min</button>)}</div></fieldset><fieldset><legend>Your starting pace</legend><div className="routine-options">{(["gentle","steady"] as const).map(p=><button key={p} type="button" aria-pressed={pace===p} onClick={()=>setPace(p)}><strong>{p==="gentle"?"Keep it gentle":"Build a steady rhythm"}</strong><small>{p==="gentle"?"Small steps, with room for rest.":"A little more structure each day."}</small></button>)}</div></fieldset></>}
    {step===2 && <><h3 ref={heading} tabIndex={-1}>A little company, every day.</h3><div className="onboarding-companions">{characters.map(c=><button type="button" key={c.id} aria-pressed={character===c.id} onClick={()=>setCharacter(c.id)}><Image src={c.thumbnail} alt="" width={240} height={240} quality={95}/><strong>{c.title}</strong></button>)}</div><p>{selected.length} daily {selected.length===1?"step":"steps"} for {selected.map(id=>({movement:"movement",rest:"rest",reflection:"reflection"}[id])).join(", ")}.</p><p className="routine-explanation">Complete a step, check in or log movement to earn a day in your streak. Rest counts. Miss a day? Start again when you’re ready.</p></>}
    {error && <p role="alert">{error}</p>}<div className="onboarding-actions">{step>0 && <button className="secondary" type="button" disabled={busy} onClick={()=>setStep(step-1)}>Back</button>}<button className="primary" disabled={busy || !selected.length}>{busy?"Saving…":step===2?"Start my routine":"Continue"}</button></div>
    </fieldset>
  </form>;
}
