import {createHash} from 'node:crypto';
import OpenAI from 'openai';
import {Chat, ConsoleLogger} from 'chat';
import {createRedisState} from '@chat-adapter/state-redis';
import {createiMessageAdapter} from '@photon-ai/chat-adapter-imessage';
import {buildHealthPrompt} from '@/lib/health/agent-prompt';
import {handleText,TEXT_TTL,type TextState} from './conversation';

function redisUrl(){return process.env.PHOTON_REDIS_URL?.trim() || process.env.REDIS_URL?.trim();}
export function photonConfigured(){return !!redisUrl() && ['IMESSAGE_PROJECT_ID','IMESSAGE_PROJECT_SECRET','IMESSAGE_WEBHOOK_SECRET','PHOTON_ALLOWED_SENDERS','OPENAI_API_KEY'].every(key=>!!process.env[key]?.trim());}
function createBot(){
 const logger=new ConsoleLogger('silent');
 const state=createRedisState({url:redisUrl(),keyPrefix:'wolverine-photon',logger});
 const bot=new Chat({userName:'Pip',logger,state,dedupeTtlMs:48*60*60*1000,concurrency:'queue',adapters:{imessage:createiMessageAdapter({projectId:process.env.IMESSAGE_PROJECT_ID,projectSecret:process.env.IMESSAGE_PROJECT_SECRET,webhookSecret:process.env.IMESSAGE_WEBHOOK_SECRET,logger})}});
 bot.onDirectMessage(async(thread,message,_channel,context)=>{
  const allowed=(process.env.PHOTON_ALLOWED_SENDERS||'').split(',').map(s=>s.trim()).filter(Boolean);
  if(!thread.isDM||message.author.isMe||message.author.isBot||!allowed.includes(message.author.userId))return;
  const key='conversation:'+createHash('sha256').update(thread.id+'\0'+message.author.userId).digest('hex');
  try {
   const burst=[...(context?.skipped??[]),message].filter(m=>!m.author.isMe&&!m.author.isBot&&m.author.userId===message.author.userId);
   const stop=burst.some(m=>m.text.trim().toUpperCase()==='STOP');
   const reset=burst.some(m=>m.text.trim().toUpperCase()==='RESET');
   const text=stop?'STOP':reset?'RESET':burst.map(m=>m.text).join('\n');
   const reply=await handleText({text,state:await state.get<TextState>(key),day:new Date().toISOString().slice(0,10),save:s=>state.set(key,s,TEXT_TTL),answer:async history=>{
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:40000,maxRetries:0});
    const response=await client.responses.create({model:process.env.OPENAI_HEALTH_MODEL||'gpt-4.1-mini',store:false,max_output_tokens:500,instructions:buildHealthPrompt({sample:false,memoryEnabled:false})+'\nCHANNEL: Private iMessage conversation. Reply as Pip in short plain text, usually 1–3 sentences and one question. You can only see the recent messages supplied here. No app health records, wearable data, long-term memory or write tools are available. Do not claim you saved a run, changed a plan, or know facts from the app. Return plain text, not JSON. Users can text STOP or RESET.',input:history});
    if(response.status==='incomplete')throw new Error('Incomplete response');
    return response.output_text;
   }});
   await thread.post(reply);
  }catch { // Deliberately omit texts, phone numbers and provider error objects from logs.
   console.error('Photon reply processing failed');
   await thread.post('I couldn’t finish that reply. Please try again in a moment.');
  }
 });
 return bot;
}
let bot:ReturnType<typeof createBot>|undefined;
export function photonBot(){return bot??=createBot();}
