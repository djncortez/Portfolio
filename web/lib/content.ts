/**
 * All page copy and data. Kept out of the components so the markup stays
 * presentational and the content is editable in one place — the main thing
 * the component split actually buys over the single-file version.
 */

/** Taxonomy hues. One per discipline, never reused, never decorative. */
export const HUE = {
  brand: "var(--color-brand)",
  data: "var(--color-data)",
  systems: "var(--color-systems)",
  datasys: "var(--color-datasys)",
  tooling: "var(--color-tooling)",
} as const;

export type Hue = keyof typeof HUE;

export const NAV = [
  { href: "#about", label: "About" },
  { href: "#disciplines", label: "Disciplines" },
  { href: "#experience", label: "Experience" },
  { href: "#work", label: "Work" },
  { href: "#credentials", label: "Credentials" },
  { href: "#contact", label: "Contact" },
];

export const HERO = {
  eyebrow: ["Data Science & Analytics", "—", "Mapúa Malayan Colleges Laguna"],
  given: "David Joseph",
  family: "Cortez",
  sub: "I turn operational workflows into clear, reliable systems — and messy data into things people can ",
  subEm: "actually decide from",
  stats: [
    { n: "480", label: "hrs practicum at STMicroelectronics" },
    { n: "6", label: "certifications" },
    { n: "3", label: "shipped projects" },
  ],
};

export const ABOUT = {
  heading: "Building things that hold up outside the notebook.",
  body: [
    "I'm a fourth-year Computer Science student specialising in Data Science and Analytics. Most of my work sits where analysis meets software — practical, data-driven applications and full-stack tools that turn operational workflows into clear, reliable systems.",
    "I spent 480 hours inside a semiconductor operations department digitising a reporting process that had lived in spreadsheets for years. That taught me more about requirements, constraints and stakeholder review than any coursework did.",
  ],
};

export const MARQUEE = [
  "Python", "Pandas", "NumPy", "Flask", "SQLite",
  "PostgreSQL", "Kotlin", "JavaScript", "Power BI", "Supabase", "Git",
];

export const DISCIPLINES: {
  hue: Hue; object: string; label: string; title: string; copy: string; tags: string[];
}[] = [
  {
    hue: "data", object: "data", label: "Data & Analytics",
    title: "Turning messy data into a decision",
    copy: "Cleaning, exploring and modelling real datasets, then presenting the result so a non-technical reader can act on it.",
    tags: ["Pandas", "NumPy", "Matplotlib", "Power BI"],
  },
  {
    hue: "systems", object: "systems", label: "Languages & Interfaces",
    title: "Full-stack, front to back",
    copy: "Building the thing end to end — the model, the API around it, and the interface someone actually uses.",
    tags: ["Python", "Java", "Kotlin", "HTML", "CSS", "JavaScript"],
  },
  {
    hue: "datasys", object: "ml", label: "Data Systems",
    title: "Schemas that survive contact",
    copy: "Designing storage that holds up once real users, real edge cases and real history arrive.",
    tags: ["PostgreSQL", "MySQL", "SQLite", "Supabase"],
  },
  {
    hue: "tooling", object: "cloud", label: "Tooling & AI",
    title: "Moving faster without losing the thread",
    copy: "Using the current generation of tooling deliberately — to accelerate the work, not to outsource the thinking.",
    tags: ["VS Code", "Git", "Android Studio", "Claude", "Gemini", "ChatGPT", "Copilot", "V0"],
  },
];

export const EXPERIENCE = {
  heading: "MBO Sawing Report System",
  lede: "During a 480-hour onsite practicum in B2F2 Operations 2/3 at STMicroelectronics, I designed and built an internal web application that digitises the department's MBO sawing-report process. I contributed across the full stack — frontend, backend, database, testing, documentation, and a deployment presentation to stakeholders.",
  role: "On-the-Job Trainee (Practicum)",
  org: ["STMicroelectronics", "B2F2 Operations 2/3"],
  dates: "May 2026 — Present · 480 hrs",
  triad: [
    { k: "Challenge", v: "Manual Excel reporting depended on file handling and individual practices, making validation, retrieval and workflow consistency difficult." },
    { k: "Solution", v: "Translated the worksheet logic into a login-protected, workflow-based application with guided forms, validation and admin-managed configuration." },
    { k: "Impact", v: "Created a centralised way to save and retrieve reports, standardise report preparation and reduce dependence on isolated local files." },
  ],
  contributions: [
    ["Controlled access & login", "an authenticated flow restricting the workspace to authorised MBO personnel."],
    ["Workflow selection engine", "users choose the correct report variant (External / Lite / Internal PC MBO) before entering the flow."],
    ["Guided landing dashboard", "structured entry point for starting new reports, resuming drafts and opening saved files."],
    ["Digitised summary & worksheet pages", "Excel worksheet logic rebuilt as guided, section-based application pages."],
    ["Admin-managed configuration", "centralised module for MBO type values instead of hardcoded spreadsheet fields."],
    ["Validation & guided correction", "built-in checks that flag missing fields and reduce encoding errors."],
    ["Historical tracking & retrieval", "saving and reloading of past reports from a centralised backend."],
  ] as [string, string][],
  stack: ["HTML", "CSS", "JavaScript", "Python", "Flask", "SQLite"],
  confidential: "Internal system: source code, operational data and detailed workflows remain confidential.",
  flow: ["Authorised user", "Select workflow", "Guided report", "Validate", "Save & retrieve"],
  shots: [
    { src: "/assets/mbo-login.jpg", alt: "MBO Sawing Report System login page", caption: "Controlled-access login for authorised MBO personnel" },
    { src: "/assets/mbo-dashboard.jpg", alt: "MBO Sawing Report System workflow dashboard", caption: "Guided workflow dashboard — start, resume or open a report" },
  ],
};

