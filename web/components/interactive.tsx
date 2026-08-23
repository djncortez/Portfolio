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

import { motion, motionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/* ---------------- shared ---------------- */

/**
 * Every pointer-driven piece in this file needs the same gate: hover-and-fine
 * only. Gate on the media query rather than on viewport width — a touch laptop
 * reports a wide viewport and would be offered effects it cannot trigger, and a
 * mouse in a narrow window would lose them.
 */
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const set = () => setFine(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return fine;
}

/** Pointer offset from an element's centre, as -1..1 on each axis. */
function offsetFromCentre(el: HTMLElement, ev: { clientX: number; clientY: number }) {
  const r = el.getBoundingClientRect();
  const unit = (v: number) => Math.max(-1, Math.min(1, v));
  return {
    x: unit((ev.clientX - (r.left + r.width / 2)) / (r.width / 2)),
    y: unit((ev.clientY - (r.top + r.height / 2)) / (r.height / 2)),
  };
}

/** Overdamped: the lag is most of what makes a pointer effect read as weight. */
const FOLLOW = { stiffness: 220, damping: 22, mass: 0.4 } as const;

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
  // w/h are the CONTAINER's rendered size, which the magnified background is
  // sized against. Percentages cannot do this job — see the style block below.
  const [pos, setPos] = useState({ x: 0, y: 0, w: 0, h: 0 });
  // Magnification is meaningless without a fine pointer, and on touch it would
  // fight the scroll.
  const fine = useFinePointer();

  const move = useCallback((ev: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: ev.clientX - r.left, y: ev.clientY - r.top, w: r.width, h: r.height });
  }, []);

  // pos.w is 0 until the first move, and a 0-width background would flash an
  // empty disc on entry — mouseenter can land a frame before mousemove.
  const active = on && fine && !reduce && pos.w > 0;

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
            // BOTH of these must be in px, not %.
            //
            // A percentage background-size resolves against the LENS box, not
            // the image: `210%` of a 190px disc is 399px, floating over an
            // image the page is already drawing at 600px. That is a 0.665x
            // shrink, which is why this magnifier was zooming out.
            //
            // A percentage background-position aligns the image's X% point with
            // the lens's X% point, which coincides with the cursor only at the
            // exact centre and drifts by up to half the lens (95px) toward the
            // edges. In px the cursor's own point lands dead centre everywhere:
            // the image pixel under the cursor is at x*zoom, so offsetting by
            // size/2 - x*zoom puts it at the middle of the disc.
            backgroundSize: `${pos.w * zoom}px ${pos.h * zoom}px`,
            backgroundPosition: `${size / 2 - pos.x * zoom}px ${size / 2 - pos.y * zoom}px`,
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

/* ---------------- magnetic ---------------- */

/**
 * Pointer attraction, after Aceternity's `magnetic button`.
 *
 * DESIGN.md permits outlined controls only — no filled CTA exists in the
 * system — so the controls carry less affordance than a solid button would.
 * This answers that with physics instead of with a fill, which would break the
 * rule the whole control set is built on.
 *
 * Travel is capped in pixels rather than scaled off the element: the two hero
 * pills differ in width by ~80px, and a proportional pull made the wide one
 * visibly livelier than the narrow one sitting right beside it.
 *
 * The hit area is the control itself, deliberately. The classic version reaches
 * out past its bounds, but these sit in a `gap-3.5` flex row and an outset hit
 * area would have them stealing the pointer from each other.
 */
export function Magnetic({
  children, max = 7, className,
}: { children: ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const x = useSpring(0, FOLLOW);
  const y = useSpring(0, FOLLOW);

  const move = useCallback((ev: React.MouseEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el) return;
    const o = offsetFromCentre(el, ev);
    x.set(o.x * max);
    y.set(o.y * max);
  }, [max, x, y]);

  const rest = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  if (!fine || reduce) return <>{children}</>;

  return (
    <motion.span
      ref={ref}
      style={{ x, y }}
      onMouseMove={move}
      onMouseLeave={rest}
      className={`inline-block ${className ?? ""}`}
    >
      {children}
    </motion.span>
  );
}

/* ---------------- tilt ---------------- */

