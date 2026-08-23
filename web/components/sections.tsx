"use client";

/**
 * Every page section. In one file deliberately: these are consumed only by
 * app/page.tsx and never reused, so splitting them across ten files would add
 * navigation cost without buying any reuse.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  NAV, HERO, ABOUT, MARQUEE, DISCIPLINES, EXPERIENCE, WORK, CREDENTIALS, CONTACT, HUE,
} from "@/lib/content";
import { Reveal, SplitLines, SplitChars, Drift, HeroDrift, WipeIn } from "./motion";
import {
  Lens, Compare, StickyReveal, Magnetic, Tilt, TiltLift, Highlight, PointerReveal,
} from "./interactive";

const shell = "mx-auto w-full max-w-[1280px] px-5 md:px-8";
/** Pin angles for the credentials board. Fixed, not random — see Credentials. */
const PIN = [-1.4, 0.9, -0.6, 1.2, -1.1, 0.5];
const section = "py-[clamp(80px,10vw,140px)]";

/** The recurring signature: every section opens with one. */
function Anno({ n, children }: { n?: string; children: string }) {
  return (
    <p className="mb-7 text-[17px] leading-[1.15] text-muted">
      {"{ "}
      {n ? <span className="text-cream">{n}</span> : null}
      {n ? " — " : null}
      {children}
      {" }"}
    </p>
  );
}

