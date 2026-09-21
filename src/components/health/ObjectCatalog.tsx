"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import catalog from "../../../public/models/wolverine/catalog.json";
const Viewer = dynamic(() => import("./SketchViewer"), { ssr:false, loading: () => <p>Loading viewer…</p> });
export default function ObjectCatalog() {
  const [selected,setSelected] = useState(catalog[0]);
  const [category,setCategory] = useState("All");
  const sketch=useMemo(() => ({title:selected.title,description:selected.description,objects:[]}),[selected]);
  return <section className="object-catalog" aria-label="Blender object catalog">
    <p className="sketch-eyebrow">THE WOLVERINE COLLECTION</p><h3>Small objects. Daily rituals.</h3>
    <p>Six original Blender-made objects. Pick one to explore in 3D. No AI request or account needed.</p>
    <div className="sketch-controls" aria-label="Filter objects">{["All","Movement","Daily rituals","Recovery","Rest"].map(c => <button key={c} type="button" aria-pressed={category===c} onClick={() => setCategory(c)}>{c}</button>)}</div>
    <div className="catalog-grid">{catalog.filter(a => category==="All" || a.category===category).map(asset => <button type="button" key={asset.id} className="catalog-card" aria-pressed={selected.id===asset.id} onClick={() => setSelected(asset)}><Image src={asset.thumbnail} alt="" width={200} height={200} sizes="(max-width: 600px) 40vw, 200px"/><strong>{asset.title}</strong><small>{asset.category}</small></button>)}</div>
    <div className="catalog-selected" aria-live="polite"><h3>{selected.title}</h3><p>{selected.description}</p></div>
    <Viewer key={selected.id} sketch={sketch} modelUrl={selected.model}/>
    <p><a href={selected.model} download={`${selected.id}.glb`}>Download original GLB</a></p>
    <p className="sketch-hint">{Math.ceil(selected.bytes/1024)} KB model · Original Wolverine asset · Editable Blender sources in the repository. Catalog models can be viewed and exported; AI editing applies to sketches in Create.</p>
  </section>;
}