/**
 * Pointer tilt with a lifted foreground, after Aceternity's `3d card effect`.
 *
 * The rule the object layer lives by is that objects must overlap their frame.
 * In the work rows they already do, but only in 2D — the object hangs off the
 * corner and wins on stacking order. Sharing one perspective, the frame rotates
 * away from the pointer while the object holds a positive Z, so the overlap
 * becomes actual depth.
 *
 * 4deg, not the reference's 20. This is a portfolio for clients and a card that
 * swings is the single loudest tell of a pasted-in component; at 4deg you read
 * it as the frame having thickness, which is the part worth having.
 */
const HoverCtx = createContext<MotionValue<number> | null>(null);
const AT_REST = motionValue(0);

export function Tilt({
  children, max = 4, className,
}: { children: ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const rotateX = useSpring(0, FOLLOW);
  const rotateY = useSpring(0, FOLLOW);
  const hover = useSpring(0, FOLLOW);

  const move = useCallback((ev: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const o = offsetFromCentre(el, ev);
    rotateY.set(o.x * max);
    // Negated: pointer below centre should tip the near edge toward the viewer.
    rotateX.set(o.y * -max);
    // Raised here as well as on enter, so the lift never depends on a
    // mouseenter that may not come — a row scrolling up under a stationary
    // pointer gets movement events but no entry.
    hover.set(1);
  }, [hover, max, rotateX, rotateY]);

  const rest = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    hover.set(0);
  }, [hover, rotateX, rotateY]);

  // Without a fine pointer this is not merely inert, it is unreachable — so it
  // renders as the plain positioned box it replaced, with no 3D context and no
  // extra compositor layer.
  if (!fine || reduce) return <div className={`relative ${className ?? ""}`}>{children}</div>;

  return (
    <HoverCtx.Provider value={hover}>
      <div
        ref={ref}
        className={className}
        style={{ perspective: 1100 }}
        onMouseEnter={() => hover.set(1)}
        onMouseMove={move}
        onMouseLeave={rest}
      >
        <motion.div className="relative" style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
          {children}
        </motion.div>
      </div>
    </HoverCtx.Provider>
  );
}

/**
 * A child of `Tilt` that rides above the tilted plane.
 *
 * Depth animates from 0 rather than resting at its full height, because
 * translateZ under a perspective also SCALES: a static lift would silently
 * render every work object larger than the size the object layer is pinned to,
 * and DESIGN.md pins those sizes so nothing upscales past its source.
 *
 * It owns `transform` on its own node so the scroll `Drift` inside keeps its
 * own — two Motion concerns on one node overwrite each other.
 */
export function TiltLift({
  children, depth = 56, className,
}: { children: ReactNode; depth?: number; className?: string }) {
  const hover = useContext(HoverCtx);
  const z = useTransform(hover ?? AT_REST, (v) => v * depth);
  if (!hover) return <div className={className}>{children}</div>;
  return <motion.div className={className} style={{ z }}>{children}</motion.div>;
}

/* ---------------- highlight ---------------- */

/**
 * Highlighter sweep, after Aceternity's `hero highlight`.
 *
 * DESIGN.md's north star is "cream chalk and five colour-coded highlighters",
 * and until now the highlighter half of that was stated but never drawn. This
 * is it, used once, on the one phrase in the hero that carries the claim.
 *
 * TWO LAYERS, not one, and that is the whole design. Cream on brand green
 * measures 1.66:1 — sweeping a green block behind the existing cream text
 * would make the phrase unreadable exactly where it is most emphasised. So a
 * canvas-coloured copy rides on top of the block under the same clip: every
 * pixel is either cream on canvas (18.4:1) or canvas on green (11.1:1), and
 * there is no intermediate frame where it is neither. That is also what a real
 * highlighter does — dark ink under bright ink.
 *
 * `inline-block` makes the phrase atomic, so it moves to the next line whole
 * rather than breaking across one. Absolutely-positioned children of an inline
 * box would otherwise resolve against its FIRST fragment only, and the block
 * would detach from the second half of a wrapped phrase.
 */