/** Outlined only. No filled CTA exists in this system. */
function Pill({
  href, children, gradient, external,
}: { href: string; children: React.ReactNode; gradient?: boolean; external?: boolean }) {
  const base =
    "inline-flex items-center gap-2 rounded-[100px] px-[26px] py-[15px] " +
    "text-[18px] font-semibold leading-[1.05] transition-colors duration-500";
  const ext = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  if (gradient) {
    return (
      <Magnetic>
        <a href={href} {...ext} className={`${base} relative text-cream hover:text-brand-lt`}>
          {/* Gradient stroke via mask — still no fill, per the system. The conic
              angle animates, so the light travels the outline: an animated form of
              the one chromatic escalation DESIGN.md already permits. Repaint is
              confined to a ~200x54 rim and stops under reduced motion. */}
          <span
            aria-hidden
            className="cta-ring pointer-events-none absolute inset-0 rounded-[100px] p-[1.5px]"
            style={{
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
          {children}
        </a>
      </Magnetic>
    );
  }
  return (
    <Magnetic>
      <a href={href} {...ext}
         className={`${base} border border-cream text-cream hover:border-brand hover:text-brand`}>
        {children}
      </a>
    </Magnetic>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[8px] border border-hair px-3.5 py-2 text-[15px] leading-[1.15] text-cream">
      {children}
    </span>
  );
}

/**
 * Window chrome for the project shots.
 *
 * The three sources run 1.01, 1.99 and 2.01 aspect, so the bare images gave the
 * section three different framings — the square one pillarboxed by ~30% a side,
 * the other two letterboxed — in the part of the page that carries the actual
 * evidence. The chrome supplies one consistent 16:9 for all of them, and it
 * gives the raw white app UI a reason to be white: it reads as a screen rather
 * than as a white rectangle on a warm near-black page.
 *
 * Still `contain`, and the letterboxing is now correct rather than merely
 * tolerated: inside a titled window, a narrow page in a wide viewport is what a
 * browser actually looks like, and the --panel step reads as the window's own
 * background. `cover` was tried here and reverted — the AQI source is 852px
 * wide, so filling a 1216px frame upscales it 1.43x, and nothing on this site
 * renders above its native size. Contain scales all three DOWN (0.81x, 0.76x,
 * 0.76x), which is also what keeps them sharp.
 *
 * The label is the live host where one exists and the project name otherwise.
 * Two of the three have no deployment, and putting a github.com URL above a
 * screenshot that is not github.com would be a caption that lies.
 */
function Frame({ src, alt, label }: { src: string; alt: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-hair bg-panel">
      <div className="flex items-center gap-3.5 border-b border-hair px-4 py-3">
        <span aria-hidden className="flex shrink-0 gap-[7px]">
          <span className="size-[10px] rounded-[100px] bg-hair" />
          <span className="size-[10px] rounded-[100px] bg-hair" />
          <span className="size-[10px] rounded-[100px] bg-hair" />
        </span>
        <span className="truncate rounded-[100px] bg-canvas px-3.5 py-1.5 text-[13px] leading-[1.15] text-muted">
          {label}
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy"
           className="aspect-video w-full object-contain" />
    </div>
  );
}

function Obj({ name }: { name: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/assets/objects/${name}.webp`} alt="" aria-hidden loading="lazy" className="w-full" />;
}

/* ---------------- nav ---------------- */

export function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  /**
   * Which section you are in, over a 13,500px document with six nav links and
   * previously no indication at all.
   *
   * Read straight from geometry against a line at 45% of the viewport, rather
   * than from IntersectionObserver. Two IO attempts failed here and both failed
   * SILENTLY, which is the reason for the note: reacting to `isIntersecting`
   * alone is sticky, so a layout shift during image load leaves a section
   * marked while you are looking at the hero; caching entries in a map instead
   * lets a stale `true` shadow a later section, so it reported "About" while
   * the viewport was in Experience. Geometry has no delivery order to get
   * wrong.
   *
   * The scroll handler is rAF-coalesced and passive, and does nothing but read
   * six rects and set a string. This is not the scroll-driven ANIMATION this
   * project removed — nothing here re-drives a timeline from JS.
   *
   * `cur` takes the LAST section that has started rather than the one
   * containing the line, so the ~130px marquee gap between About and
   * Disciplines keeps the previous dot instead of blanking it. Before the first
   * section, nothing is marked — the hero is not a nav item.
   */
  useEffect(() => {
    const els = NAV
      .map((n) => document.getElementById(n.href.slice(1)))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;

    let raf = 0;
    const compute = () => {
      raf = 0;
      const line = window.innerHeight * 0.45;
      let cur: string | null = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top > line) break;
        cur = `#${el.id}`;
      }
      setActive(cur);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(compute); };

    compute();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <nav className="pointer-events-none fixed inset-x-0 top-0 z-100 h-[72px] bg-linear-to-b from-canvas/90 to-transparent">
      <div className="flex h-full items-center justify-between px-5 md:px-8">
        <a href="#top" aria-label="David Joseph Cortez — home"
           className="pointer-events-auto inline-flex items-center gap-[9px] text-[17px] font-semibold tracking-[-0.01em]">
          {/* 26px keeps the three trailing dots distinct; below ~22px the
              smallest falls under a pixel and the dissolve reads as fringe. */}
          <svg viewBox="0 0 128 128" aria-hidden className="block size-[26px] shrink-0">
            <g className="logo-mark">
              <path d="M 88.43 93.11 A 38 38 0 1 1 52.26 27.86" fill="none"
                    stroke="#0ae448" strokeWidth="12" strokeLinecap="round" />
              <circle cx="64.66" cy="26.01" r="4.08" fill="#0ae448" />
              <circle cx="77.00" cy="28.29" r="2.77" fill="#0ae448" />
              <circle cx="87.91" cy="34.47" r="1.89" fill="#0ae448" />
            </g>
          </svg>
          <span>Cortez<span className="text-brand">.</span></span>
        </a>

        <ul className="pointer-events-auto hidden gap-[22px] md:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href}
                 aria-current={active === n.href ? "true" : undefined}
                 className="relative text-[16px] leading-[1.15] text-cream transition-colors duration-300 hover:text-brand">
                {n.label}
                {/* A dot, not an underline or a colour change: the mark is a C
                    built from dots and the wordmark ends in one, so the page
                    already has a vocabulary for "you are here". Colour is
                    reserved for taxonomy, and hover already owns brand green.
                    scale/translate compile to their own properties in Tailwind
                    v4, so the two compose instead of overwriting each other. */}
                <span aria-hidden
                      className={`absolute -bottom-[9px] left-1/2 size-[5px] -translate-x-1/2 rounded-[100px] bg-brand transition-[opacity,scale] duration-300 ${
                        active === n.href ? "scale-100 opacity-100" : "scale-0 opacity-0"
                      }`} />
              </a>
            </li>
          ))}
        </ul>

        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
                aria-controls="mobile-nav"
                className="pointer-events-auto rounded-[100px] border border-cream px-[18px] py-[9px] text-[15px] font-semibold md:hidden">
          Menu
        </button>
      </div>

      {open ? (
        <ul id="mobile-nav"
            className="pointer-events-auto absolute inset-x-0 top-[72px] bg-panel px-5 pb-6 md:hidden">
          {NAV.map((n) => (
            <li key={n.href} className="border-t border-hair">
              <a href={n.href} onClick={() => setOpen(false)}
                 aria-current={active === n.href ? "true" : undefined}
                 className={`block py-4 text-[18px] ${active === n.href ? "text-brand" : ""}`}>
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
}

/* ---------------- hero ---------------- */

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  return (
    <header id="top" ref={heroRef}
            className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-[110px] pb-[70px] md:pt-[140px] md:pb-[90px]">
      {/* z-0, under every content layer, and aria-hidden: it is texture. */}
      <div aria-hidden className="chalk-grid pointer-events-none absolute inset-0 z-0" />
      <div className={`${shell} hero-container relative`}>
        <Reveal y={16} delay={0.1}>
          <p className="mb-[clamp(24px,4vw,44px)] flex flex-wrap items-center gap-[18px] text-[11px] leading-[1.36] text-white/70">
            {HERO.eyebrow.map((e, i) => <span key={i}>{e}</span>)}
          </p>
        </Reveal>

        {/* The overlay is the same component in `still` mode, so it cannot wrap
            differently from the heading it sits on top of. */}
        <PointerReveal
          className="t-display relative z-2 font-semibold tracking-[-0.02em]"
          overlay={
            <>
              <SplitChars text={HERO.given} className="block" still />
              <SplitChars text={HERO.family} className="block" still />
            </>
          }
        >
          <h1 className="t-display font-semibold tracking-[-0.02em]">
            <SplitChars text={HERO.given} className="block" />
            <SplitChars text={HERO.family} className="block text-brand" />
          </h1>
        </PointerReveal>

        {/* Bleeds past the container rather than sitting inside it. Split in
            two because the entrance and the scroll drift both want `transform`
            on the same node and would overwrite each other: HeroDrift owns the
            scroll transform, the img keeps its own entrance. Positioning sits
            on the outer div, where Tailwind's `md:-translate-y-[42%]` compiles
            to the standalone `translate` property and so composes with both. */}
        <div className="pointer-events-none absolute right-[-8%] bottom-[6%] z-1 w-[clamp(180px,52vw,300px)] md:top-[44%] md:right-[-4%] md:bottom-auto md:w-[clamp(260px,34vw,520px)] md:-translate-y-[42%]">
          <HeroDrift containerRef={heroRef}>
            <motion.img
              src="/assets/objects/hero-knot.webp" alt="" aria-hidden
              initial={{ opacity: 0, scale: 0.86, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.6, ease: [0.19, 1, 0.22, 1], delay: 0.45 }}
              className="w-full"
            />
          </HeroDrift>
        </div>

        <Reveal delay={0.72}>
          <p className="relative z-2 mt-10 max-w-[30em] text-[19px] text-muted">
            {HERO.sub}
            <Highlight>
              <strong className="font-normal text-cream">{HERO.subEm}</strong>
            </Highlight>.
          </p>
        </Reveal>

        <Reveal delay={0.86}>
          <div className="relative z-2 mt-[38px] flex flex-wrap gap-3.5">
            <Pill href="#work" gradient>Selected work</Pill>
            <Pill href="/Cortez_CV.pdf" external>Curriculum vitae</Pill>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div className="relative z-2 mt-16 flex flex-wrap gap-7 border-t border-hair pt-6 text-[16px] leading-[1.15] text-muted">
            {HERO.stats.map((s) => (
              <span key={s.label}><b className="font-semibold text-cream">{s.n}</b> {s.label}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </header>
  );
}

/* ---------------- about ---------------- */

export function About() {
  return (
    <section id="about" className={`${section} overflow-x-clip`}>
      <div className={shell}>
        <Reveal><Anno n="01">about</Anno></Reveal>
        <div className="grid items-start gap-[clamp(32px,6vw,80px)] lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SplitLines as="h2"
                        className="text-[clamp(34px,5vw,66px)] font-semibold leading-none tracking-[-0.02em]"
                        lines={["Building things that hold up", "outside the notebook."]} />
            {ABOUT.body.map((p, i) => (
              <Reveal key={i} delay={0.05 * i}>
                <p className="mt-6 text-[19px] text-muted">{p}</p>
              </Reveal>
            ))}
            <Reveal>
              <p className="mt-6 inline-flex items-center gap-2.5 text-[16px] text-muted">
                <span className="size-[7px] rounded-full bg-brand" />Open to opportunities
              </p>
            </Reveal>
          </div>
          <Reveal>
            {/* This was the only image on the page sitting neatly inside its box,
                which DESIGN.md names as the one thing that kills the object
                layer. It now runs past the shell edge the way the hero knot
                does; the section clips the overflow rather than scrolling it.
                Not an object overlapping it: all eight objects already carry an
                assigned meaning (four disciplines, three projects, him), and
                borrowing one here would spend a taxonomy slot on decoration. */}
            <figure className="relative max-w-[380px] overflow-hidden rounded-[8px] bg-panel lg:max-w-none lg:-mr-[clamp(32px,8vw,140px)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/portrait.jpg" alt="David Joseph Cortez"
                   className="aspect-3/4 w-full object-cover object-[center_18%]" />
              {/* The studio blue is the largest off-taxonomy colour area on the
                  page. The system forbids desaturating photography, so instead
                  the lower edge dissolves into the canvas and the frame stops
                  reading as a pasted rectangle. It falls over black trousers
                  and blue backdrop, not over his face. */}
              <span aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-linear-to-t from-canvas to-transparent" />
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- marquee ---------------- */

export function Marquee() {
  const reduce = useReducedMotion();
  const run = [...MARQUEE, ...MARQUEE];
  return (
    <div aria-hidden className="overflow-hidden border-y border-hair py-[22px] whitespace-nowrap">
      <motion.div
        className="inline-block"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 44, ease: "linear", repeat: Infinity }}
      >
        {run.map((w, i) => (
          <span key={i} className="pr-[0.5em] text-[clamp(28px,4vw,54px)] font-semibold tracking-[-0.02em]">
            {w}<span className="text-brand"> · </span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ---------------- disciplines ---------------- */

export function Disciplines() {
  return (
    <section id="disciplines" className={section}>
      <div className={shell}>
        <Reveal><Anno n="02">disciplines</Anno></Reveal>
        <SplitLines as="h2" lines={["Four things I actually do."]}
                    className="mb-[clamp(32px,4vw,56px)] text-[clamp(34px,5vw,66px)] font-semibold leading-none tracking-[-0.02em]" />
        {DISCIPLINES.map((d, i) => (
          <div key={d.label}
               className="grid items-center gap-[clamp(28px,5vw,72px)] border-t border-hair py-[clamp(40px,5vw,64px)] lg:grid-cols-[minmax(220px,0.85fr)_1.15fr]">
            {/* capped so it never renders above its natural size in the wider column */}
            <Drift dir={i % 2 ? -1 : 1}
                   className={`mx-auto w-full max-w-[300px] lg:max-w-[460px] ${i % 2 ? "lg:order-2" : ""}`}>
              <Obj name={d.object} />
            </Drift>
            <div>
              <Reveal>
                <p className="mb-3.5 text-[17px] font-semibold leading-[1.15]" style={{ color: HUE[d.hue] }}>
                  {d.label}
                </p>
              </Reveal>
              <SplitLines as="h3" lines={[d.title]}
                          className="mb-4 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.05] tracking-[-0.02em]" />
              <Reveal>
                <p className="mb-5 max-w-[36em] text-[16px] text-muted">{d.copy}</p>
                <div className="flex flex-wrap gap-2">{d.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
              </Reveal>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- experience ---------------- */

export function Experience() {
  const e = EXPERIENCE;
  return (
    <section id="experience" className={section}>
      <div className={shell}>
        <Reveal><Anno n="03">experience</Anno></Reveal>
        <div className="grid items-start gap-[clamp(32px,6vw,80px)] lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <SplitLines as="h2" lines={[e.heading]}
                        className="mb-5 text-[clamp(34px,5vw,66px)] font-semibold leading-none tracking-[-0.02em]" />
            <Reveal><p className="max-w-[34em] text-[19px] text-muted">{e.lede}</p></Reveal>
          </div>
          <Reveal>
            <div className="space-y-3">
              <p className="text-[16px] leading-[1.15] text-muted">{e.role}</p>
              <p className="text-[16px]">{e.org[0]}<br />{e.org[1]}</p>
              <p className="text-[16px] leading-[1.15] text-muted">{e.dates}</p>
              <div className="pt-2.5">
                <Pill href="/Cortez_Narrative_Report.pdf" external>Narrative report</Pill>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <div className="mt-[clamp(44px,6vw,72px)] grid gap-4 md:grid-cols-3">
            {e.triad.map((t) => (
              <div key={t.k} className="rounded-[8px] bg-panel p-6">
                <p className="text-[16px] font-semibold leading-[1.15] text-brand">{t.k}</p>
                <p className="mt-2.5 text-[16px] text-muted">{t.v}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* The seven contributions carry the substance of this project, and as a
            flat list nobody read them. Full width so the pinned panel has room. */}
        <div className="mt-[clamp(44px,6vw,72px)]">
          <StickyReveal items={e.contributions} eyebrow={<Anno>key contributions</Anno>} />
        </div>

        <Reveal>
          <div className="mt-[clamp(44px,6vw,72px)] grid gap-[clamp(32px,6vw,72px)] lg:grid-cols-2">
            <div>
              <Anno>stack</Anno>
              <div className="flex flex-wrap gap-2">{e.stack.map((t) => <Tag key={t}>{t}</Tag>)}</div>
            </div>
            <div>
              <Anno>public-safe overview</Anno>
              <p className="text-[16px] text-muted">{e.confidential}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {e.flow.map((f) => (
                  <span key={f}
                        className="rounded-[100px] border border-hair px-4 py-2.5 text-[15px] leading-[1.15] text-muted">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Shows the transformation instead of describing it. The left frame is
            a GENERIC ILLUSTRATION with invented lot numbers, not a capture of
            anything internal — the caption says so, and it must keep saying so. */}
        <Reveal>
          <div className="mt-[clamp(44px,6vw,72px)]">
            <Anno>what changed</Anno>
            <Compare
              before="/assets/mbo-before-worksheet.jpg"
              after="/assets/mbo-dashboard.jpg"
              beforeAlt="Illustration of a manual spreadsheet workflow: missing cells, ad-hoc remarks and duplicated sheet tabs"
              afterAlt="MBO Sawing Report System workflow dashboard"
              beforeLabel="Spreadsheet"
              afterLabel="The system"
            />
            <p className="mt-3.5 text-[15px] leading-[1.4] text-muted">
              Drag to compare. The spreadsheet frame is an illustration with invented
              data — actual worksheets, operational data and workflows remain confidential.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-[clamp(44px,6vw,72px)] grid gap-4 md:grid-cols-2">
            {e.shots.map((s) => (
              <figure key={s.src}>
                <Lens src={s.src} alt={s.alt} />
                {/* muted, not hair: hair is 1.9:1 and the system reserves it for
                    hairlines. Hidden without a fine pointer, where it would be
                    instructing the reader to do something they cannot do. */}
                <figcaption className="px-1 pt-4 text-[15px] leading-[1.4] text-muted">
                  {s.caption}
                  <span className="ml-1.5 hidden pointer-fine:inline">— hover to magnify</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- work ---------------- */

export function Work() {
  // overflow-x-clip: the objects deliberately overhang, pushing ~30px past the
  // viewport at narrow widths. `clip` contains that without creating a scroll
  // container the way `hidden` would.
  return (
    <section id="work" className={`${section} overflow-x-clip`}>
      <div className={shell}>
        <Reveal><Anno n="04">work</Anno></Reveal>
        <SplitLines as="h2" lines={["Selected projects."]}
                    className="mb-[clamp(24px,3vw,40px)] text-[clamp(34px,5vw,66px)] font-semibold leading-none tracking-[-0.02em]" />
        {WORK.map((w) => (
          <article key={w.title} className="border-t border-hair py-[clamp(40px,5vw,64px)]">
            <div className="mb-7 grid items-baseline gap-2 md:grid-cols-[auto_1fr_auto] md:gap-6">
              <span className="text-[16px] leading-[1.15] text-muted">{`{ ${w.idx} }`}</span>
              <span className="text-[17px] font-semibold leading-[1.15]" style={{ color: HUE[w.hue] }}>{w.kind}</span>
              <a href={w.live ?? w.href} target="_blank" rel="noopener noreferrer"
                 className="text-[16px] leading-[1.15] text-muted transition-colors hover:text-brand">
                {w.cta}
              </a>
            </div>

            <Tilt>
              <WipeIn className="overflow-hidden rounded-[8px]">
                <Frame src={w.shot} alt={w.alt}
                       label={w.live ? new URL(w.live).host : w.title} />
              </WipeIn>
              {/* Positioning moves out to TiltLift, which owns translateZ, so
                  Drift keeps sole ownership of `transform` on its own node. */}
              <TiltLift className="pointer-events-none absolute right-[-2%] bottom-[-8%] z-2 w-[clamp(90px,26vw,150px)] md:right-[-3%] md:bottom-[-12%] md:w-[clamp(120px,17vw,230px)]">
                <Drift dir={-1}>
                  <Obj name={w.object} />
                </Drift>
              </TiltLift>
            </Tilt>

            <div className="mt-7 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <SplitLines as="h3" lines={[w.title]}
                            className="text-[clamp(26px,3vw,40px)] font-semibold leading-[1.05] tracking-[-0.02em]" />
                <Reveal>
                  <p className="mt-2.5 max-w-[40em] text-[16px] text-muted">{w.copy}</p>
                  <div className="mt-4 flex flex-wrap gap-2">{w.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
                </Reveal>
              </div>
              <Reveal><Pill href={w.href} external>GitHub</Pill></Reveal>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- credentials ---------------- */

export function Credentials() {
  return (
    <section id="credentials" className={section}>
      <div className={shell}>
        <Reveal><Anno n="05">credentials</Anno></Reveal>
        <SplitLines as="h2" lines={["Certifications & badges."]}
                    className="mb-[clamp(28px,3vw,44px)] text-[clamp(34px,5vw,66px)] font-semibold leading-none tracking-[-0.02em]" />
        <Reveal>
          {/* Sibling dimming, after Aceternity's `focus cards` — but by opacity,
              never their blur: `filter` is what made this page lag, and the
              whole interactive layer is transform/opacity/clip-path only. */}
          <div className="group/creds grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CREDENTIALS.map((c, i) => (
              /* Pinned to a board rather than set in a grid — the north star is
                 a studio wall, and six identical rectangles was the flattest
                 block on the page. The angles come from a fixed table, never
                 Math.random(): this is a static export, and a random value
                 would differ between the prerender and hydration. Straightens
                 under the pointer, so the one you are reading is the one
                 sitting square. */
              <a key={c.name} href={c.href} target="_blank" rel="noopener noreferrer"
                 style={{ ["--tilt" as string]: `${PIN[i % PIN.length]}deg` }}
                 className="grid grid-cols-[auto_1fr] items-center gap-[18px] rounded-[8px] bg-panel p-[22px] rotate-[var(--tilt)] transition-[color,background-color,opacity,rotate] duration-500 group-hover/creds:opacity-50 hover:rotate-0 hover:bg-[#20211f] hover:opacity-100!">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt="" loading="lazy" className="size-[52px] object-contain" />
                <span>
                  {/* both were inline in the static build, so the name ran into the issuer */}
                  <span className="block text-[18px] font-semibold leading-[1.25]">{c.name}</span>
                  <span className="mt-1.5 block text-[15px] leading-[1.4] text-muted">{c.issuer}</span>
                </span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- contact ---------------- */

export function Contact() {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    // Video decode is hardware-accelerated, so it is cheap even on a phone —
    // unlike main-thread effects. The real mobile cost is the ~1MB download, so
    // the gate is Save-Data and connection type, not pointer type.
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "")) return;
    const v = ref.current;
    if (!v) return;
    // Two traps here, both hit in testing:
    // 1. play() is what actually starts the fetch — with preload="none" a bare
    //    load() never buffers, so a "canplay" listener never fires at all.
    // 2. The data can already be there by the time this effect runs, so the
    //    event would have fired before we subscribed. Check readyState first.
    // Visibility is deliberately not tied to playback: if autoplay is blocked
    // the frame should still show, the way the static build's plain CSS did.
    const onReady = () => setReady(true);
    if (v.readyState >= 2) setReady(true);
    v.addEventListener("loadeddata", onReady);
    v.addEventListener("playing", onReady);
    v.play().catch(() => {});
    return () => {
      v.removeEventListener("playing", onReady);
      v.removeEventListener("loadeddata", onReady);
    };
  }, [reduce]);

  return (
    <section id="contact" className={`${section} relative overflow-hidden`}>
      <div aria-hidden className="absolute inset-0 z-0">
        <video ref={ref} muted loop playsInline preload="none"
               className={`size-full object-cover transition-opacity duration-1000 ${ready ? "opacity-[0.42]" : "opacity-0"}`}>
          <source src="/assets/hero-loop.webm" type="video/webm" />
          <source src="/assets/hero-loop.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0"
             style={{ background: "linear-gradient(100deg, rgba(14,16,15,.94) 0%, rgba(14,16,15,.88) 42%, rgba(14,16,15,.66) 68%, rgba(14,16,15,.34) 88%, rgba(14,16,15,.2) 100%)" }} />
      </div>

      {/* The page --muted measures only 2.33:1 against the brightest video
          frame. #cfcfc0 measures 4.90:1 and stays 1.5x dimmer than cream. */}
      <div className={`${shell} relative z-1 [--tone:#cfcfc0]`}>
        <Reveal>
          <p className="mb-7 text-[17px] leading-[1.15] text-[var(--tone)]">{"{ 06 — contact }"}</p>
        </Reveal>
        <SplitLines as="h2" lines={["Let's build", "something together."]}
                    className="text-[clamp(44px,7vw,112px)] font-semibold leading-[0.95] tracking-[-0.02em]" />
        <Reveal>
          <p className="mt-6 max-w-[34em] text-[19px] text-[var(--tone)]">
            Open to internships, freelance work, or full-time roles in data science, analytics or software development.
          </p>
        </Reveal>
        <Reveal>
          <div className="mt-[clamp(40px,5vw,64px)] flex flex-col">
            {CONTACT.map((c, i) => (
              <a key={c.href} href={c.href}
                 {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                 className={`flex items-center justify-between gap-6 border-b border-hair py-6 text-[clamp(20px,2.6vw,34px)] font-semibold tracking-[-0.02em] transition-all duration-500 hover:pl-3.5 hover:text-brand ${i === 0 ? "border-t" : ""}`}>
                <span>{c.label}</span>
                <span className="shrink-0 text-[16px] font-normal text-[var(--tone)]">{c.kind}</span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- footer ---------------- */

export function Footer() {
  return (
    <footer className="bg-panel pt-16 pb-14">
      <div className={`${shell} grid gap-6 text-[15px] leading-[1.5] text-muted md:grid-cols-3`}>
        <p>David Joseph Cortez<br />Laguna, Philippines</p>
        <p>B.S. Computer Science<br />Data Science &amp; Analytics</p>
        <p>© 2026 — All rights reserved</p>
      </div>
    </footer>
  );
}
