"use client";
import { useEffect, useId, useRef } from "react";

export default function Modal({ title, onClose, children, error, pending = false, returnFocusRef }: {
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  error?: string;
  pending?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  const headingId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const opener = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      // React may replace this dialog with another in the same commit (More → character).
      // Let that dialog own focus; restore the original trigger only after the last closes.
      queueMicrotask(() => {
        if (document.querySelector("dialog[open]")) return;
        const target = opener?.isConnected ? opener : document.querySelector<HTMLElement>("[data-dialog-return]");
        target?.focus({ preventScroll: true });
      });
    };
  }, [returnFocusRef]);
  function outside(x: number, y: number) {
    const box = ref.current?.getBoundingClientRect();
    return !!box && (x < box.left || x > box.right || y < box.top || y > box.bottom);
  }
  return <dialog
    ref={ref}
    className="health-dialog"
    tabIndex={-1}
    onKeyDown={event => {
      if (event.key !== "Tab") return;
      const dialog = ref.current;
      if (!dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, summary, [tabindex]'))
        .filter(element => element.tabIndex >= 0 && !element.matches(":disabled") && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden");
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault(); first.focus();
      }
    }}
    aria-labelledby={headingId}
    aria-busy={pending || undefined}
    onCancel={event => { event.preventDefault(); if (!pending) onClose(); }}
    onPointerDown={event => { backdropPress.current = event.target === ref.current && outside(event.clientX, event.clientY); }}
    onClick={event => {
      if (!pending && backdropPress.current && event.target === ref.current && outside(event.clientX, event.clientY)) onClose();
      backdropPress.current = false;
    }}
  >
    <div className="dialog-heading">
      <h2 id={headingId}>{title}</h2>
      <button type="button" className="icon-button" aria-label="Close dialog" disabled={pending} onClick={onClose}>×</button>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {children}
  </dialog>;
}
