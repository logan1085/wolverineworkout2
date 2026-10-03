export type Turn = {role:'user'|'assistant';content:string};
export type TextState = {consented:boolean;history:Turn[];day:string;count:number};
export const TEXT_TTL = 7 * 24 * 60 * 60 * 1000;
export const TEXT_INTRO = "I'm Pip, Wolverine's AI running companion. Reply START to share your texts with OpenAI and keep up to 12 recent messages for 7 days after your last message. This chat isn't linked to your app health records. STOP pauses replies and clears this chat's memory; RESET clears memory. Photon and your messaging provider also process these messages.";
export async function handleText(input:{text:string;state:TextState|null;day:string;save:(state:TextState)=>Promise<void>;answer:(history:Turn[])=>Promise<string>}) {
 const {text,day,save,answer}=input;
 const previous=input.state;
 const state:TextState={consented:previous?.consented===true,history:previous?.history??[],day,count:previous?.day===day?previous.count:0};
 const command=text.trim().toUpperCase();
 if(command==='STOP') {await save({...state,consented:false,history:[]});return 'Replies paused and Wolverine’s text conversation memory cleared. Text START to opt in again. Messages already in your messaging app or provider records are not deleted.';}
 if(command==='RESET') {await save({...state,history:[]});return 'Wolverine’s text conversation memory is cleared. Messages in your messaging app or provider records are not deleted.';}
 if(command==='HELP')return TEXT_INTRO;
 if(!state.consented){if(command!=='START')return TEXT_INTRO;await save({...state,consented:true,history:[]});return "You're connected to Pip. Did you run today?";}
 if(command==='START')return "You're already connected. Did you run today?";
 if(!text.trim()||text.length>4000)return 'Please send a text under 4,000 characters.';
 if(state.count>=60)return 'You’ve reached today’s 60-message limit. You can text again tomorrow (UTC).';
 // Reserve quota before model work; failed generations still consume a slot.
 await save({...state,count:state.count+1});
 const history:Turn[]=[...state.history.slice(-10),{role:'user',content:text}];
 const reply=await answer(history);
 if(!reply.trim()||reply.length>4000)throw new Error('Invalid agent response');
 await save({...state,count:state.count+1,history:[...history,{role:'assistant' as const,content:reply}].slice(-12)});
 return reply;
}
