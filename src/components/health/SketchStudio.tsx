"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { exampleSketch, validateSketch, Sketch } from "@/lib/health/scene-model";
import "./sketch.css";
const Viewer = dynamic(() => import("./SketchViewer"), { ssr: false, loading: () => <div className="sketch-canvas">Loading 3D viewer…</div> });
const Catalog = dynamic(() => import("./ObjectCatalog"), { ssr: false });
export default function SketchStudio() {
  const [mode, setMode] = useState("catalog");
  return <><div className="sketch-controls"><button type="button" aria-pressed={mode === "catalog"} onClick={() => setMode("catalog")}>Object library</button><button type="button" aria-pressed={mode === "create"} onClick={() => setMode("create")}>Create with AI</button></div><p className="sketch-hint">Download a generated sketch before switching views.</p>{mode === "catalog" ? <Catalog /> : <SketchEditor />}</>;
}
function SketchEditor() {
  const [scene,setScene]=useState(exampleSketch), [prompt,setPrompt]=useState(""), [consent,setConsent]=useState(false), [busy,setBusy]=useState(false), [error,setError]=useState(""), [revise,setRevise]=useState(false);
  const request = useRef<AbortController | null>(null);
  const [previous, setPrevious] = useState<{ scene: Sketch; source: string } | null>(null);
  const [source, setSource] = useState("Example sketch");
  const upload = useRef<HTMLInputElement>(null);
  function replaceScene(next: Sketch, label: string) { setPrevious({ scene, source }); setScene(next); setSource(label); }
  async function restore(file?: File) {
    if (!file || busy) return;
    try {
      if (file.size > 24000) throw new Error("Choose a Wolverine scene JSON file smaller than 24 KB.");
      const next = validateSketch(JSON.parse(await file.text()));
      replaceScene(next, "Imported sketch"); setError("");
    } catch { setError("This file could not be opened. Choose a valid Wolverine scene JSON file under 24 KB. Your current sketch is unchanged."); }
    finally { if (upload.current) upload.current.value = ""; }
  }
  useEffect(() => () => request.current?.abort(),[]);
  async function generate() {
    if(busy || request.current) return;
    const controller=new AbortController(); request.current=controller;
    setBusy(true); setError("");
    try {
      const response=await fetch("/api/health/scene",{method:"POST",headers:{"Content-Type":"application/json"},signal:controller.signal,body:JSON.stringify({prompt,consent,scene:revise ? scene : null})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error || "Could not create this sketch.");
      if (!controller.signal.aborted) { replaceScene(validateSketch(data.scene), "AI-generated sketch"); }
    } catch(e) { if(!controller.signal.aborted) setError(e instanceof Error ? e.message : "Please try again."); }
    finally { if(!controller.signal.aborted) { setBusy(false); request.current = null; } }
  }
  return <section className="sketch-studio"><p className="sketch-eyebrow">{source} · 3D studio</p><h3>{scene.title}</h3><p>{scene.description}</p><Viewer sketch={scene}/><div className="sketch-controls"><button type="button" disabled={busy} onClick={() => upload.current?.click()}>Open scene JSON</button><button type="button" disabled={busy || !previous} onClick={() => { if (previous) { const current = {scene, source}; setScene(previous.scene); setSource(previous.source); setPrevious(current); } }}>Undo / redo last change</button></div><input ref={upload} type="file" accept=".json,application/json" hidden aria-label="Open a Wolverine scene" onChange={e => void restore(e.target.files?.[0])}/><form onSubmit={e => {e.preventDefault(); void generate();}}><label htmlFor="sketch-prompt">What would you like to make?</label><textarea id="sketch-prompt" value={prompt} disabled={busy} maxLength={1500} required rows={3} placeholder="A tiny alpine campsite with a coral tent and three pine trees…" onChange={e => setPrompt(e.target.value)}/><div className="sketch-controls">{["A tiny alpine campsite", "A sculptural lime kettlebell", "A peaceful stack of rounded stones"].map(text => <button type="button" key={text} disabled={busy} onClick={() => setPrompt(text)}>{text}</button>)}</div><label className="sketch-check"><input type="checkbox" checked={revise} disabled={busy} onChange={e => setRevise(e.target.checked)}/>Revise the current object</label><label className="sketch-check"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)}/>Share this description and, when revising, this scene with OpenAI.</label><button className="primary" disabled={busy || !consent || !prompt.trim()}>{busy ? "Creating your sketch…" : revise ? "Update sketch" : "Create sketch"}</button><p role="status" aria-live="polite">{error || (busy ? "This can take up to a minute. You can keep exploring the current object." : "")}</p></form><p className="sketch-hint">Simple shapes, assembled by AI. Sketches stay in this open studio, separate from health memory. Download before closing; reopen your scene JSON later. Complex subjects will be approximated.</p></section>;
}
