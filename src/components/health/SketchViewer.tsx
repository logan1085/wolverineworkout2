"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { Sketch } from "@/lib/health/scene-model";
export default function SketchViewer({ sketch, modelUrl, compact = false, downloads = true, onReadyChange }: { sketch: Sketch; modelUrl?: string; compact?: boolean; downloads?: boolean; onReadyChange?: (ready: boolean) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const actions = useRef<{ move: (action: string) => void; download: () => Promise<void> } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!modelUrl);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!host.current) return;
    const element = host.current;
    setError("");
    setLoading(!!modelUrl);
    onReadyChange?.(false);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setLoading(false); setError("Interactive 3D is unavailable on this device."); return; }
    setError("");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", sketch.title + (compact ? ". Drag to turn." : ". Use the buttons below to rotate or zoom."));
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    scene.environmentIntensity = .55;
    room.dispose(); pmrem.dispose();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200), new THREE.ShadowMaterial({opacity:.20}));
    floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
    const group = new THREE.Group();
    scene.add(group);
    for (const o of (modelUrl ? [] : sketch.objects)) {
      const geometry = o.shape === "box" ? new THREE.BoxGeometry() : o.shape === "sphere" ? new THREE.SphereGeometry(.5, 32, 20) : o.shape === "cylinder" ? new THREE.CylinderGeometry(.5,.5,1,32) : o.shape === "cone" ? new THREE.ConeGeometry(.5,1,32) : new THREE.TorusGeometry(.4,.1,12,40);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: o.color, roughness: .45, metalness: .12 }));
      mesh.position.fromArray(o.position); mesh.rotation.set(o.rotation[0],o.rotation[1],o.rotation[2]); mesh.scale.fromArray(o.scale); group.add(mesh);
    }
    scene.add(new THREE.HemisphereLight(0xe8f4ff, 0x465041, .8));
    const light = new THREE.DirectionalLight(0xffead0, 3); light.position.set(4,6,5); light.castShadow=true; light.shadow.mapSize.set(1024,1024); light.shadow.normalBias=.02; light.shadow.radius=4; scene.add(light);
    const rim = new THREE.DirectionalLight(0xd8e7ff, 2); rim.position.set(-3,3,-4); scene.add(rim);
    let disposed = false;
    let contextLost = false;
    const disposeGroup = (root: THREE.Object3D) => root.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(material => material.dispose()); } });
    const box = new THREE.Box3().setFromObject(group), center = modelUrl ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    const size = Math.max(box.getSize(new THREE.Vector3()).length(), 1);
    const camera = new THREE.PerspectiveCamera(38,1,.01,size*100);
    camera.position.copy(center).add(new THREE.Vector3(size*.9,size*.6,size*1.4));
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(center); controls.enablePan = false; controls.minDistance = size*.6; controls.maxDistance = size*6;
    controls.update(); controls.saveState();
    const render = () => renderer.render(scene,camera);
    const resize = () => { const { width, height } = element.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width,height); camera.aspect=width/height; camera.updateProjectionMatrix(); render(); };
    const lost = (event: Event) => { event.preventDefault(); contextLost = true; setLoading(false); onReadyChange?.(false); setError("The 3D view paused. Try loading it again."); };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    controls.addEventListener("change", render);
    const observer = new ResizeObserver(resize); observer.observe(element); resize(); if (!modelUrl) onReadyChange?.(true);
    setLoading(!!modelUrl);
    if (modelUrl) new GLTFLoader().load(modelUrl, gltf => {
      if (disposed || contextLost) { disposeGroup(gltf.scene); return; }
      gltf.scene.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow=true; o.receiveShadow=true; } });
      group.add(gltf.scene);
      const bounds = new THREE.Box3().setFromObject(group);
      const target = bounds.getCenter(new THREE.Vector3());
      const extent = Math.max(bounds.getSize(new THREE.Vector3()).length(), 1);
      const dimensions = bounds.getSize(new THREE.Vector3());
      const distance = Math.max(dimensions.y, dimensions.x / camera.aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov/2))) * 1.35;
      camera.position.copy(target).add(new THREE.Vector3(.22,.13,1).normalize().multiplyScalar(distance));
      floor.position.y = bounds.min.y - .015;
      light.target.position.copy(target); scene.add(light.target);
      Object.assign(light.shadow.camera, {left:-extent,right:extent,top:extent,bottom:-extent,near:.1,far:extent*10}); light.shadow.camera.updateProjectionMatrix();
      camera.far=extent*100; camera.updateProjectionMatrix();
      controls.target.copy(target); controls.minDistance=extent*.6; controls.maxDistance=extent*6;
      controls.update(); controls.saveState(); render(); setLoading(false); onReadyChange?.(true);
    }, undefined, () => { if (!disposed) { onReadyChange?.(false); setError("This object could not load. Check your connection and try again."); setLoading(false); } });
    actions.current = {
      move: action => { if(action === "reset") controls.reset(); else if(action === "left") controls.rotateLeft(.3); else if(action === "right") controls.rotateLeft(-.3); else if(action === "in") controls.dollyIn(1.2); else controls.dollyOut(1.2); controls.update(); render(); },
      download: async () => { try { const binary = await new GLTFExporter().parseAsync(group,{binary:true}); download(new Blob([binary as ArrayBuffer],{type:"model/gltf-binary"}),"wolverine-sketch.glb"); } catch { setError("GLB export failed. Try downloading the scene JSON."); } },
    };
    return () => { disposed=true; actions.current=null; observer.disconnect(); controls.dispose(); renderer.domElement.removeEventListener("webglcontextlost",lost); disposeGroup(group); floor.geometry.dispose(); floor.material.dispose(); environment.dispose(); light.shadow.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  },[sketch, modelUrl, compact, attempt, onReadyChange]);
  return <><div className="sketch-canvas" ref={host} role="img" aria-label={sketch.title} />{loading && !compact && !onReadyChange && <p role="status">Loading object…</p>}{error && <div className="viewer-recovery"><p role="status">{compact ? "Showing the preview image." : error}</p><button type="button" className="quiet-button" onClick={() => setAttempt(value => value + 1)}>Retry 3D</button></div>}{!compact && <><div className="sketch-controls">{[["left","Rotate left"],["right","Rotate right"],["in","Zoom in"],["out","Zoom out"],["reset","Reset view"]].map(([action,label]) => <button type="button" key={action} aria-label={label} title={label} disabled={loading || !!error} onClick={() => actions.current?.move(action)}><span className="viewer-control-symbol" aria-hidden="true">{{left:"↶",right:"↷",in:"+",out:"−",reset:"⟲"}[action]}</span><span className="viewer-control-label">{label}</span></button>)}</div><p className="sketch-hint">Drag to turn · Pinch to zoom</p>{downloads && <div className="sketch-controls"><button type="button" onClick={() => actions.current?.download()} disabled={!!error || loading}>Download GLB</button>{!modelUrl && <button type="button" onClick={() => download(new Blob([JSON.stringify(sketch,null,2)],{type:"application/json"}),"wolverine-sketch.json")}>Download scene JSON</button>}</div>}</>}</>;
}
function download(blob: Blob, name: string) { const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=name; a.click(); setTimeout(() => URL.revokeObjectURL(url),10000); }
