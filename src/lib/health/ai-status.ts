// Server-only credential/model reachability probe. No health data or generation request.
export type AIStatus = 'reachable' | 'authentication_failed' | 'not_configured' | 'unverified';
export async function checkAIStatus(key?:string,model='gpt-4.1-mini',fetcher:typeof fetch=fetch):Promise<AIStatus>{
 if(!key)return 'not_configured';
 try{
  const response=await fetcher(`https://api.openai.com/v1/models/${encodeURIComponent(model)}`,{headers:{Authorization:`Bearer ${key}`},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(3000)});
  if(response.status===401)return 'authentication_failed';
  // Restricted metadata permissions, quota, network errors and model rejection are not invalid-key proof.
  if(!response.ok)return 'unverified';
  const body=await response.json();
  return body?.object==='model'&&body.id===model?'reachable':'unverified';
 }catch{return 'unverified';}
}
let cached:{status:AIStatus;expires:number}|undefined;
let pending:Promise<AIStatus>|undefined;
export async function aiStatus(){
 if(cached&&cached.expires>Date.now())return cached.status;
 if(!pending)pending=checkAIStatus(process.env.OPENAI_API_KEY,process.env.OPENAI_HEALTH_MODEL||'gpt-4.1-mini').then(status=>{cached={status,expires:Date.now()+(status==='unverified'?15000:60000)};return status;}).finally(()=>{pending=undefined;});
 return pending;
}
