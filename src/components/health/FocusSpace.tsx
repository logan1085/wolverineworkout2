"use client";
import { useState } from "react";
import catalog from "../../../public/models/wolverine/catalog.json";
import AssetPreview from "./AssetPreview";
const spaces = {
  movement: {label:"Movement", object:"kettlebell", title:"Make room to move.", description:"A plan that fits your energy and the time you have.", action:"Find my next step", prompt:"Help me choose one manageable movement session. Ask about my energy and available time if you don't know them. Keep the plan focused."},
  rest: {label:"Rest", object:"moon", title:"Let the day settle.", description:"A little less to do. A little more space to recover.", action:"Plan a gentler evening", prompt:"Help me make a simple evening wind-down plan based on my recent sleep and energy. Ask what you need to know. Keep it to one next step."},
  reflection: {label:"Reflection", object:"balance-stones", title:"Come back to yourself.", description:"Notice what feels different. Leave a little note for tomorrow.", action:"Take a moment", prompt:"Guide me through a short reflection, one question at a time. Start by asking how today felt."},
};
export type FocusKind = keyof typeof spaces;
export default function FocusSpace({kind,onAsk}: {kind?:FocusKind;onAsk:(prompt:string)=>void}) {
  const [selected,setSelected]=useState<FocusKind>(kind || "movement");
  const focus=spaces[kind || selected];
  const asset=catalog.find(a=>a.id===focus.object)!;
  return <section className="focus-space" aria-label={kind ? `${focus.label} focus` : "Your focus space"}>
    <div className="focus-space-heading"><span className="eyebrow">A LITTLE SPACE FOR YOU</span>{!kind && <div className="focus-switch" aria-label="Choose your focus">{(Object.keys(spaces) as FocusKind[]).map(key=><button key={key} type="button" aria-pressed={selected===key} onClick={()=>setSelected(key)}>{spaces[key].label}</button>)}</div>}</div>
    <div className="focus-space-body"><div className="focus-art"><AssetPreview key={asset.id} asset={asset}/></div><div className="focus-copy"><span className="eyebrow">{focus.label}</span><h2>{focus.title}</h2><p>{focus.description}</p><button className="primary" onClick={()=>onAsk(focus.prompt)}>{focus.action} <span aria-hidden="true">↗</span></button></div></div>
  </section>;
}