export function Highlight({
  children, delay = 1.15, className,
}: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();

  // Under reduced motion there is no sweep to watch, and a static green block
  // would be decoration rather than a gesture — so the phrase simply stays
  // cream, which is what it was before.
  if (reduce) return <span className={className}>{children}</span>;

  const sweep = {
    initial: { clipPath: "inset(0 100% 0 0)" },
    animate: { clipPath: "inset(0 0% 0 0)" },
    transition: { duration: 0.72, ease: [0.19, 1, 0.22, 1] as const, delay },
  };

  return (
    <span className={`relative inline-block ${className ?? ""}`}>
      <span className="relative">{children}</span>
      {/* the mark, bled slightly past the text the way a real one overshoots */}
      <motion.span
        aria-hidden
        className="absolute -inset-x-[0.14em] -inset-y-[0.08em] rounded-[8px] bg-brand select-none"
        {...sweep}
      />
      {/* The same words again, dark, clipped in step with the mark.
          `[&_*]:text-inherit` is load-bearing: the phrase is passed in wrapped
          in its own colour class, and without this the "dark" copy would render
          cream on green at 1.66:1 — the exact failure the two layers exist to
          prevent. */}
      <motion.span aria-hidden className="absolute inset-0 select-none text-canvas [&_*]:text-inherit" {...sweep}>
        {children}
      </motion.span>
    </span>
  );
}

/* ---------------- pointer reveal ---------------- */

/**
 * Cursor-following colour reveal on display type, after Aceternity's
 * `text hover effect`.
 *
 * The original is SVG `<text>`, which cannot wrap. Adopting it that way would
 * have cost this heading three fixes it already paid for: `.char-word` (the
 * "Josep / h" mid-word break), `15.5cqw` container-query sizing, and the
 * descender masking. So it is rebuilt as a masked HTML overlay instead — the
 * real heading is untouched underneath, and the overlay is the SAME component
 * in `still` mode, so the two cannot wrap differently.
 *
 * Green, and only green: DESIGN.md assigns that hue to him, and this is his
 * name. Any other colour here would be decoration.
 *
 * The pointer writes CSS custom properties directly on the node rather than
 * going through state — React re-rendering a 210px heading on every mousemove
 * is the version of this that costs something.
 */
export function PointerReveal({
  children, overlay, radius = 190, className,
}: { children: ReactNode; overlay: ReactNode; radius?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const [on, setOn] = useState(false);

  const move = useCallback((ev: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--rx", `${ev.clientX - r.left}px`);
    el.style.setProperty("--ry", `${ev.clientY - r.top}px`);
  }, []);

  if (!fine || reduce) return <div className={className}>{children}</div>;

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={move}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      style={{ ["--rr" as string]: `${radius}px` }}
    >
      {children}
      {/* aria-hidden keeps the duplicate out of the accessibility tree and
          select-none keeps it out of the clipboard — without the latter,
          selecting the heading copies the name twice. */}
      <div
        aria-hidden
        className="reveal-layer pointer-events-none absolute inset-0 select-none text-brand-lt"
        data-on={on ? "1" : "0"}
      >
        {overlay}
      </div>
    </div>
  );
}

/* ---------------- pin ---------------- */

/**
 * The 3D pin, after Aceternity's `3d-pin`.
 *
 * The card lies flat on a ground plane and tilts up under the pointer while a
 * marker rises above it — which is the right gesture for a credential, because
 * the thing worth surfacing is that it is VERIFIABLE. The label is an action,
 * not a destination: four of the six certificates resolve to the same
 * skills.google host, so naming the host would repeat itself four times and say
 * nothing the issuer line underneath does not already say.
 *
 * Three changes from the source, one of them a real defect:
 *
 *  - It nests an <a> inside an <a>. The container is an anchor and the pin
 *    label is another anchor within it, which is invalid HTML — the parser
 *    closes the first one early and the card stops being one link. The label
 *    is a <span> here and the whole card is the single anchor.
 *  - `blur-[2px]` and `blur-[3px]` on the stem and its dot. `filter` is what
 *    made this page lag, and at six cards that is 24 blurred elements. Drawn
 *    solid instead; at 1-2px the difference is not visible anyway.
 *  - Sky, cyan and emerald throughout, plus box-shadow on the card and on all
 *    three rings. Brand green — these are his credentials — and depth from the
 *    --panel step, since box-shadow does not exist in this system.
 *
 * Without a fine pointer the whole apparatus is unreachable, so it degrades to
 * the plain card it replaced rather than rendering a 3D context nobody can
 * trigger.
 */
