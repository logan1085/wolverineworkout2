"use client";
import {useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import {landmarks,courseSource,mapSource,startSource,finishSource} from '@/lib/course/nyc';
import hotspots from '../../../public/models/nyc-course/hotspots.json';
import './course.css';
export default function CourseExplorer(){
 const [selected,setSelected]=useState(0),[panel,setPanel]=useState<'note'|'list'|'help'|null>(null),[overview,setOverview]=useState(true),[failed,setFailed]=useState(false);
 const [size,setSize]=useState({w:1280,h:800});
 const root=useRef<HTMLElement>(null),closeButton=useRef<HTMLButtonElement>(null),notesButton=useRef<HTMLButtonElement>(null);
 const stop=landmarks[selected];
 const pins=[{x:15,y:75},{x:35,y:75},{x:48,y:65},{x:75,y:50},{x:66,y:43},{x:82,y:38},{x:78,y:20},{x:52,y:19},{x:42,y:29},{x:33,y:40}];
 useEffect(()=>{const el=root.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setSize({w:entry.contentRect.width,h:entry.contentRect.height}));observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>{if(panel)closeButton.current?.focus();},[panel]);
 function choose(i:number){setSelected(i);setOverview(false);setPanel('note');}
 function dismiss(){setPanel(null);notesButton.current?.focus();}
 const mobile=size.w<700;
 const width=overview?Math.min(size.w*1.12,size.h*1.2857):Math.max(size.w,size.h*1.2857)*1.35;
 const height=width/1.2857;
 const point=hotspots[stop.id];
 const targetX=panel==='note'&&!mobile?size.w*.35:size.w*.5;
 const targetY=panel==='note'&&mobile?size.h*.28:size.h*.48;
 const left=overview?(size.w-width)/2:targetX-width*point.x/100;
 const top=overview?(size.h-height)/2:targetY-height*point.y/100;
 return <main ref={root} className="course-world" onKeyDown={e=>{if(e.key==='Escape'){dismiss();}if(e.key==='ArrowRight'&&panel!=='list'&&panel!=='help'){e.preventDefault();choose(Math.min(9,selected+1));}if(e.key==='ArrowLeft'&&panel!=='list'&&panel!=='help'){e.preventDefault();choose(Math.max(0,selected-1));}}}>
 <h1 className="course-sr">Wolverine NYC Marathon course explorer</h1>
 <div className="course-scene" aria-label="Blender-rendered NYC course scene">
 {!failed&&<div className="course-camera" style={{width,height,transform:`translate(${left}px,${top}px)`}}><Image src="/models/nyc-course/nyc-course-schematic.png" alt="Schematic Blender city: five boroughs connected by the marathon route." fill sizes="180vw" priority onError={()=>{setFailed(true);setPanel('list');}}/><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{landmarks.map((p,i)=><line key={p.id} x1={hotspots[p.id].x} y1={hotspots[p.id].y} x2={pins[i].x} y2={pins[i].y} stroke={selected===i?'#985535':'#343e36'} strokeWidth={selected===i?.3:.12}/>)}</svg>{landmarks.map((p,i)=><button key={p.id} className={`course-pin ${selected===i?'selected':''}`} style={{left:`${pins[i].x}%`,top:`${pins[i].y}%`}} aria-label={`${i+1}. ${p.short}, ${p.mile}`} aria-pressed={selected===i} onClick={()=>choose(i)}><span>{String(i+1).padStart(2,'0')}</span><small>{p.short}</small></button>)}</div>}
 </div>
 <header className="course-hud"><div className="course-brand">wolverine<span>NYC · 2026</span></div><div className="course-tools"><button onClick={()=>{setOverview(true);setPanel(null);}} aria-label="Show whole course">Overview</button><button onClick={()=>setPanel('list')}>List</button><button onClick={()=>setPanel('help')} aria-label="Help and official sources">?</button></div></header>
 {overview&&!panel&&<p className="course-invitation">Choose a landmark. Explore the race.</p>}
 {panel&&<section className={`course-overlay ${panel==='note'?'course-note':''}`} aria-label={panel==='note'?'Selected course note':panel==='list'?'Course list':'Help and sources'}><button ref={closeButton} className="course-close" onClick={dismiss} aria-label="Close panel">×</button>{panel==='note'?<><p className="course-kicker">{stop.borough} · {stop.mile}</p><h2>{stop.name}</h2><p>{stop.fact}</p><details><summary>Keep in mind</summary><p>{stop.tip}</p></details><a href={stop.source} target="_blank" rel="noreferrer">NYRR source ↗</a></>:panel==='list'?<><h2>The course</h2>{failed&&<p>The image could not load. All race notes are available here.</p>}<ol>{landmarks.map((p,i)=><li key={p.id}><button onClick={()=>choose(i)} aria-pressed={selected===i}><span>{String(i+1).padStart(2,'0')}</span>{p.short}<small>{p.mile}</small></button></li>)}</ol></>:<><h2>Explore at your pace</h2><p>Select a numbered landmark or use Previous / Next. Arrow keys move along the course. Escape closes this panel. Overview returns to the whole city.</p><p>This is a Blender-rendered image with guided pan and zoom, not a rotatable 3D model. The scene is schematic: streets, heights and distances are simplified.</p><p>Independent companion, not affiliated with NYRR. Facts checked October 18, 2026. Use official guidance for race day.</p><nav aria-label="Official NYRR sources"><a href={mapSource} target="_blank" rel="noreferrer">2026 course map ↗</a><a href={courseSource} target="_blank" rel="noreferrer">Course updates ↗</a><a href={startSource} target="_blank" rel="noreferrer">Start ↗</a><a href={finishSource} target="_blank" rel="noreferrer">Finish ↗</a></nav></>}</section>}
 <nav className="course-travel" aria-label="Navigate the race"><button aria-label="Previous section" disabled={selected===0} onClick={()=>choose(selected-1)}>←</button><button ref={notesButton} className="course-current" onClick={()=>setPanel(panel==='note'?null:'note')} aria-expanded={panel==='note'}><span>{String(selected+1).padStart(2,'0')} / 10 · {stop.mile}</span><strong>{stop.short}</strong></button><button aria-label="Next section" disabled={selected===9} onClick={()=>choose(selected+1)}>→</button></nav>
 <p className="course-disclaimer">Blender scene · schematic, not to scale</p>
 </main>;
}
