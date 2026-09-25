"use client";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
const Viewer = dynamic(() => import("./SketchViewer"), { ssr: false });

/** Keep the authored Blender portrait stable. Only load WebGL on explicit request. */
export default function AssetPreview({ asset, compact = false }: {
  asset: { id: string; title: string; description: string; model: string; thumbnail: string };
  compact?: boolean;
}) {
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [readyModel, setReadyModel] = useState<string | null>(null);
  const sketch = useMemo(() => ({ title: asset.title, description: asset.description, objects: [] }), [asset.title, asset.description]);
  const onReadyChange = useCallback((ready: boolean) => setReadyModel(ready ? asset.model : null), [asset.model]);
  const interactive = activeModel === asset.model;
  const ready = interactive && readyModel === asset.model;
  return <div className={`asset-preview ${ready ? "asset-ready" : ""} ${compact ? "asset-compact" : ""} ${interactive ? "asset-interactive" : "asset-still"}`}>
    <div className="asset-poster" aria-hidden={ready}>
      <Image src={asset.thumbnail} alt={asset.title} width={1024} height={1024} quality={95} sizes={compact ? "(max-width:760px) 160px, 300px" : "(max-width:760px) 360px, 480px"} priority={compact}/>
    </div>
    {interactive && <Viewer key={asset.model} sketch={sketch} modelUrl={asset.model} compact={compact} downloads={false} onReadyChange={onReadyChange}/>}
    {!compact && <button type="button" className="quiet-button asset-mode" aria-pressed={interactive} onClick={() => { setActiveModel(interactive ? null : asset.model); setReadyModel(null); }}>{interactive ? "Back to portrait" : "Explore in 3D"}</button>}
  </div>;
}
