import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError, boundedJson, healthIdentity, noStore, sameOrigin } from "@/lib/health/server";
import { runVoiceConfig, validVoiceConsent } from "@/lib/health/voice";
const issued=new Map<string,number>();
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return apiError("Request origin is not allowed.",403);
  const identity=await healthIdentity(request);
  if(!identity)return apiError("Sign in to start a voice check-in. You can still log your run without voice.",401);
  if(!process.env.OPENAI_API_KEY)return apiError("Voice is not configured yet. You can still type or log a run.",503);
  try{
    if(!validVoiceConsent(await boundedJson(request,2048)))return apiError("Confirm sharing your microphone audio with OpenAI.");
    const now=Date.now();for(const [id,time]of issued)if(now-time>60000)issued.delete(id);
    if(issued.has(identity.id)&&now-issued.get(identity.id)!<10000)return apiError("Please wait a few seconds before starting another call.",429);
    if(issued.size>=2000)return apiError("Voice is busy. Try again shortly.",503);
    issued.set(identity.id,now);
    const response=await fetch("https://api.openai.com/v1/realtime/client_secrets",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json","OpenAI-Safety-Identifier":createHash("sha256").update(identity.id).digest("hex")},body:JSON.stringify({session:runVoiceConfig()}),signal:AbortSignal.timeout(15000)});
    if(!response.ok)return apiError("Voice could not connect. Please try again or use text.",502);
    const result=await response.json();
    if(typeof result.value!=="string")return apiError("Voice did not return a session. Please try again.",502);
    return NextResponse.json({value:result.value},{headers:noStore});
  }catch{return apiError("Voice could not start. Please try again or use text.",502);}
}
