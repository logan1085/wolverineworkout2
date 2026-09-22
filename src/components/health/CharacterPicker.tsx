"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import Image from "next/image";
import {characters} from "./useCharacter";
const Viewer = dynamic(() => import("./SketchViewer"), {ssr:false});
const traits: Record<string,string> = {moss:"A little room to grow.",sunny:"Find your bright spot.",pebble:"Steady, at your own pace."};
export default function CharacterPicker({selected,onChoose,disabled,error}: {selected:string;onChoose:(id:string)=>void;disabled:boolean;error:string}) {
  const character=characters.find(c=>c.id===selected) || characters[0];
  const sketch=useMemo(()=>({title:character.title,description:character.description,objects:[]}),[character]);
  return <section className={`companion-picker companion-${character.id}`}>
    <div className="companion-portrait"><div className="companion-heading"><span>YOUR EVERYDAY COMPANION</span><h3>{character.title}</h3><p>{traits[character.id]}</p></div><Viewer sketch={sketch} modelUrl={character.model} downloads={false}/></div>
    <div className="companion-choices" aria-label="Choose companion">{characters.map(c=><button type="button" key={c.id} aria-pressed={selected===c.id} disabled={disabled} onClick={()=>onChoose(c.id)}><Image src={c.thumbnail} alt="" width={160} height={160}/><strong>{c.title}</strong><small>{selected===c.id?"Your companion":"Choose"}</small></button>)}</div>
    <p className="companion-note" role="status">{error || "Yours on this device. The same thoughtful Wolverine, whichever companion you choose."}</p>
  </section>;
}
