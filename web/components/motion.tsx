"use client";

/**
 * Motion primitives, ported from the static build's GSAP code to Motion.
 *
 * Three rules carried over, all learned the hard way and all still load-bearing:
 *
 * 1. NO HIDDEN STATE IN CSS. Every offset and opacity is applied at runtime via
 *    `initial`, so if the JS fails or motion is reduced the page renders
 *    complete and static rather than blank.
 * 2. Line masks must be TALLER than the line box or they clip descenders — ink
 *    runs ~1.20em against a line-height:1 box. `.line-mask` handles that; the
 *    reveal offset below has to clear the taller mask.
 * 3. Anything that starts hidden needs a way to become visible that does NOT
 *    depend on an IntersectionObserver entry arriving. See `useRevealed`.
 */

import { motion, useScroll, useSpring, useTransform, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

const EASE = [0.19, 1, 0.22, 1] as const;

/**
 * Stands in for GSAP's `scrub: 0.6`.
 *
 * ScrollTrigger's scrub eases the playhead toward the scroll position over
 * ~0.6s rather than pinning to it, and that lag is most of what made the
 * objects read as drifting. Mapping scroll straight onto a transform is
 * technically the same travel but feels rigid — the motion stops looking like
 * motion. Overdamped so it trails and settles without overshooting.
 */
const SCRUB = { stiffness: 120, damping: 30, restDelta: 0.0005 } as const;

/**
 * Reveal gate: an IntersectionObserver plus a fallback sweep.
 *
 * This replaces Motion's `whileInView`, which has no escape hatch if the
 * observer never delivers an entry — and on this project that has stranded
 * content twice. The first time, 4 of 9 sections sat permanently invisible.
 * The second time the *fix* stranded them, because the safety path was routed
 * through requestAnimationFrame, which is exactly what gets suspended.
 *
 * So the sweep below runs directly on `load`, `pageshow` and `visibilitychange`
 * with no rAF anywhere in the path, and reveals any element that is already
 * within the viewport or has been scrolled past.
 *
 * The observer uses `threshold: 0` deliberately. A fractional threshold cannot
 * be satisfied by an element taller than the viewport — 15% of a 3000px section
 * never fits on screen — which is a stranding cause in its own right. The
 * "wait until it is properly on screen" feel comes from the bottom rootMargin.
 */
function useRevealed(ref: RefObject<HTMLElement | null>, rootMargin = "0px 0px -10% 0px") {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setRevealed(true);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) show();
        if (done) io.disconnect();
      },
      { threshold: 0, rootMargin },
    );
    io.observe(el);

    // If it is on screen (or already behind us, e.g. a restored scroll position
    // or an in-page #anchor load) it must be visible, entry or no entry.
    const sweep = () => {
      if (done) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) show();
      else if (r.bottom <= 0) show();
      if (done) io.disconnect();
    };

    sweep();
    window.addEventListener("load", sweep);
    window.addEventListener("pageshow", sweep);
    document.addEventListener("visibilitychange", sweep);
    return () => {
      io.disconnect();
      window.removeEventListener("load", sweep);
      window.removeEventListener("pageshow", sweep);
      document.removeEventListener("visibilitychange", sweep);
    };
  }, [ref, rootMargin]);

  return revealed;
}

