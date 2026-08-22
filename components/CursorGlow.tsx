"use client";

import { useEffect, useRef } from "react";

/**
 * A soft glow that follows the mouse. Updates via requestAnimationFrame and
 * writes directly to the DOM through a ref, rather than React state — that
 * avoids a re-render on every single mousemove event, which fires far too
 * often (dozens of times a second) to run through React's render cycle
 * without janking the rest of the page.
 */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -500, y: -500 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMove);

    const loop = () => {
      if (ref.current) {
        ref.current.style.background = `radial-gradient(650px circle at ${pos.current.x}px ${pos.current.y}px, rgba(139,92,246,0.20), rgba(34,211,238,0.10) 30%, transparent 55%)`;
      }
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return <div ref={ref} className="fixed inset-0 -z-10 pointer-events-none" />;
}
