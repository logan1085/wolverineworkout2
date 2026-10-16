"use client";

import { useEffect, useRef, useState } from "react";
import { createTrainingWorld, type WorldStation, type WorldController } from "./training-world-renderer";

export type TrainingWorldProps = {
  stations: WorldStation[]; selected: number; completed: number; total: number;
  raceLabel: string; onSelect: (index: number) => void; onFallback: () => void;
};

/** Loaded only after an explicit request. The conventional day controls stay outside this canvas. */
export default function TrainingWorld(props: TrainingWorldProps) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<WorldController | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [still, setStill] = useState(false);
  const sceneKey = JSON.stringify([props.stations, props.completed, props.total, props.raceLabel]);
  useEffect(() => {
    if (!host.current) return;
    setReady(false); setError(false);
    try {
      controller.current = createTrainingWorld(host.current, {
        ...latest.current,
        onSelect: index => latest.current.onSelect(index),
        onLost: () => { setReady(false); setError(true); latest.current.onFallback(); },
      });
      setReady(true);
    } catch { setError(true); latest.current.onFallback(); }
    return () => { controller.current?.dispose(); controller.current = null; };
  }, [sceneKey]);
  useEffect(() => { controller.current?.select(props.selected, still); }, [props.selected, still, sceneKey]);
  return <div className="training-world">
    <div className="world-topline"><span className="track-kicker">YOUR 3D TRAINING GROUND</span><span role="status">{error ? "3D unavailable · day controls still work" : ready ? "3D ready · renders only when you interact" : "Opening the stadium…"}</span></div>
    <div ref={host} className="world-canvas" role="img" aria-label="Interactive three-dimensional running stadium. Seven day stations correspond to the buttons below. Select a day to move the camera and read its workout." />
    {error ? <div className="world-error"><p>This device could not keep a 3D view running. Your training is safe.</p><button onClick={props.onFallback}>Use lightweight track</button></div> : <>
      <div className="world-controls" role="group" aria-label="3D camera controls">
        <button disabled={!ready} onClick={() => controller.current?.move("left")}>Rotate left</button>
        <button disabled={!ready} onClick={() => controller.current?.move("right")}>Rotate right</button>
        <button disabled={!ready} onClick={() => controller.current?.move("in")}>Zoom in</button>
        <button disabled={!ready} onClick={() => controller.current?.move("out")}>Zoom out</button>
        <button disabled={!ready} onClick={() => controller.current?.move("overview")}>Whole stadium</button>
        <button aria-pressed={still} onClick={() => setStill(!still)}>{still ? "Camera motion off" : "Turn camera motion off"}</button>
      </div>
      <p className="world-help">Tap a day station or use the day buttons below. Drag to turn; two fingers to zoom. The infield bars show completed sessions this week. The finish gate shows your saved race countdown, not readiness.</p>
    </>}
  </div>;
}
