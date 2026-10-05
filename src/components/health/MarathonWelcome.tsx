"use client";
import Image from "next/image";
import {useEffect,useRef,useState} from "react";
import {formatMarathonGoal,parseMarathonGoal,RACE_AIMS,type RaceAim} from "@/lib/health/marathon-goal";

type Props={character:{title:string;thumbnail:string};goal:string;hasPlan:boolean;loading:boolean;disabled:boolean;onSave:(goal:string)=>Promise<void>;onPlan:()=>void};
export default function MarathonWelcome({character,goal,hasPlan,loading,disabled,onSave,onPlan}:Props){
 const [step,setStep]=useState(0),[race,setRace]=useState(""),[aim,setAim]=useState<RaceAim>(RACE_AIMS[0]),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const heading=useRef<HTMLHeadingElement>(null);
 const savedGoal=parseMarathonGoal(goal);
 const configured=!!savedGoal;
 const pending=useRef(false),errorRef=useRef<HTMLParagraphElement>(null);
 function edit(){setRace(savedGoal?.race??"");setAim(savedGoal?.aim??RACE_AIMS[0]);setError("");setStep(1);}
 useEffect(()=>{if(error)errorRef.current?.focus();},[error]);
 useEffect(()=>{if(step)heading.current?.focus();},[step]);
 async function finish(){
  if(disabled||pending.current)return;
  pending.current=true;setSaving(true);setError("");
  try{await onSave(formatMarathonGoal(race,aim));}
  catch{setError("We couldn’t confirm your goal was saved. Your choices are still here. Check your connection and retry, or reload to see the latest saved goal.");return;}
  finally{pending.current=false;setSaving(false);}
  setStep(0);onPlan();
 }
 return <section className="marathon-welcome" aria-label="Your marathon trainer">
  <div className="marathon-promise"><span className="marathon-eyebrow">WOLVERINE · MEET YOUR NEXT CHAPTER</span><h1>Your personal trainer<br/>{" "}for <em>your marathon.</em></h1><p>A race to look forward to. A week you can follow.<br className="desktop-break"/> A little company along the way.</p><div className="marathon-path" aria-label="Your training journey"><span>01 <b>Your goal</b></span><i/><span>02 <b>Your week</b></span><i/><span>03 <b>Your progress</b></span></div></div>
  <div className="marathon-conversation"><div className="marathon-agent"><Image src={character.thumbnail} alt={character.title} width={110} height={110} quality={95} priority/><div><strong>Hi, I’m {character.title}.</strong><span>Your AI running companion</span></div><span className="marathon-agent-mark" aria-hidden="true">✳</span></div>
  {loading?<div className="marathon-saved" role="status"><h2>Getting your week ready.</h2><p>Loading your saved goal and training.</p></div>:step===0&&(configured||hasPlan)?<div className="marathon-saved"><h2>Your next chapter is underway.</h2><p>{goal}</p><button className="marathon-primary" onClick={onPlan} disabled={disabled}>Open my training <span>↗</span></button><button className="marathon-back" onClick={edit} disabled={disabled}>Change my race goal</button></div>:<form aria-busy={saving} onSubmit={e=>{e.preventDefault();if(disabled||pending.current)return;if(step<2){if(race.trim())setStep(2);}else void finish();}}><fieldset disabled={disabled||saving}>
   <div className="marathon-step-label">LET’S START WITH YOU <span>{step<2?"1":"2"} / 2</span></div>
   <h2 ref={heading} tabIndex={-1}>{step<2?"What are you training for?":"What would a good race feel like?"}</h2>
   {step<2?<><label className="marathon-input-label" htmlFor="marathon-race">Your marathon</label><input id="marathon-race" value={race} onChange={e=>setRace(e.target.value)} placeholder="e.g. NYC Marathon" required maxLength={100}/><div className="marathon-suggestions">{["NYC Marathon","My first marathon","Still choosing"].map(name=><button type="button" key={name} aria-pressed={race===name} onClick={()=>setRace(name)}>{name}</button>)}</div><button className="marathon-primary" type="submit" disabled={!race.trim()}>Continue <span>→</span></button>{(configured||hasPlan)&&<button type="button" className="marathon-back" onClick={()=>setStep(0)}>Keep my current goal</button>}</>:<><p className="marathon-answer">{race}</p><div className="marathon-aims" role="group" aria-label="Your race intention">{RACE_AIMS.map(value=><button type="button" key={value} aria-pressed={aim===value} onClick={()=>setAim(value)}>{value}<span aria-hidden="true">{aim===value?"●":"○"}</span></button>)}</div><p className="marathon-save-note">This replaces your profile goal. Next, choose your current running comfort and available days for a four-week starting block.</p><button className="marathon-primary" type="submit">{saving?"Saving…":"Save goal & open training"}<span>→</span></button><button className="marathon-back" type="button" onClick={()=>setStep(1)}>← Back</button></>}
   {error&&<p ref={errorRef} tabIndex={-1} role="alert" className="marathon-error">{error}</p>}
  </fieldset></form>}
  <p className="marathon-footnote">Your pace. Room for rest. One week at a time.</p></div>
 </section>;
}
