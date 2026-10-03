import {verifyPhoton,acceptedPhotonText} from '@/lib/photon/ingress';
import {after} from 'next/server';
import {photonBot,photonConfigured} from '@/lib/photon/bot';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request){
 if(!photonConfigured())return new Response('Messaging is not configured',{status:503});
 // Bound the raw body before the adapter verifies its signature.
 const reader=request.body?.getReader();if(!reader)return new Response('Body required',{status:400});
 const chunks:Uint8Array[]=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();return new Response('Payload too large',{status:413});}chunks.push(value);}
 const body=Buffer.concat(chunks);
 const raw=body.toString('utf8');
 if(!verifyPhoton(raw,request.headers,process.env.IMESSAGE_WEBHOOK_SECRET!))return new Response('Unauthorized',{status:401});
 let payload;try{payload=JSON.parse(raw);}catch{return new Response('Invalid JSON',{status:400});}
 if(!acceptedPhotonText(payload,(process.env.PHOTON_ALLOWED_SENDERS||'').split(',').map(s=>s.trim()).filter(Boolean)))return new Response(null,{status:204});
 return photonBot().webhooks.imessage(new Request(request.url,{method:'POST',headers:request.headers,body}),{waitUntil:task=>after(()=>task)});
}