export const WORK: {
  idx: string; kind: string; hue: Hue; title: string; copy: string; tags: string[];
  shot: string; alt: string; object: string; href: string; cta: string; live?: string;
}[] = [
  {
    idx: "01", kind: "Data & Analytics", hue: "data",
    title: "AQI Prediction",
    copy: "A Python Flask MVC web application that predicts air quality and makes the result easy to explore in a deployed web experience.",
    tags: ["Python", "Flask", "MVC"],
    shot: "/assets/aqi-prediction-thumbnail.png",
    alt: "AQI Prediction System air pollutant input form",
    object: "aqi",
    href: "https://github.com/djncortez/AQI-Prediction-MVC-Flask",
    cta: "Live demo ↗",
    live: "https://aqi-prediction-mvc-flask-r8v1.vercel.app/",
  },
  {
    idx: "02", kind: "Analysis", hue: "systems",
    title: "FlightPrice",
    copy: "A Python data-analysis project that explores airfare trends and uses machine learning to examine the patterns behind flight prices.",
    tags: ["Python", "Pandas", "ML"],
    shot: "/assets/flightprice-thumbnail.jpg",
    alt: "FlightPrice trend analyzer dashboard",
    object: "flightprice",
    href: "https://github.com/djncortez/FlightPrice",
    cta: "GitHub →",
  },
  {
    idx: "03", kind: "Experiment", hue: "brand",
    title: "VOID.LAB",
    copy: "An experimental visual playground for browser-based motion graphics, generative systems and interactive typography explorations.",
    tags: ["JavaScript", "Canvas", "Generative"],
    shot: "/assets/void-lab-thumbnail.jpg",
    alt: "VOID.LAB experimental visual playground",
    object: "voidlab",
    href: "https://github.com/djncortez/VOID.LAB",
    cta: "GitHub →",
  },
];

export const CREDENTIALS = [
  { img: "/assets/google-data-analytics-certificate.jpg", name: "Google Data Analytics", issuer: "Coursera · Google — Professional Certificate", href: "https://coursera.org/share/fd9a6b83cca169ccb411d3a023b2c59f" },
  { img: "/assets/ibm-ai-developer-certificate.jpg", name: "IBM AI Developer", issuer: "Coursera · IBM — Professional Certificate", href: "https://coursera.org/share/257fbac10c993e8d1614e61597b4735c" },
  { img: "/assets/cloud-computing-fundamentals.jpg", name: "Cloud Computing Fundamentals", issuer: "Google Cloud — Computing Foundations", href: "https://www.skills.google/public_profiles/16f4f6da-2812-46db-ab64-b0c304c21801/badges/9383544" },
  { img: "/assets/infrastructure-google-cloud.jpg", name: "Infrastructure in Google Cloud", issuer: "Google Cloud — Computing Foundations", href: "https://www.skills.google/public_profiles/16f4f6da-2812-46db-ab64-b0c304c21801/badges/9769420" },
  { img: "/assets/networking-security-google-cloud.jpg", name: "Networking & Security in Google Cloud", issuer: "Google Cloud — Computing Foundations", href: "https://www.skills.google/public_profiles/16f4f6da-2812-46db-ab64-b0c304c21801/badges/9775363" },
  { img: "/assets/data-ml-ai-google-cloud.jpg", name: "Data, ML and AI in Google Cloud", issuer: "Google Cloud — Computing Foundations", href: "https://www.skills.google/public_profiles/16f4f6da-2812-46db-ab64-b0c304c21801/badges/9780399" },
];

export const CONTACT = [
  { href: "mailto:djnc61003@gmail.com", label: "djnc61003@gmail.com", kind: "Email" },
  { href: "https://github.com/djncortez", label: "github.com/djncortez", kind: "GitHub" },
  { href: "https://www.linkedin.com/in/david-joseph-cortez/", label: "david-joseph-cortez", kind: "LinkedIn" },
];
