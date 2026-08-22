"use client";

/**
 * Motion primitives, ported from the static build's GSAP code to Motion.
 *
 * Two rules carried over, both learned the hard way and both still load-bearing:
 *
 * 1. NO HIDDEN STATE IN CSS. Every offset and opacity is applied at runtime via
 *    `initial`, so if the JS fails or motion is reduced the page renders
 *    complete and static rather than blank.
 * 2. Line masks must be TALLER than the line box or they clip descenders — ink
 *    runs ~1.20em against a line-height:1 box. `.line-mask` handles that; the
 *    reveal offset below has to clear the taller mask.
 */

import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";

const EASE = [0.19, 1, 0.22, 1] as const;

/** Block reveal: rise and fade, once, on enter. */
export function Reveal({
  children, delay = 0, y = 26, className,
}: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Masked line reveal. Splits on authored line breaks rather than measuring
 * wrapped lines: the static build measured `offsetTop` per word and had to
 * re-split on every width change. Authoring the breaks removes that whole class
 * of bug, at the cost of writing them by hand.
 */
export function SplitLines({
  lines, className, as: Tag = "h2", delay = 0,
}: { lines: string[]; className?: string; as?: "h1" | "h2" | "h3"; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span key={i} className="line-mask">
          <motion.span
            className="block"
            initial={reduce ? false : { y: "135%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, amount: 0.2, margin: "0px 0px -12% 0px" }}
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
 * joined with &nbsp;, which left mid-character as the only legal break and
 * produced "David Josep / h".
 */
export function SplitChars({ text, className }: { text: string; className?: string }) {
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
                  <motion.span
                    className="inline-block"
                    initial={reduce ? false : { y: "155%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 1.05, ease: EASE, delay: 0.12 + i * 0.024 }}
                  >
                    {ch}
                  </motion.span>
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
 * Scroll-driven drift. Replaces GSAP ScrollTrigger `scrub` with useScroll +
 * useTransform — same idea, mapping scroll progress across the element onto a
 * transform. Transform-only, so the compositor owns it.
 */
export function Drift({
  children, dir = 1, className,
}: { children: ReactNode; dir?: 1 | -1; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${9 * dir}%`, `${-9 * dir}%`]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-5 * dir, 5 * dir]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y, rotate }}>{children}</motion.div>
    </div>
  );
}

/** Clip-wipe for the work screenshots. */
export function WipeIn({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.15, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