export function Pin({
  label, href, children,
}: { label: string; href: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const [lifted, setLifted] = useState(false);

  // Frame only — border, surface, padding, radius. The children own their
  // layout, so a caller can stack or row them without fighting a grid here.
  const card =
    "flex flex-col gap-[16px] rounded-[8px] border border-hair bg-panel p-[22px]";

  if (!fine || reduce) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
         className={`${card} transition-colors duration-500 hover:bg-[#20211f]`}>
        {children}
      </a>
    );
  }

  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setLifted(true)}
      onMouseLeave={() => setLifted(false)}
      className="group/pin relative block h-full"
    >
      {/* The card stands upright at rest and only lies down under the pointer.
          The source pre-rotates the card's own container by 70deg, which is
          correct for the rings — they belong on the ground — but applied to the
          card it leaves all six lying flat at rest, squashed to about a fifth
          of their height with the text illegible. Perspective here, rotation
          only on hover. */}
      {/* h-full down the chain: the anchor is the grid item and stretches to the
          tallest card in its row, but the card inside sits at content height,
          so a row with a wrapping title left its neighbours 22px short. */}
      <div style={{ perspective: "1000px" }} className="h-full">
        <div
          style={{
            transform: lifted ? "rotateX(38deg) scale(0.9)" : "rotateX(0deg) scale(1)",
            transformOrigin: "center bottom",
          }}
          className={`${card} h-full transition-transform duration-700`}
        >
          {children}
        </div>
      </div>

      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${lifted ? "opacity-100" : "opacity-0"}`}>
        {/* Radar rings, on the ground plane the card tips toward. */}
        <div style={{ perspective: "1000px", transform: "rotateX(70deg)" }}
             className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {[0, 2, 4].map((delay) => (
            <motion.span
              key={delay}
              initial={{ opacity: 0, scale: 0, x: "-50%", y: "-50%" }}
              animate={{ opacity: [0, 1, 0.5, 0], scale: 1 }}
              transition={{ duration: 6, repeat: Infinity, delay }}
              className="absolute left-1/2 top-1/2 size-[9rem] rounded-[100px] bg-brand/[0.09]"
            />
          ))}
        </div>

        {/* The marker, rising off the card's top edge.
            The lifted nudge is not decoration: tilting to 38deg about
            `center bottom` and scaling to 0.9 drops the card's VISUAL top well
            below its layout top, and the column is bottom-anchored, so without
            this the stem stops in mid-air short of the card it is pinning.
            Lengthening the stem would not fix it — that pushes the label up and
            leaves the dot where it was.

            The drop is a FRACTION of card height, not a fixed 42px: rotateX(38deg)
            about `center bottom` then scale(0.9) leaves the top edge at
            0.9*cos(38deg) = 0.709 of the height, so the top falls by ~29% of it
            (~30% measured, perspective adds a little). 42px was that number for
            the 139px card this started as; the badge previews make the card
            taller and the constant would be 30px short again.
            This wrapper is `inset-0`, so its box IS the card, and a percentage
            translate resolves against its own height — the offset now tracks any
            card size with no measurement. `transition-[translate]`, not
            `transition-transform`: Tailwind v4 translate utilities compile to the
            standalone `translate` property. */}
        <div className={`absolute inset-0 transition-[translate] duration-700 ${lifted ? "translate-y-[30.2%]" : "translate-y-0"}`}>
        <div className="absolute bottom-full left-1/2 flex -translate-x-1/2 flex-col items-center">
          <span className="relative rounded-[100px] border border-hair bg-canvas px-4 py-1 text-[12px] font-semibold leading-[1.15] whitespace-nowrap text-cream">
            {label}
            <span aria-hidden
                  className="absolute inset-x-[1.125rem] -bottom-px h-px bg-linear-to-r from-transparent via-brand to-transparent" />
          </span>
          {/* Solid, not the source's blur-[2px]: `filter` is what made this
              page lag, and six cards would put 24 blurred nodes on screen. */}
          <span className={`w-px bg-linear-to-b from-transparent to-brand transition-[height] duration-500 ${lifted ? "h-[54px]" : "h-[22px]"}`} />
          <span className="size-[3px] -translate-y-[1px] rounded-[100px] bg-brand-lt" />
        </div>
        </div>
      </div>
    </a>
  );
}
