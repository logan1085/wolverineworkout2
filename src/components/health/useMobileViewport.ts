"use client";
import { useEffect, useRef, useState } from "react";

/** Follow the visible phone viewport without disabling pinch zoom. */
export function useMobileViewport() {
  const root = useRef<HTMLDivElement>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    const mobile = window.matchMedia("(max-width: 760px)");
    let frame = 0;
    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Zoom is a user accessibility action, not a software keyboard.
        const zoomed = viewport && Math.abs(viewport.scale - 1) > 0.05;
        const height = zoomed
          ? window.innerHeight
          : (viewport?.height ?? window.innerHeight);
        const top = zoomed ? 0 : (viewport?.offsetTop ?? 0);
        root.current?.style.setProperty("--mobile-height", `${height}px`);
        root.current?.style.setProperty("--mobile-top", `${top}px`);
        root.current?.style.setProperty(
          "--keyboard-inset",
          `${zoomed ? 0 : Math.max(0, window.innerHeight - height - top)}px`,
        );
        const editing = document.activeElement?.matches(
          "textarea, input:not([type=checkbox]):not([type=radio]), [contenteditable=true]",
        );
        setKeyboardOpen(
          !!(
            mobile.matches &&
            editing &&
            !zoomed &&
            (window.innerHeight - height > 120 || height < 500)
          ),
        );
      });
    }
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, []);
  return { root, keyboardOpen };
}
