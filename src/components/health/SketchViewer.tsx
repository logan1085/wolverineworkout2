"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { Sketch } from "@/lib/health/scene-model";
export default function SketchViewer({ sketch, modelUrl }: { sketch: Sketch; modelUrl?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const actions = useRef<{ move: (action: string) => void; download: () => Promise<void> } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const element = host.current;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setError(modelUrl ? "3D needs WebGL on this device. You can still download the original model below." : "3D needs WebGL on this device. You can still download the scene JSON."); return; }
    setError("");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", sketch.title + ". Use the buttons below to rotate or zoom.");
    const scene = new THREE.Scene();
    const group = new THREE.Group();
    scene.add(group);
    for (const o of (modelUrl ? [] : sketch.objects)) {
      const geometry = o.shape === "box" ? new THREE.BoxGeometry() : o.shape === "sphere" ? new THREE.SphereGeometry(.5, 32, 20) : o.shape === "cylinder" ? new THREE.CylinderGeometry(.5,.5,1,32) : o.shape === "cone" ? new THREE.ConeGeometry(.5,1,32) : new THREE.TorusGeometry(.4,.1,12,40);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: o.color, roughness: .45, metalness: .12 }));
      mesh.position.fromArray(o.position); mesh.rotation.set(o.rotation[0],o.rotation[1],o.rotation[2]); mesh.scale.fromArray(o.scale); group.add(mesh);
    }
    scene.add(new THREE.HemisphereLight(0xffffff, 0x354a40, 3));
    const light = new THREE.DirectionalLight(0xffead0, 4); light.position.set(4,6,5); scene.add(light);
    let disposed = false;
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
    const lost = (event: Event) => { event.preventDefault(); setError("The 3D view paused. Reopen the studio to restore it."); };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    controls.addEventListener("change", render);
    const observer = new ResizeObserver(resize); observer.observe(element); resize();
    setLoading(!!modelUrl);
    if (modelUrl) new GLTFLoader().load(modelUrl, gltf => {
      if (disposed) { disposeGroup(gltf.scene); return; }
      group.add(gltf.scene);
      const bounds = new THREE.Box3().setFromObject(group);
      const target = bounds.getCenter(new THREE.Vector3());
      const extent = Math.max(bounds.getSize(new THREE.Vector3()).length(), 1);
      camera.position.copy(target).add(new THREE.Vector3(extent*.7, extent*.45, extent*1.25));
      camera.far=extent*100; camera.updateProjectionMatrix();
      controls.target.copy(target); controls.minDistance=extent*.6; controls.maxDistance=extent*6;
      controls.update(); controls.saveState(); render(); setLoading(false);
    }, undefined, () => { if (!disposed) { setError("This object could not load. Select it again or try another object."); setLoading(false); } });
    actions.current = {
      move: action => { if(action === "reset") controls.reset(); else if(action === "left") controls.rotateLeft(.3); else if(action === "right") controls.rotateLeft(-.3); else if(action === "in") controls.dollyIn(1.2); else controls.dollyOut(1.2); controls.update(); render(); },
      download: async () => { try { const binary = await new GLTFExporter().parseAsync(group,{binary:true}); download(new Blob([binary as ArrayBuffer],{type:"model/gltf-binary"}),"wolverine-sketch.glb"); } catch { setError("GLB export failed. Try downloading the scene JSON."); } },
    };
    return () => { disposed=true; actions.current=null; observer.disconnect(); controls.dispose(); renderer.domElement.removeEventListener("webglcontextlost",lost); disposeGroup(group); renderer.dispose(); renderer.domElement.remove(); };
  },[sketch, modelUrl]);
  return <><div className="sketch-canvas" ref={host} role="img" aria-label={sketch.title} />{loading && <p role="status">Loading object…</p>}{error && <p role="alert">{error}</p>}<div className="sketch-controls">{[["left","Rotate left"],["right","Rotate right"],["in","Zoom in"],["out","Zoom out"],["reset","Reset view"]].map(([action,label]) => <button type="button" key={action} onClick={() => actions.current?.move(action)}>{label}</button>)}</div><p className="sketch-hint">Drag to turn · Pinch to zoom</p><div className="sketch-controls"><button type="button" onClick={() => actions.current?.download()} disabled={!!error || loading}>Download GLB</button>{!modelUrl && <button type="button" onClick={() => download(new Blob([JSON.stringify(sketch,null,2)],{type:"application/json"}),"wolverine-sketch.json")}>Download scene JSON</button>}</div></>;
}
function download(blob: Blob, name: string) { const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=name; a.click(); setTimeout(() => URL.revokeObjectURL(url),10000); }
