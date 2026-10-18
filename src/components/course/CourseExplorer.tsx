"use client";
import {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {landmarks,courseSource,mapSource,startSource,finishSource} from '@/lib/course/nyc';
import hotspots from '../../../public/models/nyc-course/hotspots.json';
import './course.css';
export default function CourseExplorer(){
 const [selected,setSelected]=useState(0),[list,setList]=useState(false),[failed,setFailed]=useState(false);
 const stop=landmarks[selected];
 const pins=[{x:15,y:75},{x:35,y:75},{x:48,y:65},{x:75,y:50},{x:66,y:43},{x:82,y:38},{x:78,y:20},{x:52,y:19},{x:42,y:29},{x:33,y:40}];
 function choose(i:number){setSelected(i);}
 return <main className="nyc-explorer">
 <header className="nyc-top"><Link href="/" aria-label="Wolverine course home">wolverine<span>NYC / COURSE NOTES</span></Link><a href={mapSource} target="_blank" rel="noreferrer">Official 2026 map ↗</a></header>
 <section className="nyc-intro"><div><p className="nyc-eyebrow">FIVE BOROUGHS. ONE FINISH LINE.</p><h1>Meet the course.<br/><em>Before race morning.</em></h1></div><div><p>A little city. A very big day. Click your way from Staten Island to Central Park and learn the landmarks that shape the NYC Marathon.</p><span className="nyc-label">26.2 MILES · 10 COURSE NOTES · 2026</span></div></section>
 <div className="nyc-workspace">
 <section className="nyc-map-panel" aria-label="Interactive course schematic">
 <div className="nyc-map-tools"><span>BLENDER-RENDERED COURSE SCHEMATIC</span><button onClick={()=>setList(!list)} aria-pressed={list}>{list?'Show illustrated map':'Use list view'}</button></div>
 <p className="nyc-map-note">Stylized borough sequence, not to scale. Streets, bridge heights and distances are simplified. Use NYRR’s map for navigation.</p>
 {!list&&!failed?<div className="nyc-map"><Image src="/models/nyc-course/nyc-course-schematic.png" alt="Blender-rendered schematic city islands and a terracotta course from Staten Island through Brooklyn, Queens, the Bronx and Manhattan to Central Park. Numbered buttons open course notes." width={1800} height={1400} sizes="(max-width: 900px) 100vw, 66vw" priority onError={()=>setFailed(true)}/>{<svg className="nyc-leaders" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{landmarks.map((p,i)=><line key={p.id} x1={hotspots[p.id].x} y1={hotspots[p.id].y} x2={pins[i].x} y2={pins[i].y} stroke={selected===i?"#985535":"#343e36"} strokeWidth={selected===i?.45:.2}/>)}</svg>}{landmarks.map((p,i)=>{const pos=pins[i];return <button key={p.id} className={`nyc-pin ${selected===i?'active':''}`} style={{left:`${pos.x}%`,top:`${pos.y}%`}} aria-label={`${i+1}. ${p.short}, ${p.mile}`} aria-pressed={selected===i} onClick={()=>choose(i)}>{String(i+1).padStart(2,'0')}</button>;})}<div className="nyc-map-caption">An original Blender diorama · click a numbered stop</div></div>:<div className="nyc-list"><p>{failed?'The illustration could not load. Every course note is available below.':'The same route, in reading order.'}</p>{landmarks.map((p,i)=><button key={p.id} onClick={()=>choose(i)} aria-pressed={selected===i}><span>{String(i+1).padStart(2,'0')}</span><strong>{p.short}</strong><small>{p.mile}</small></button>)}</div>}
 <nav className="nyc-stop-strip" aria-label="Course sections">{landmarks.map((p,i)=><button key={p.id} onClick={()=>choose(i)} aria-pressed={selected===i}><span>{String(i+1).padStart(2,'0')}</span>{p.short}</button>)}</nav>
 </section>
 <aside className="nyc-detail" aria-label="Selected course note"><div aria-live="polite" aria-atomic="true"><p className="nyc-eyebrow">{stop.borough}</p><div className="nyc-mile">{stop.mile}</div><h2>{stop.name}</h2><span className="nyc-tag">{stop.kind}</span><p>{stop.fact}</p><div className="nyc-note"><h3>Keep in mind</h3><p>{stop.tip}</p></div><a className="nyc-source" href={stop.source} target="_blank" rel="noreferrer">Read the NYRR source ↗</a></div><div className="nyc-detail-nav"><button onClick={()=>choose(selected-1)} disabled={selected===0}>← Previous</button><span>{selected+1} / {landmarks.length}</span><button onClick={()=>choose(selected+1)} disabled={selected===landmarks.length-1}>Next →</button></div></aside>
 </div>
 <section className="nyc-before"><div><p className="nyc-eyebrow">BEFORE YOU GO</p><h2>The map is only part of race day.</h2></div><a href={startSource} target="_blank" rel="noreferrer"><strong>Your start ↗</strong><span>Confirm your bib’s wave, color, corral and transport instructions.</span></a><a href={courseSource} target="_blank" rel="noreferrer"><strong>On the course ↗</strong><span>Check official fluid, fuel, medical and course updates.</span></a><a href={finishSource} target="_blank" rel="noreferrer"><strong>After the finish ↗</strong><span>Plan your exit and reunion using the official finish map.</span></a></section>
 <footer className="nyc-footer"><p>Independent course companion, not affiliated with NYRR. Facts checked against NYRR’s 2026 course map and race-day pages on October 18, 2026. Mile labels are approximate section guides. General preparation cues are not official station locations.</p><p>No sign-in. No activity tracking. Just the course.</p></footer>
 </main>;
}
