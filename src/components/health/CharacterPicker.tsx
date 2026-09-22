"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import Image from "next/image";
import {characters} from "./useCharacter";
const Viewer = dynamic(() => import("./SketchViewer"), {ssr:false});
export default function CharacterPicker({selected,onChoose,disabled,error}: {selected:string;onChoose:(id:string)=>void;disabled:boolean;error:string}) {
  const character=characters.find(c=>c.id===selected) || characters[0];
  const sketch=useMemo(()=>({title:character.title,description:character.description,objects:[]}),[character]);
  return <section><p>Choose a companion for your daily briefing and Wolverine chat. This changes the character’s appearance, not the health advice.</p><div className="character-options">{characters.map(c=><button type="button" key={c.id} aria-pressed={selected===c.id} disabled={disabled} onClick={()=>onChoose(c.id)}><Image src={c.thumbnail} alt="" width={240} height={240}/><strong>{c.title}</strong><span>{c.description}</span><small>{selected===c.id?"Selected":"Choose character"}</small></button>)}</div><Viewer sketch={sketch} modelUrl={character.model}/><p role="status">{error || "Saved on this device for your current account. This preference is separate from health memory and is not sent to the AI."}</p></section>;
}
