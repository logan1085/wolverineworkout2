import {createHmac,timingSafeEqual} from 'node:crypto';
export function verifyPhoton(raw:string,headers:Headers,secret:string,now=Date.now()){
 const timestamp=headers.get('x-spectrum-timestamp')||'';
 const signature=headers.get('x-spectrum-signature')||'';
 if(!secret||!/^\d+$/.test(timestamp)||Math.abs(now/1000-Number(timestamp))>300||!/^v0=[a-f0-9]{64}$/.test(signature))return false;
 const expected=createHmac('sha256',secret).update(`v0:${timestamp}:${raw}`).digest();
 return timingSafeEqual(expected,Buffer.from(signature.slice(3),'hex'));
}
export function acceptedPhotonText(payload:unknown,allowed:string[]){
 if(!payload||typeof payload!=='object')return false;
 const p=payload as {event?:string;space?:{type?:string;platform?:string};message?:{id?:string;direction?:string;platform?:string;sender?:{id?:string};content?:{type?:string;text?:string}}};
 return p.event==='messages'&&p.space?.type==='dm'&&p.space.platform==='iMessage'&&p.message?.direction==='inbound'&&p.message.platform==='iMessage'&&typeof p.message.id==='string'&&p.message.id.length>0&&p.message.content?.type==='text'&&typeof p.message.content.text==='string'&&allowed.includes(p.message.sender?.id||'');
}
