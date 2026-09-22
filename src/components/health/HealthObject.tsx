"use client";
import Image from "next/image";
import characters from "../../../public/models/characters/catalog.json";
import catalog from "../../../public/models/wolverine/catalog.json";
import AssetPreview from "./AssetPreview";
export default function HealthObject({id,title,description,onOpen,onAction,action,live=false,openLabel="Explore in 3D ↗"}: {id:string;title:string;description:string;onOpen:(id:string)=>void;onAction?:()=>void;action?:string;live?:boolean;openLabel?:string}) {
  const asset=[...catalog,...characters].find(a=>a.id===id) || catalog[0];
  return <section className={`health-object ${live ? "health-object-live" : ""}`}>
    {live ? <AssetPreview asset={asset} compact/> : <button className="object-art" onClick={()=>onOpen(asset.id)} aria-label={`Explore ${asset.title} in 3D`}><Image src={asset.thumbnail} alt="" width={240} height={240} sizes="(max-width: 760px) 120px, 200px"/></button>}
    <div className="object-copy"><h3>{title}</h3><p>{description}</p><div className="object-actions">{onAction && <button className="light-btn" onClick={onAction}>{action}</button>}<button className="quiet-button" onClick={()=>onOpen(asset.id)}>{openLabel}</button></div></div>
  </section>;
}
