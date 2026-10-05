"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { releaseVoice, type VoiceResources } from "@/lib/health/voice-client";

type Phase="idle"|"connecting"|"listening"|"speaking"|"ended";
export default function RunWelcome({unavailable,character,onText,onLog,onPlan,onCharacter,onAccount}:{unavailable?:string;character:{title:string;thumbnail:string};onText:()=>void;onLog:()=>void;onPlan:()=>void;onCharacter:()=>void;onAccount:()=>void}){
  const [phase,setPhase]=useState<Phase>("idle"),[error,setError]=useState(""),[caption,setCaption]=useState(""),[muted,setMuted]=useState(false),[audioBlocked,setAudioBlocked]=useState(false);
  const [needsAccount,setNeedsAccount]=useState(false);
  const resources=useRef<VoiceResources>({});
  const epoch=useRef(0),starting=useRef(false);
  const cleanup=useCallback(()=>{epoch.current++;starting.current=false;const r=resources.current;resources.current={};releaseVoice(r);},[]);
  const stop=useCallback(()=>{cleanup();setPhase("ended");setMuted(false);setAudioBlocked(false);},[cleanup]);
  useEffect(()=>{const hide=()=>{if(document.hidden&&starting.current)stop();};window.addEventListener("pagehide",stop);document.addEventListener("visibilitychange",hide);return()=>{window.removeEventListener("pagehide",stop);document.removeEventListener("visibilitychange",hide);cleanup();};},[cleanup,stop]);
  async function start(){
    if(starting.current||unavailable)return;
    cleanup();const version=epoch.current;starting.current=true;setAudioBlocked(false);setNeedsAccount(false);setError("");setCaption("");setMuted(false);setPhase("connecting");
    const live=()=>epoch.current===version;
    const fail=(message:string)=>{if(!live())return;cleanup();setPhase("idle");setError(message);};
    try{
      if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection)throw new Error("Voice is not supported in this browser. Try Safari or Chrome, or use text.");
      const abort=new AbortController();resources.current.abort=abort;
      resources.current.connectTimer=setTimeout(()=>fail("The connection timed out. Check microphone permission and try again."),30000);
      const response=await fetch("/api/health/voice",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({consent:true}),signal:abort.signal});
      const result=await response.json();if(!live())return;if(!response.ok){setNeedsAccount(response.status===401);throw new Error(result.error||"Voice could not connect.");}
      const mic=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
      if(!live()){mic.getTracks().forEach(t=>t.stop());return;}resources.current.mic=mic;
      const pc=new RTCPeerConnection();resources.current.pc=pc;
      const audio=new Audio();audio.autoplay=true;resources.current.audio=audio;
      pc.ontrack=e=>{if(live()){audio.srcObject=e.streams[0];void audio.play().catch(()=>{if(live())setAudioBlocked(true);});}};
      mic.getTracks().forEach(t=>pc.addTrack(t,mic));
      pc.onconnectionstatechange=()=>{if(live()&&["failed","disconnected","closed"].includes(pc.connectionState))fail("The voice connection ended. You can start again or use text.");};
      const channel=pc.createDataChannel("oai-events");
      channel.onopen=()=>{if(!live())return;if(resources.current.connectTimer)clearTimeout(resources.current.connectTimer);setPhase("listening");resources.current.timer=setTimeout(()=>{if(live()){stop();setCaption("Check-in ended after three minutes. You can start another whenever you like.");}},180000);channel.send(JSON.stringify({type:"response.create",response:{instructions:'Open this check-in by asking exactly: "Did you run today?" Then wait for the answer.'}}));};
      let transcript="";
      channel.onmessage=e=>{if(!live())return;try{const event=JSON.parse(e.data);if(event.type==="response.created")transcript="";if(event.type==="response.output_audio_transcript.delta"&&typeof event.delta==="string"){transcript=(transcript+event.delta).slice(-2000);setCaption(transcript);}if(event.type==="output_audio_buffer.started")setPhase("speaking");if(event.type==="output_audio_buffer.stopped"||event.type==="input_audio_buffer.speech_started")setPhase("listening");if(event.type==="error")fail("The voice agent hit a problem. Please start again or use text.");}catch{/* Ignore non-JSON transport messages. */}};
      const offer=await pc.createOffer();await pc.setLocalDescription(offer);if(!live())return;
      const sdp=await fetch("https://api.openai.com/v1/realtime/calls",{method:"POST",headers:{Authorization:`Bearer ${result.value}`,"Content-Type":"application/sdp"},body:offer.sdp,signal:abort.signal});
      if(!live())return;if(!sdp.ok)throw new Error("The voice connection was declined. Please try again.");
      await pc.setRemoteDescription({type:"answer",sdp:await sdp.text()});
    }catch(e){const denied=e instanceof DOMException&&e.name==="NotAllowedError";fail(denied?"Microphone access was declined. Allow it in your browser settings, or use text.":e instanceof Error?e.message:"Voice could not start.");}
  }
  const active=phase==="connecting"||phase==="listening"||phase==="speaking";
  return <section className={`run-welcome voice-${phase}`} aria-label="Daily running check-in">
    <div className="run-welcome-copy"><span className="run-kicker"><i/> CHECK IN WITH PIP</span><h2>Did you run today?</h2><p className="run-welcome-subtitle">A quick catch-up. A better next step.</p>
      <div className="run-voice-actions">{!active?<button className="run-talk" disabled={!!unavailable} onClick={()=>void start()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/></svg>{phase==="ended"?"Talk again":"Start voice check-in"}<span aria-hidden="true">↗</span></button>:<><div className="run-call-state" role="status"><span className="voice-bars" aria-hidden="true"><i/><i/><i/><i/><i/></span>{phase==="connecting"?"Connecting…":muted?"Microphone muted":phase==="speaking"?"Pip is speaking":"Listening to you"}</div><div className="run-call-controls"><button className="run-end" onClick={stop}>{phase==="connecting"?"Cancel":"End check-in"}</button>{phase!=="connecting"&&<button className="run-mute" aria-pressed={muted} onClick={()=>{resources.current.mic?.getAudioTracks().forEach(t=>{t.enabled=muted;});setMuted(!muted);}}>{muted?"Unmute":"Mute"}</button>}</div></>}
      {!active&&unavailable&&<div role="status"><p className="run-voice-error">{unavailable}</p><button className="run-text-link" onClick={onAccount}>Connection status →</button></div>}
      {audioBlocked&&<button className="run-text-link" onClick={()=>void resources.current.audio?.play().then(()=>setAudioBlocked(false)).catch(()=>setError("Audio playback is blocked. Check your browser sound settings."))}>Tap to hear Pip</button>}
      {error&&<p className="run-voice-error" role="alert">{error}</p>}{needsAccount&&<button className="run-text-link" onClick={()=>{stop();onAccount();}}>Open sign-in →</button>}
      {caption&&<p className="run-caption" aria-live="polite">{caption}</p>}
      {!active&&<p className="run-voice-privacy">AI voice · Starting shares your microphone audio with OpenAI. Wolverine doesn’t save this call or change your plan.</p>}
      <button className="run-text-link" onClick={()=>{stop();onText();}}>I’d rather type <span aria-hidden="true">→</span></button></div>
    </div>
    <button className="run-companion" aria-label="Choose your companion" onClick={onCharacter} disabled={active}><span className="run-orbit"/><Image src={character.thumbnail} alt={character.title} width={1024} height={1024} quality={95} sizes="(max-width:760px) 210px, 400px" priority/><span className="run-companion-label">{character.title} <i/> IN YOUR CORNER</span></button>
    <div className="run-welcome-footer"><button onClick={()=>{stop();onPlan();}}>View my training <span aria-hidden="true">↗</span></button><button onClick={()=>{stop();onLog();}}>Log a run <span aria-hidden="true">＋</span></button></div>
  </section>;
}
