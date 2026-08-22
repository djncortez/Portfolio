"use client";

/**
 * Interaction pieces adapted from Aceternity UI.
 *
 * Adapted, not copied. The originals ship rounded-2xl/3xl, shadow-2xl, blur
 * layers and an indigo/violet palette — every one of which breaks this system
 * (radius is 8 or 100 only, there is no box-shadow, and the five hues are
 * taxonomy rather than decoration). Blur is also what caused this project's
 * lag, so nothing here uses `filter`. Everything animates transform, opacity
 * or clip-path only.
 */

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

/* ---------------- lens ---------------- */

/**
 * Hover magnifier, after Aceternity's `lens`.
 *
 * The MBO screenshots are dense dashboard UI rendered at roughly a third of
 * native size, so the detail that makes them worth showing is not legible.
 * This magnifies under the pointer using background-position on a scaled copy
 * — no filter, and no second network request.
 */
export function Lens({
  src, alt, zoom = 2.1, size = 190, className,
}: { src: string; alt: string; zoom?: number; size?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [on, setOn] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, px: 50, py: 50 });
  const [fine, setFine] = useState(false);

  // Pointer magnification is meaningless without a fine pointer and on touch it
  // would fight the scroll. Gate on the media query, not on width.
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const set = () => setFine(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  const move = useCallback((ev: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    setPos({ x, y, px: (x / r.width) * 100, py: (y / r.height) * 100 });
  }, []);

  const active = on && fine && !reduce;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-[8px] bg-panel ${className ?? ""}`}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      onMouseMove={move}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="w-full" />

      {active ? (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="pointer-events-none absolute rounded-[100px] border border-brand"
          style={{
            width: size,
            height: size,
            left: pos.x - size / 2,
            top: pos.y - size / 2,
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoom * 100}%`,
            backgroundPosition: `${pos.px}% ${pos.py}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
      ) : null}
    </div>
  );
}

/* ---------------- compare ---------------- */

/**
 * Before/after wipe, after Aceternity's `compare`.
 *
 * Driven by clip-path on the top layer, which the compositor handles, rather
 * than by resizing a container. Works on drag, on hover and from the keyboard
 * — the original is pointer-only, which makes it unusable without a mouse.
 */
export function Compare({
  before, after, beforeAlt, afterAlt, beforeLabel = "Before", afterLabel = "After", className,
}: {
  before: string; after: string; beforeAlt: string; afterAlt: string;
  beforeLabel?: string; afterLabel?: string; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(50);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPct(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  }, []);

  useEffect(() => {
    const up = () => { dragging.current = false; };
    const move = (ev: PointerEvent) => {
      if (dragging.current) { ev.preventDefault(); setFromClientX(ev.clientX); }
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointermove", move, { passive: false });
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointermove", move);
    };
  }, [setFromClientX]);

  const key = (ev: React.KeyboardEvent) => {
    if (ev.key === "ArrowLeft") { ev.preventDefault(); setPct((p) => Math.max(0, p - 4)); }
    if (ev.key === "ArrowRight") { ev.preventDefault(); setPct((p) => Math.min(100, p + 4)); }
    if (ev.key === "Home") { ev.preventDefault(); setPct(0); }
    if (ev.key === "End") { ev.preventDefault(); setPct(100); }
  };

  return (
    <div
      ref={ref}
      className={`relative touch-pan-y overflow-hidden rounded-[8px] bg-panel select-none ${className ?? ""}`}
      onPointerDown={(e) => { dragging.current = true; setFromClientX(e.clientX); }}
      onMouseMove={(e) => { if (!dragging.current) setFromClientX(e.clientX); }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={afterAlt} loading="lazy" className="w-full" draggable={false} />

      {/* top layer, clipped to the handle */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt={beforeAlt} loading="lazy"
             className="h-full w-full object-cover" draggable={false} />
      </div>

      {/* the handle */}
      <div className="pointer-events-none absolute inset-y-0 w-px bg-brand" style={{ left: `${pct}%` }}>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Reveal the digitised report"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          onKeyDown={key}
          className="pointer-events-auto absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-[100px] border border-brand bg-canvas text-[13px] text-brand"
        >
          ‹›
        </div>
      </div>

      <span className="pointer-events-none absolute top-3 left-3 rounded-[100px] border border-hair bg-canvas/80 px-3 py-1.5 text-[13px] leading-none text-muted">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute top-3 right-3 rounded-[100px] border border-hair bg-canvas/80 px-3 py-1.5 text-[13px] leading-none text-brand">
        {afterLabel}
      </span>
    </div>
  );
}

/* ---------------- sticky scroll reveal ---------------- */

/**
 * Sticky scroll reveal, after Aceternity's `sticky-scroll-reveal`.
 *
 * The seven contributions were a flat bulleted list — the densest and least
 * read part of the page. Now the list scrolls past a panel that pins and
 * updates as each item takes focus.
 *
 * Active index comes from an IntersectionObserver over a narrow band and
 * defaults to 0 rather than null: if the observer never fires, the panel shows
 * the first item instead of going blank. Stranded content has bitten this
 * project twice; nothing may depend on an entry arriving.
 */
export function StickyReveal({
  items, eyebrow,
}: { items: [string, string][]; eyebrow?: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const els = refs.current.filter(Boolean) as HTMLLIElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) {
          const i = els.indexOf(hit.target as HTMLLIElement);
          if (i >= 0) setActive(i);
        }
      },
      { threshold: 0, rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items.length]);

  const [k, v] = items[active] ?? items[0];

  return (
    <div className="grid gap-[clamp(28px,5vw,64px)] lg:grid-cols-[0.9fr_1.1fr]">
      {/* the panel that pins */}
      <div className="lg:sticky lg:top-[112px] lg:self-start">
        {eyebrow}
        <div className="rounded-[8px] bg-panel p-7">
          <p className="text-[15px] leading-none text-brand">
            {String(active + 1).padStart(2, "0")}
            <span className="text-muted"> / {String(items.length).padStart(2, "0")}</span>
          </p>
          {/* keyed so each change re-runs the transition */}
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          >
            <p className="mt-4 text-[clamp(21px,2.4vw,30px)] font-semibold leading-[1.1] tracking-[-0.01em]">
              {k}
            </p>
            <p className="mt-3 text-[16px] text-muted">{v}</p>
          </motion.div>

          <div className="mt-7 flex gap-1.5" aria-hidden>
            {items.map((_, i) => (
              <span key={i}
                    className={`h-px flex-1 transition-colors duration-500 ${i === active ? "bg-brand" : "bg-hair"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* the track that scrolls */}
      <ul>
        {items.map(([title, copy], i) => (
          <li
            key={title}
            ref={(el) => { refs.current[i] = el; }}
            aria-current={i === active ? "true" : undefined}
            className={`border-b border-hair py-6 transition-opacity duration-500 ${
              i === 0 ? "border-t" : ""
            } ${i === active ? "opacity-100" : "opacity-45"}`}
          >
            <p className="text-[16px] font-semibold text-cream">
              <span className="mr-3 text-brand">{String(i + 1).padStart(2, "0")}</span>
              {title}
            </p>
            <p className="mt-1.5 text-[16px] text-muted">{copy}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
