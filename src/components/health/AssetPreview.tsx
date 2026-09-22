"use client";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
const Viewer = dynamic(() => import("./SketchViewer"), { ssr: false });

/** The poster owns the initial layout; interactive 3D replaces it only after a render. */
export default function AssetPreview({ asset, compact = false }: {
  asset: { id: string; title: string; description: string; model: string; thumbnail: string };
  compact?: boolean;
}) {
  const [readyModel, setReadyModel] = useState<string | null>(null);
  const sketch = useMemo(() => ({ title: asset.title, description: asset.description, objects: [] }), [asset.title, asset.description]);
  const onReadyChange = useCallback((ready: boolean) => setReadyModel(ready ? asset.model : null), [asset.model]);
  const ready = readyModel === asset.model;
  return <div className={`asset-preview ${ready ? "asset-ready" : ""} ${compact ? "asset-compact" : ""}`}>
    <div className="asset-poster" aria-hidden={ready}>
      <Image src={asset.thumbnail} alt={`${asset.title} preview`} width={640} height={640} sizes="(max-width:760px) 180px, 300px" priority={compact}/>
    </div>
    <Viewer sketch={sketch} modelUrl={asset.model} compact={compact} downloads={false} onReadyChange={onReadyChange}/>
  </div>;
}
