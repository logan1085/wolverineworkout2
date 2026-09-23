"use client";
import { useEffect, useState } from "react";
import characters from "../../../public/models/characters/catalog.json";
export { characters };
export function useCharacter(userId?: string) {
  const scope = `wolverine.character.v1:${userId || "device"}`;
  const [saved,setSaved] = useState({scope:"",id:"kai"});
  const [error,setError] = useState("");
  const valid = (id: string | null) => characters.some(c=>c.id===id) ? id! : "kai";
  useEffect(()=>{
    const read=()=>{try {setSaved({scope,id:valid(localStorage.getItem(scope))});setError("");}catch{setSaved({scope,id:"kai"});setError("Browser storage is unavailable. Your choice will last for this visit.");}};
    read();const update=(e:StorageEvent)=>{if(e.key===scope || e.key===null)read();};window.addEventListener("storage",update);return()=>window.removeEventListener("storage",update);
  },[scope]);
  const character=characters.find(c=>c.id===(saved.scope===scope?saved.id:"kai")) || characters[0];
  function choose(id:string) {const next=valid(id);setSaved({scope,id:next});try{localStorage.setItem(scope,next);setError("");}catch{setError("Your choice is active, but could not be saved on this device.");}}
  return {character,choose,error,ready:saved.scope===scope};
}
