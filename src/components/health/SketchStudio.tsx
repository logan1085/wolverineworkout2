"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { exampleSketch, validateSketch } from "@/lib/health/scene-model";
import "./sketch.css";
const Viewer = dynamic(() => import("./SketchViewer"), { ssr: false, loading: () => <div className="sketch-canvas">Loading 3D viewer…</div> });
export default function SketchStudio() {
  const [scene,setScene]=useState(exampleSketch), [prompt,setPrompt]=useState(""), [consent,setConsent]=useState(false), [busy,setBusy]=useState(false), [error,setError]=useState(""), [generated,setGenerated]=useState(false), [revise,setRevise]=useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(),[]);
  async function generate() {
    if(busy) return;
    const controller=new AbortController(); request.current=controller;
    setBusy(true); setError("");
    try {
      const response=await fetch("/api/health/scene",{method:"POST",headers:{"Content-Type":"application/json"},signal:controller.signal,body:JSON.stringify({prompt,consent,scene:revise ? scene : null})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error || "Could not create this sketch.");
      if (!controller.signal.aborted) { setScene(validateSketch(data.scene)); setGenerated(true); }
    } catch(e) { if(!controller.signal.aborted) setError(e instanceof Error ? e.message : "Please try again."); }
    finally { if(!controller.signal.aborted) setBusy(false); }
  }
  return <section className="sketch-studio"><p className="sketch-eyebrow">{generated ? "AI-generated sketch" : "Example sketch"} · 3D studio</p><h3>{scene.title}</h3><p>{scene.description}</p><Viewer sketch={scene}/><form onSubmit={e => {e.preventDefault(); void generate();}}><label htmlFor="sketch-prompt">What would you like to make?</label><textarea id="sketch-prompt" value={prompt} maxLength={1500} required rows={3} placeholder="A tiny alpine campsite with a coral tent and three pine trees…" onChange={e => setPrompt(e.target.value)}/><div className="sketch-controls">{["A tiny alpine campsite", "A sculptural lime kettlebell", "A peaceful stack of rounded stones"].map(text => <button type="button" key={text} disabled={busy} onClick={() => setPrompt(text)}>{text}</button>)}</div><label className="sketch-check"><input type="checkbox" checked={revise} onChange={e => setRevise(e.target.checked)}/>Revise the current object</label><label className="sketch-check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/>Share this description and, when revising, this scene with OpenAI.</label><button className="primary" disabled={busy || !consent || !prompt.trim()}>{busy ? "Creating your sketch…" : revise ? "Update sketch" : "Create sketch"}</button><p role="status" aria-live="polite">{error || (busy ? "This can take up to a minute. You can keep exploring the current object." : "")}</p></form><p className="sketch-hint">Simple shapes, assembled by AI. Sketches stay in this open studio, separate from health memory. Download before closing. Complex subjects will be approximated.</p></section>;
}
