import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export type WorldStation = { label: string; status: string; completed: boolean; scheduled: boolean; logged: boolean };
export type WorldController = { select: (index: number, still: boolean) => void; move: (action: string) => void; dispose: () => void };
type Options = { stations: WorldStation[]; completed: number; total: number; raceLabel: string; onSelect: (index: number) => void; onLost: () => void };

/** Procedural, asset-free stadium. No background animation, shadows or remote loads. */
export function createTrainingWorld(host: HTMLElement, options: Options): WorldController {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: true });
  renderer.setClearColor(0xe4e6db);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false; controls.enablePan = false;
  controls.minDistance = 13; controls.maxDistance = 72;
  controls.minPolarAngle = .15; controls.maxPolarAngle = Math.PI * .44;
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const picks: THREE.Object3D[] = [];
  const stationGroups: THREE.Group[] = [];
  let frame = 0, disposed = false, lost = false, visible = true;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  function mesh(geo: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0) {
    geometries.add(geo);
    const mat = new THREE.MeshLambertMaterial({ color }); materials.add(mat);
    const object = new THREE.Mesh(geo, mat); object.position.set(x,y,z); scene.add(object); return object;
  }
  function box(w: number, h: number, d: number, color: number, x: number, y: number, z: number) { return mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z); }
  function sign(text: string, width: number, x: number, y: number, z: number, color = "#f8f5ec", ink = "#30392d") {
    const canvas = document.createElement("canvas"); canvas.width = 768; canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = color; ctx.fillRect(0,0,768,160);
    ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = text.length <= 14 ? "bold 76px Arial" : "bold 48px Arial"; ctx.fillText(text,384,80,720);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.add(texture);
    const material = new THREE.SpriteMaterial({map:texture}); materials.add(material);
    const sprite = new THREE.Sprite(material); sprite.scale.set(width,width*160/768,1); sprite.position.set(x,y,z); scene.add(sprite); return sprite;
  }
  scene.add(new THREE.HemisphereLight(0xfff7e2,0x526449,2.5));
  const sunlight = new THREE.DirectionalLight(0xffe9cc,2); sunlight.position.set(-15,25,12); scene.add(sunlight);
  box(37,.7,28,0xc3cbb5,0,-.6,0);
  // A raised elliptical track with six lanes and a separate turf infield.
  const track = mesh(new THREE.CylinderGeometry(1,1,.22,96),0xa55038,0,-.1,0); track.scale.set(16,1,10.5);
  for (let i=0;i<6;i++) {
    const ring = mesh(new THREE.TorusGeometry(1,.0025,4,96),0xf2c5a6,0,.025+i*.001,0);
    ring.rotation.x=-Math.PI/2; ring.scale.set(15.6-i*.65,10.1-i*.65,1);
  }
  const turf = mesh(new THREE.CylinderGeometry(1,1,.26,96),0x8fa481,0,.02,0); turf.scale.set(11.6,1,6.1);
  for(let i=0;i<5;i++) box(12,.025,.055,0xc5cfaf,0,.165,-4+i*2);
  // Stepped grandstands create a recognisable stadium silhouette.
  for (const side of [-1,1]) for(let row=0;row<3;row++) {
    box(23,.55+row*.55,1.1, row%2?0xb8bba7:0xd1cbb8,0,row*.275,side*(11.7+row*1.05));
    for(let seat=0;seat<12;seat++) box(.95,.16,.65,0x4e6555,-10.8+seat*1.95,.4+row*.55,side*(11.7+row*1.05));
  }
  for(const x of [-17,17]) for(const z of [-8,8]) {
    box(.13,5,.13,0x5e6a5c,x,2,z); box(2,.45,.35,0xfaf3d9,x,4.5,z);
  }
  // Seven actual day stations, with separate scheduled/completed/logged signals.
  options.stations.slice(0,7).forEach((station,index)=>{
    const angle = Math.PI + index*Math.PI*2/7;
    const x = Math.cos(angle)*13.7, z = Math.sin(angle)*8;
    const group = new THREE.Group(); group.position.set(x,.15,z); scene.add(group); stationGroups.push(group);
    const base = mesh(new THREE.CylinderGeometry(.8,.92,.24,24),station.completed?0x355c46:station.scheduled?0xa55038:0xc8cab7);
    scene.remove(base); group.add(base); base.userData.day=index; picks.push(base);
    const pillar = mesh(new THREE.CylinderGeometry(.18,.22,station.scheduled?1.55:.7,12),station.completed?0x355c46:0xf7e8c9,0,station.scheduled?.86:.45,0);
    scene.remove(pillar);group.add(pillar);pillar.userData.day=index;picks.push(pillar);
    const label = sign(station.label,3.8,x,3.1,z);
    label.userData.day=index;picks.push(label);
    if(station.logged) { const orb=mesh(new THREE.SphereGeometry(.23,12,8),0xe4b15c,x+.6,.6,z);orb.userData.day=index;picks.push(orb); }
  });
  const halo = mesh(new THREE.TorusGeometry(1.12,.07,6,32),0xf8d585,0,.4,0);halo.rotation.x=-Math.PI/2;
  // Readiness is not inferred: this board reflects the existing weekly summary only.
  sign(`${options.completed} / ${options.total} SESSIONS DONE`,8,0,1.3,0);
  const segments = Math.min(options.total,14);
  for(let i=0;i<segments;i++) box(.4,.16,1.1,i<options.completed?0x355c46:0xbec5ac,(i-(segments-1)/2)*.55,.3,2);
  for(const x of [-3.2,3.2]) box(.22,3.5,.22,0x354f40,x,1.75,-7.8);
  box(6.7,.6,.3,0x354f40,0,3.5,-7.8);
  sign(options.raceLabel,8,0,4.3,-7.8,"#354f40","#fff6df");
  for(let i=0;i<8;i++) for(let j=0;j<2;j++) box(.8,.03,.35,(i+j)%2?0x344538:0xf6efd9,-2.8+i*.8,.12,-8.2+j*.35);
  sign("WOLVERINE  /  RUNNING CLUB",11,0,2,12.8);
  function render() { if(!disposed&&!lost&&visible&&!document.hidden)renderer.render(scene,camera); }
  function cancel() { cancelAnimationFrame(frame);frame=0; }
  function transition(position: THREE.Vector3, target: THREE.Vector3, still: boolean) {
    cancel();
    if(still||reduced.matches||!visible||document.hidden) {camera.position.copy(position);controls.target.copy(target);controls.update();render();return;}
    const from = camera.position.clone(), aim = controls.target.clone(), start = performance.now();
    const step = (now:number) => { if(disposed||lost)return; const t=Math.min(1,(now-start)/420);const ease=t*t*(3-2*t);camera.position.lerpVectors(from,position,ease);controls.target.lerpVectors(aim,target,ease);controls.update();render();if(t<1)frame=requestAnimationFrame(step);else frame=0; };
    frame=requestAnimationFrame(step);
  }
  function overview() { const narrow=host.clientWidth<500; transition(new THREE.Vector3(narrow?28:23,narrow?36:28,narrow?41:32),new THREE.Vector3(0,0,0),true); }
  function resize() { const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setPixelRatio(Math.min(devicePixelRatio,1.5,Math.sqrt(1000000/(width*height))));renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();render(); }
  const observer=new ResizeObserver(resize);observer.observe(host);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)cancel();else render();});intersection.observe(host);
  const visibility=()=>{if(document.hidden)cancel();else render();};document.addEventListener("visibilitychange",visibility);
  const motion=()=>{if(reduced.matches)cancel();};reduced.addEventListener("change",motion);
  const contextLost=(event:Event)=>{event.preventDefault();lost=true;cancel();options.onLost();};renderer.domElement.addEventListener("webglcontextlost",contextLost);
  controls.addEventListener("change",render);controls.addEventListener("start",cancel);
  let down:{x:number;y:number;id:number}|null=null;
  const pointerDown=(event:PointerEvent)=>{down={x:event.clientX,y:event.clientY,id:event.pointerId};};
  const pointerUp=(event:PointerEvent)=>{
    if(!down||down.id!==event.pointerId||Math.hypot(event.clientX-down.x,event.clientY-down.y)>6){down=null;return;}down=null;
    const bounds=renderer.domElement.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1),camera);
    const hit=ray.intersectObjects(picks,false)[0];if(hit)options.onSelect(hit.object.userData.day);
  };
  renderer.domElement.addEventListener("pointerdown",pointerDown);renderer.domElement.addEventListener("pointerup",pointerUp);
  overview();resize();
  return {
    select(index,still) {const station=stationGroups[index];if(!station)return;halo.position.set(station.position.x,.42,station.position.z);const target=station.position.clone().multiplyScalar(.4);target.y=0;const narrow=host.clientWidth<500;transition(new THREE.Vector3(target.x+22,narrow?33:25,target.z+(narrow?38:30)),target,still);},
    move(action) {cancel();if(action==="overview")overview();else if(action==="left")controls.rotateLeft(.35);else if(action==="right")controls.rotateLeft(-.35);else if(action==="in")controls.dollyIn(1.2);else if(action==="out")controls.dollyOut(1.2);controls.update();render();},
    dispose() {disposed=true;cancel();observer.disconnect();intersection.disconnect();document.removeEventListener("visibilitychange",visibility);reduced.removeEventListener("change",motion);controls.dispose();renderer.domElement.removeEventListener("webglcontextlost",contextLost);renderer.domElement.removeEventListener("pointerdown",pointerDown);renderer.domElement.removeEventListener("pointerup",pointerUp);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();},
  };
}
