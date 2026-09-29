export type VoiceResources={pc?:RTCPeerConnection;mic?:MediaStream;audio?:HTMLAudioElement;abort?:AbortController;timer?:ReturnType<typeof setTimeout>;connectTimer?:ReturnType<typeof setTimeout>};
/** Release every live media resource on cancel, navigation, failure and unmount. */
export function releaseVoice(resources:VoiceResources){
  resources.abort?.abort();
  if(resources.timer)clearTimeout(resources.timer);
  if(resources.connectTimer)clearTimeout(resources.connectTimer);
  resources.mic?.getTracks().forEach(track=>track.stop());
  if(resources.pc){resources.pc.onconnectionstatechange=null;resources.pc.ontrack=null;resources.pc.close();}
  if(resources.audio){resources.audio.pause();resources.audio.srcObject=null;}
}
