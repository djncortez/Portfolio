import type { ReactNode } from "react";

/**
 * The three tools whose marks will not reduce to a single currentColor path,
 * so they cannot live in LOGO alongside the simple-icons glyphs.
 *
 * All three are absent from simple-icons on trademark grounds and were taken
 * from their Wikimedia Commons SVGs, then stripped to one colour: the sources
 * are built out of gradients (Power BI has three, VS Code one) which carry no
 * meaning in a system that spends all five of its hues on taxonomy.
 *
 * Each renders on its own art board rather than a normalised 24, because
 * rescaling the path data by hand is how coordinates drift.
 */
export const MARK: Record<string, { box: number; el: ReactNode }> = {
  /* The mask inside the source already holds the whole silhouette as one
     evenodd path, which is exactly the monochrome form. */
  "VS Code": {
    box: 100,
    el: <path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="M70.9119 99.3171C72.4869 99.9307 74.2828 99.8914 75.8725 99.1264L96.4608 89.2197C98.6242 88.1787 100 85.9892 100 83.5872V16.4133C100 14.0113 98.6243 11.8218 96.4609 10.7808L75.8725 0.873756C73.7862 -0.130129 71.3446 0.11576 69.5135 1.44695C69.252 1.63711 69.0028 1.84943 68.769 2.08341L29.3551 38.0415L12.1872 25.0096C10.589 23.7965 8.35363 23.8959 6.86933 25.2461L1.36303 30.2549C-0.452552 31.9064 -0.454633 34.7627 1.35853 36.417L16.2471 50.0001L1.35853 63.5832C-0.454633 65.2374 -0.452552 68.0938 1.36303 69.7453L6.86933 74.7541C8.35363 76.1043 10.589 76.2037 12.1872 74.9905L29.3551 61.9587L68.769 97.9167C69.3925 98.5406 70.1246 99.0104 70.9119 99.3171ZM75.0152 27.2989L45.1091 50.0001L75.0152 72.7012V27.2989Z" />,
  },

  /* Three rounded bars. Overlapping fills in one colour simply merge, so the
     rect and the two combined shapes can all be painted flat. */
  "Power BI": {
    box: 630,
    el: (
      <g fill="currentColor">
        <rect x="256" y="0" width="219" height="630" rx="26" />
        <path d="M346,604 L346,630 L320,630 L153,630 C138.640597,630 127,618.359403 127,604 L127,183 C127,168.640597 138.640597,157 153,157 L320,157 C334.359403,157 346,168.640597 346,183 L346,604 Z" />
        <path d="M219,604 L219,630 L193,630 L26,630 C11.6405965,630 1.75851975e-15,618.359403 0,604 L0,341 C-1.75851975e-15,326.640597 11.6405965,315 26,315 L193,315 C207.359403,315 219,326.640597 219,341 L219,604 Z" />
      </g>
    ),
  },

  /* A polar plot: a grid of rings and spokes with seven wedges. In one colour
     the wedges would swallow the grid, so the grid is held back to 0.5 and the
     wedges stay solid — the pinwheel is what makes the mark recognisable. */
  "Matplotlib": {
    box: 180,
    el: (
      <>
        <g fill="none" stroke="currentColor" strokeWidth={7} opacity={0.5}>
          <circle cx="90" cy="90" r="84" />
          <circle cx="90" cy="90" r="63" />
          <circle cx="90" cy="90" r="42" />
          <circle cx="90" cy="90" r="21" />
          <path d="m90,6v168m59-25-118-118m118,0-118,118m143-59H6" />
        </g>
        <g fill="currentColor">
          <path d="m90,90h18a18,18 0 0,0 0-5z" />
          <path d="m90,90 34-43a55,55 0 0,0-15-8z" />
          <path d="m90,90-16-72a74,74 0 0,0-31,15z" />
          <path d="m90,90-58-28a65,65 0 0,0-5,39z" />
          <path d="m90,90-33,16a37,37 0 0,0 2,5z" />
          <path d="m90,90-10,45a46,46 0 0,0 18,0z" />
          <path d="m90,90 46,58a74,74 0 0,0 12-12z" />
        </g>
      </>
    ),
  },
};