/** Block reveal: rise and fade, once, on enter. */
export function Reveal({
  children, delay = 0, y = 26, className,
}: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const revealed = useRevealed(ref);
  const shown = reduce || revealed;
  return (
    <motion.div
      ref={ref}
      className={className}
      data-revealed={shown ? "1" : "0"}
      initial={reduce ? false : { opacity: 0, y }}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 1.1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Masked line reveal. Splits on authored line breaks rather than measuring
 * wrapped lines: the static build measured `offsetTop` per word and had to
 * re-split on every width change — and that re-split degrades to one word per
 * line after a resize, which is still visible on the old static site.
 * Authoring the breaks removes that whole class of bug, at the cost of writing
 * them by hand.
 */
export function SplitLines({
  lines, className, as: Tag = "h2", delay = 0,
}: { lines: string[]; className?: string; as?: "h1" | "h2" | "h3"; delay?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLHeadingElement>(null);
  const revealed = useRevealed(ref, "0px 0px -12% 0px");
  const shown = reduce || revealed;
  return (
    <Tag ref={ref} className={className} data-revealed={shown ? "1" : "0"}>
      {lines.map((line, i) => (
        <span key={i} className="line-mask">
          <motion.span
            className="block"
            initial={reduce ? false : { y: "135%" }}
            animate={shown ? { y: "0%" } : { y: "135%" }}
            transition={{ duration: 1.1, ease: EASE, delay: delay + i * 0.08 }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/**
 * Per-character hero assembly. Words are wrapped in a nowrap block and joined
 * by real spaces so the ONLY break opportunity is a space — the static build
 * joined with a non-breaking space, which left mid-character as the only legal
 * break and produced "David Josep / h".
 *
 * No reveal gate here: this is above the fold by definition and animates on
 * mount, so there is no observer to miss.
 *
 * `still` renders the identical span structure with the entrance stripped out.
 * That exists so PointerReveal's overlay copy can be guaranteed to wrap exactly
 * like the real heading — same component, same classes, same container — rather
 * than being a hand-rolled duplicate that drifts out of step the first time the
 * wrapping rules change.
 */
export function SplitChars({
  text, className, still = false,
}: { text: string; className?: string; still?: boolean }) {
  const reduce = useReducedMotion();
  let n = 0;
  return (
    <span className={className}>
      {text.split(" ").map((word, wi) => (
        <span key={wi}>
          {wi > 0 ? " " : null}
          <span className="char-word">
            {word.split("").map((ch, ci) => {
              const i = n++;
              return (
                <span key={ci} className="char-mask">
                  {still ? (
                    <span className="inline-block">{ch}</span>
                  ) : (
                    <motion.span
                      className="inline-block"
                      initial={reduce ? false : { y: "155%" }}
                      animate={{ y: "0%" }}
                      transition={{ duration: 1.05, ease: EASE, delay: 0.12 + i * 0.024 }}
                    >
                      {ch}
                    </motion.span>
                  )}
                </span>
              );
            })}
          </span>
        </span>
      ))}
    </span>
  );
}

/**
 * Scroll-driven drift for the discipline and work objects. Replaces GSAP
 * ScrollTrigger scrub with useScroll + useSpring + useTransform.
 *
 * Travel matches the static build exactly: yPercent 9 -> -9 and rotate -5 -> 5,
 * flipped per object, across `top bottom` -> `bottom top`. Transform-only, so
 * the compositor owns it.
 */
export function Drift({
  children, dir = 1, className,
}: { children: ReactNode; dir?: 1 | -1; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const p = useSpring(scrollYProgress, SCRUB);
  const y = useTransform(p, [0, 1], [`${9 * dir}%`, `${-9 * dir}%`]);
  const rotate = useTransform(p, [0, 1], [-5 * dir, 5 * dir]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y, rotate }}>{children}</motion.div>
    </div>
  );
}

/**
 * The hero knot's drift, which is a different move from the others: it tracks
 * the HERO SECTION rather than itself, running from the top of the page until
 * the hero has scrolled fully past, and it drifts one way only (0 -> 14%,
 * 0 -> 8deg) instead of passing through centre.
 *
 * It renders its own layer so the caller can keep static positioning — and any
 * Tailwind translate — on an outer element. Motion writes `transform`, so a
 * utility class like `-translate-y-[42%]` on the same node would be clobbered.
 */
export function HeroDrift({
  containerRef, children, className,
}: { containerRef: RefObject<HTMLElement | null>; children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const p = useSpring(scrollYProgress, SCRUB);
  const y = useTransform(p, [0, 1], ["0%", "14%"]);
  const rotate = useTransform(p, [0, 1], [0, 8]);
  return (
    <motion.div className={className} style={reduce ? undefined : { y, rotate }}>
      {children}
    </motion.div>
  );
}

/** Clip-wipe for the work screenshots. */
export function WipeIn({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const revealed = useRevealed(ref, "0px 0px -12% 0px");
  const shown = reduce || revealed;
  const HIDDEN = "inset(100% 0% 0% 0%)";
  const VISIBLE = "inset(0% 0% 0% 0%)";
  return (
    <motion.div
      ref={ref}
      className={className}
      data-revealed={shown ? "1" : "0"}
      initial={reduce ? false : { clipPath: HIDDEN }}
      animate={shown ? { clipPath: VISIBLE } : { clipPath: HIDDEN }}
      transition={{ duration: 1.15, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
