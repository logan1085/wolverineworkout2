import {createHmac,timingSafeEqual} from 'node:crypto';
export function verifyPhoton(raw:string,headers:Headers,secret:string,now=Date.now()){
 const timestamp=headers.get('x-spectrum-timestamp')||'';
 const signature=headers.get('x-spectrum-signature')||'';
 if(!secret||!/^\d+$/.test(timestamp)||Math.abs(now/1000-Number(timestamp))>300||!/^v0=[a-f0-9]{64}$/.test(signature))return false;
 const expected=createHmac('sha256',secret).update(`v0:${timestamp}:${raw}`).digest();
 return timingSafeEqual(expected,Buffer.from(signature.slice(3),'hex'));
}
export function photonRejectionReason(payload:unknown,allowed:string[]){
 if(!payload||typeof payload!=='object')return 'invalid-payload';
 const p=payload as {event?:string;space?:{type?:string;platform?:string};message?:{id?:string;direction?:string;platform?:string;sender?:{id?:string};content?:{type?:string;text?:string}}};
 if(p.event!=='messages')return 'unsupported-event';
 if(p.space?.type!=='dm')return 'not-direct-message';
 // The space identifies the provider; some deliveries omit its duplicate on message.
 const isIMessage=(value:unknown)=>typeof value==='string'&&value.toLowerCase()==='imessage';
 if(!isIMessage(p.space.platform))return 'unsupported-space-platform';
 if(p.message?.platform!==undefined&&!isIMessage(p.message.platform))return 'unsupported-message-platform';
 if(p.message?.direction!=='inbound')return 'not-inbound';
 if(typeof p.message.id!=='string'||!p.message.id)return 'missing-message-id';
 if(p.message.content?.type!=='text'||typeof p.message.content.text!=='string')return 'not-text';
 if(!allowed.includes(p.message.sender?.id||''))return 'sender-not-allowed';
 return null;
}
export function acceptedPhotonText(payload:unknown,allowed:string[]){return photonRejectionReason(payload,allowed)===null;}
