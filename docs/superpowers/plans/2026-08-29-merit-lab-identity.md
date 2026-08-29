# MERIT Lab Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the site from a personal academic profile to the lab-led identity **MERIT Lab (Markets, Energy Resources & Intelligent Technologies)**, with Dr. Ali Pourmousavi presented as Director.

**Architecture:** Static vanilla HTML/CSS/JS site with no build step. The nav and footer blocks are byte-identical across all nine pages, so those changes are single global replacements. New home-page sections reuse existing card-grid classes rather than introducing new layout primitives. All new CSS is appended to the single `styles.css` and draws exclusively on the existing custom properties.

**Tech Stack:** Plain HTML5, CSS custom properties, vanilla JS (untouched), JSON-LD structured data, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-29-merit-lab-identity-design.md`

## Global Constraints

- **No build step, no framework, no dependencies.** Vanilla DOM only. Do not add `package.json`.
- **Every page title must retain the exact string `Ali Pourmousavi`.** This is non-negotiable — it protects existing search equity.
- **Never hardcode hex colours in new CSS.** Use the custom properties defined in `:root` in `styles.css` (`--primary`, `--primary-light`, `--text-hint`, `--surface`, `--divider`, `--text-secondary`, etc.).
- **Preserve every `<head>`.** Canonical URLs, the Google Analytics block (`G-J58ZKCC7G9`), `citation_*`, `dc.*`, and `geo.*` tags, favicon links, and stylesheet links must not be reordered or removed.
- **Preserve the IDs `hero-pubs` and `hero-citations`** on the home page. `js/scholar.js` writes into them; removing them silently breaks the live metrics.
- **No emojis** in code, copy, or commit messages.
- **Do not touch:** anything under `js/`, anything under `data/`, `styles-chatbot.css`, `sitemap.xml`, `robots.txt`, `site.webmanifest`, favicon or Open Graph image assets, the publications chatbot.
- **Do not `git push`.** Every push to `main` deploys to production immediately. Commit locally; the user decides when to ship.
- **Canonical copy strings** (use verbatim wherever the plan calls for them):
  - Expansion: `Markets, Energy Resources & Intelligent Technologies`
  - Tagline: `Where energy markets, resources, and intelligence meet.`
  - Positioning sentence: `MERIT Lab builds the algorithms, technologies, and market mechanisms that let renewable energy, storage, and electrified industry actually operate together.`

---

### Task 1: Nav wordmark across all nine pages

Replaces the circular profile photo and personal name in the nav with a typographic MERIT Lab lockup. The `.logo` block is byte-identical in all nine files, so this is one global replacement plus one CSS block plus removal of two now-dead mobile rules.

**Files:**
- Modify: `index.html`, `research.html`, `publications.html`, `team.html`, `teaching.html`, `resources.html`, `opportunities.html`, `media.html`, `contact.html` (the `.logo` div inside `.nav-container`)
- Modify: `styles.css` — append new block; edit mobile rules near lines 4580 and 4803-4824

**Interfaces:**
- Produces: CSS classes `.brand-lockup`, `.brand-mark`, `.brand-type`, reused by the hero masthead in Task 4.

- [ ] **Step 1: Confirm the block is identical in all nine files**

```bash
grep -c 'class="nav-profile-image"' *.html
```

Expected: every file reports `1`. If any file reports `0` or `2`, stop and inspect before proceeding.

- [ ] **Step 2: Replace the logo block in all nine files**

The current three lines in each file are:

```html
            <div class="logo">
                <img src="images/profile.jpg" alt="Dr. Ali Pourmousavi" class="nav-profile-image">
                <span>Dr. Ali Pourmousavi</span>
```

Replace with:

```html
            <div class="logo brand-lockup">
                <span class="brand-mark">MERIT</span>
                <span class="brand-type">Lab</span>
```

Apply with:

```bash
perl -0pi -e 's|<div class="logo">\n                <img src="images/profile\.jpg" alt="Dr\. Ali Pourmousavi" class="nav-profile-image">\n                <span>Dr\. Ali Pourmousavi</span>|<div class="logo brand-lockup">\n                <span class="brand-mark">MERIT</span>\n                <span class="brand-type">Lab</span>|' *.html
```

- [ ] **Step 3: Verify the replacement landed everywhere**

```bash
grep -c 'brand-mark' *.html; grep -c 'nav-profile-image' *.html
```

Expected: `brand-mark` reports `1` for all nine files; `nav-profile-image` reports `0` for all nine.

- [ ] **Step 4: Add the wordmark CSS**

Append immediately after the `.nav-profile-image:hover` rule (which ends around line 375 in `styles.css`):

```css
/* MERIT Lab wordmark */
.brand-lockup {
    gap: 0.35rem;
    align-items: baseline;
}

.brand-mark {
    font-weight: 800;
    letter-spacing: 1.5px;
    color: var(--primary);
}

.brand-type {
    font-weight: 400;
    letter-spacing: 0.5px;
    color: var(--text-hint);
}
```

- [ ] **Step 5: Remove the now-dead mobile profile-image rules**

Two rules in `styles.css` style an element that no longer exists in the nav. Delete both:

- The `.nav-profile-image { width: 28px; height: 28px; }` rule near line 4580.
- The `.nav-profile-image { position: absolute; ... }` rule and the `.nav-profile-image:hover` rule that follows it, near lines 4813-4823.

Then, in the mobile `.logo span` rule near line 4808, delete the line `font-weight: 700;` — it would otherwise override `.brand-type`'s lighter weight on small screens. Leave the rest of that rule intact.

- [ ] **Step 6: Verify no dead references remain**

```bash
grep -n 'nav-profile-image' styles.css *.html
```

Expected: no output.

- [ ] **Step 7: Visual check**

Run `python3 -m http.server 8000` and open `http://localhost:8000/index.html`. Confirm the nav reads `MERIT Lab` with `MERIT` in brand blue and `Lab` in a lighter grey. Narrow the window to 375px and confirm the wordmark centres, the hamburger toggle still opens and closes the menu, and nothing overflows horizontally.

- [ ] **Step 8: Commit**

```bash
git add *.html styles.css
git commit -m "Replace nav profile lockup with MERIT Lab wordmark"
```

---

### Task 2: Footer lockup across all nine pages

**Files:**
- Modify: all nine `.html` files (the `.footer-about` div)
- Modify: `styles.css` — one small appended rule

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: CSS class `.footer-expansion`, used nowhere else.

- [ ] **Step 1: Confirm the block is identical in all nine files**

```bash
grep -c 'Senior Lecturer specializing in renewable energy systems' *.html
```

Expected: every file reports `1`.

- [ ] **Step 2: Replace the footer-about content**

The current two lines in each file are:

```html
                <h3>Dr. Ali Pourmousavi</h3>
                <p>Senior Lecturer specializing in renewable energy systems, battery storage optimization, and smart grid technologies at Adelaide University.</p>
```

Replace with:

```html
                <h3>MERIT Lab</h3>
                <p class="footer-expansion">Markets, Energy Resources &amp; Intelligent Technologies</p>
                <p>School of Electrical and Mechanical Engineering, Adelaide University. Led by Dr. Ali Pourmousavi.</p>
```

Apply with:

```bash
perl -0pi -e 's|<h3>Dr\. Ali Pourmousavi</h3>\n                <p>Senior Lecturer specializing in renewable energy systems, battery storage optimization, and smart grid technologies at Adelaide University\.</p>|<h3>MERIT Lab</h3>\n                <p class="footer-expansion">Markets, Energy Resources &amp; Intelligent Technologies</p>\n                <p>School of Electrical and Mechanical Engineering, Adelaide University. Led by Dr. Ali Pourmousavi.</p>|' *.html
```

Note the footer deliberately keeps `Dr. Ali Pourmousavi` on every page — it is a site-wide name signal for search.

- [ ] **Step 3: Verify**

```bash
grep -c 'footer-expansion' *.html
```

Expected: every file reports `1`.

- [ ] **Step 4: Add the CSS**

Append to `styles.css` at the end of the footer section:

```css
.footer-about .footer-expansion {
    color: var(--primary-light);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
}
```

- [ ] **Step 5: Visual check**

With the server running, scroll to the footer on `index.html` and one other page. Confirm three lines render: `MERIT Lab`, the expansion in lighter blue, then the affiliation line.

- [ ] **Step 6: Commit**

```bash
git add *.html styles.css
git commit -m "Rebrand footer lockup to MERIT Lab"
```

---

### Task 3: Page titles and meta descriptions

Head-only changes across all nine pages. Every title keeps `Ali Pourmousavi`.

**Files:**
- Modify: all nine `.html` files, `<head>` section only

- [ ] **Step 1: Update `og:site_name` globally**

All nine files carry `<meta property="og:site_name" content="Ali Pourmousavi">`.

```bash
sed -i '' 's|<meta property="og:site_name" content="Ali Pourmousavi">|<meta property="og:site_name" content="MERIT Lab">|' *.html
grep -c 'og:site_name" content="MERIT Lab"' *.html
```

Expected: every file reports `1`.

- [ ] **Step 2: Set the new titles**

For each file, set both `<title>` and `<meta name="title" content="...">` to the value below. Edit them by hand — the current values differ per file, so a single sed is not safe.

| File | New title |
| --- | --- |
| `index.html` | `MERIT Lab \| Dr. Ali Pourmousavi \| Adelaide University` |
| `research.html` | `Research \| MERIT Lab \| Battery Storage & Electrification \| Dr. Ali Pourmousavi` |
| `publications.html` | `Publications \| MERIT Lab \| Dr. Ali Pourmousavi \| Adelaide University` |
| `team.html` | `Team \| MERIT Lab \| Dr. Ali Pourmousavi \| Adelaide University` |
| `teaching.html` | `Teaching & Supervision \| MERIT Lab \| Dr. Ali Pourmousavi` |
| `resources.html` | `Resources \| MERIT Lab \| Software, Datasets & Tools \| Dr. Ali Pourmousavi` |
| `opportunities.html` | `Opportunities \| MERIT Lab \| PhD & Postdoc \| Dr. Ali Pourmousavi` |
| `media.html` | `Media & Press \| MERIT Lab \| Dr. Ali Pourmousavi` |
| `contact.html` | `Contact \| MERIT Lab \| Dr. Ali Pourmousavi \| Adelaide University` |

Note: `publications.html` currently claims `70+ Papers | 2500+ Citations` in its title, which is stale — `js/scholar.js` renders 90+ and 3,700+ at runtime. The replacement above drops the stale numbers rather than restating them, since a hardcoded count in a title goes out of date again.

- [ ] **Step 3: Update the `og:title` on each page**

Set each `<meta property="og:title" ...>` to the same string as that page's new `<title>`. On the four pages that also have `<meta property="twitter:title" ...>` (`index.html`, `research.html`, `resources.html`, `teaching.html`), set that to the same value too.

- [ ] **Step 4: Update the home page description trio**

In `index.html`, set all three to the positioning sentence verbatim:

```html
    <meta name="description" content="MERIT Lab builds the algorithms, technologies, and market mechanisms that let renewable energy, storage, and electrified industry actually operate together. Led by Dr. Ali Pourmousavi at Adelaide University.">
```

```html
    <meta property="og:description" content="MERIT Lab builds the algorithms, technologies, and market mechanisms that let renewable energy, storage, and electrified industry actually operate together.">
```

```html
    <meta property="twitter:description" content="MERIT Lab builds the algorithms, technologies, and market mechanisms that let renewable energy, storage, and electrified industry actually operate together.">
```

- [ ] **Step 5: Verify every title still carries the personal name**

```bash
grep -L 'Ali Pourmousavi' <(grep -h -m1 '<title>' *.html) 2>/dev/null; for f in *.html; do grep -m1 '<title>' $f | grep -q 'Ali Pourmousavi' || echo "MISSING NAME: $f"; done
```

Expected: no `MISSING NAME` lines.

- [ ] **Step 6: Verify every title carries the lab name**

```bash
for f in *.html; do grep -m1 '<title>' $f | grep -q 'MERIT Lab' || echo "MISSING LAB: $f"; done
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add *.html
git commit -m "Add MERIT Lab to page titles and social metadata"
```

---

### Task 4: Home page hero becomes the lab masthead

**Files:**
- Modify: `index.html:143-183` (the `section.hero#overview` block)
- Modify: `styles.css` — append hero variant rules

**Interfaces:**
- Consumes: `.brand-lockup`, `.brand-mark`, `.brand-type` from Task 1.
- Produces: nothing consumed downstream. The profile photo removed here reappears in Task 6's Director card.

- [ ] **Step 1: Replace the hero section**

Replace the whole of `section.hero#overview` with:

```html
    <section class="hero" id="overview" data-section-label="Overview">
        <div class="hero-content hero-lab">
            <div class="hero-text">
                <p class="hero-eyebrow">School of Electrical and Mechanical Engineering, Adelaide University</p>
                <h1 class="brand-lockup brand-lockup-hero">
                    <span class="brand-mark">MERIT</span><span class="brand-type">Lab</span>
                </h1>
                <p class="brand-expansion">Markets, Energy Resources &amp; Intelligent Technologies</p>
                <p class="subtitle">Where energy markets, resources, and intelligence meet.</p>
                <p class="subtitle-detail">MERIT Lab builds the algorithms, technologies, and market mechanisms that let renewable energy, storage, and electrified industry actually operate together.</p>
                <div class="hero-cta">
                    <a href="research.html#consultancy-services" class="btn btn-primary">Work with us</a>
                    <a href="opportunities.html" class="btn btn-secondary">Join us</a>
                </div>

                <div class="hero-metrics">
                    <div class="hero-metric">
                        <div class="hero-metric-value" id="hero-pubs">90+</div>
                        <div class="hero-metric-label">Publications</div>
                    </div>
                    <div class="hero-metric">
                        <div class="hero-metric-value" id="hero-citations">3,700+</div>
                        <div class="hero-metric-label">Citations</div>
                    </div>
                    <div class="hero-metric">
                        <div class="hero-metric-value">$3M+</div>
                        <div class="hero-metric-label">Research Funding</div>
                    </div>
                    <div class="hero-metric">
                        <div class="hero-metric-value">10</div>
                        <div class="hero-metric-label">PhD Graduates</div>
                    </div>
                </div>
            </div>
        </div>
    </section>
```

The `hero-profile` div and its `<img>` are removed. The `id="hero-pubs"` and `id="hero-citations"` hooks are preserved exactly.

- [ ] **Step 2: Add the hero CSS**

Append after the existing `.hero-cta` rule (around line 577 in `styles.css`):

```css
/* Lab masthead variant of the hero */
.hero-content.hero-lab {
    grid-template-columns: 1fr;
    max-width: 900px;
}

.hero-eyebrow {
    font-size: 0.8125rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-hint);
    margin-bottom: 1rem;
}

.brand-lockup-hero {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    font-size: clamp(2.5rem, 7vw, 4.5rem);
    line-height: 1;
    margin-bottom: 0.5rem;
}

.brand-expansion {
    font-size: 1.0625rem;
    color: var(--primary);
    margin-bottom: 1.25rem;
}
```

- [ ] **Step 3: Verify the scholar.js hooks survived**

```bash
grep -c 'id="hero-pubs"\|id="hero-citations"' index.html
```

Expected: `2`.

- [ ] **Step 4: Verify scholar.js still populates them**

With `python3 -m http.server 8000` running, open `http://localhost:8000/index.html`, open the browser console, and confirm no errors. The citations figure should render a number sourced from `data/scholar_metrics.json`, not the hardcoded `3,700+` placeholder — compare against the `totalCitations` value in that file.

- [ ] **Step 5: Visual check**

Confirm the hero renders as a single centred column with the wordmark large, the expansion beneath it, then tagline, positioning sentence, two buttons, and four metrics. Check at 375px that the wordmark scales down and nothing overflows.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css
git commit -m "Turn the home hero into the MERIT Lab masthead"
```

---

### Task 5: Three pillars section on the home page

**Files:**
- Modify: `index.html` — insert a new section between the hero and `section.news-feed#news`
- Modify: `styles.css` — append pillar rules

**Interfaces:**
- Consumes: existing `.consultancy-grid` and `.consultancy-card` classes (defined at `styles.css:3331` and `:3337`).
- Produces: CSS class `.pillar-tag`, reused by Task 9 on `research.html`.

- [ ] **Step 1: Insert the pillars section**

Immediately after the closing `</section>` of the hero and before `<section class="news-feed" id="news" ...>`, insert:

```html
    <section id="pillars" data-section-label="What We Do">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">What We Do</h2>
                <p class="section-subtitle">Three strands of work, and the overlap where our contribution lives</p>
            </div>

            <div class="consultancy-grid">
                <div class="consultancy-card">
                    <h3>Markets</h3>
                    <p>Electricity market design, bidding and settlement, tariffs, aggregation and VPP business models: the economics that decide whether a technology gets built.</p>
                </div>
                <div class="consultancy-card">
                    <h3>Energy Resources</h3>
                    <p>Batteries, renewables, EVs, flexible demand, and mining and industrial electrification: the physical assets and how they behave.</p>
                </div>
                <div class="consultancy-card">
                    <h3>Intelligent Technologies</h3>
                    <p>Optimisation, forecasting, and AI that coordinate those assets in real time, under uncertainty.</p>
                </div>
            </div>

            <p class="pillar-integration">Most groups work in one of these. Our work lives in the overlap. A battery is only worth what the market pays it, and it only earns that if the algorithm bids it correctly &mdash; so we design the asset, the algorithm, and the market rule together.</p>
        </div>
    </section>
```

- [ ] **Step 2: Add the CSS**

Append to `styles.css`:

```css
/* MERIT pillars */
.pillar-integration {
    max-width: 760px;
    margin: 2rem auto 0;
    padding-top: 2rem;
    border-top: 1px solid var(--divider);
    font-size: 1.0625rem;
    line-height: 1.8;
    color: var(--text-secondary);
    text-align: center;
}

.pillar-tag {
    display: inline-block;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--primary);
    background: var(--background-alt);
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    margin: 0 0.3rem 0.75rem 0;
}
```

- [ ] **Step 3: Verify**

```bash
grep -c 'pillar-integration' index.html
```

Expected: `1`.

- [ ] **Step 4: Visual check**

Confirm three equal cards render side by side on desktop and stack on mobile, with the integration paragraph centred beneath a divider rule.

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css
git commit -m "Add MERIT pillars section to the home page"
```

---

### Task 6: Director card and Background retitle

**Files:**
- Modify: `index.html` — insert a new section after the pillars section; retitle the `#background` section heading
- Modify: `styles.css` — append director card rules

**Interfaces:**
- Consumes: the profile image removed from the hero in Task 4 (`images/profile.jpg`).

- [ ] **Step 1: Insert the Director section**

Immediately after the closing `</section>` of the pillars section from Task 5, insert:

```html
    <section id="director" data-section-label="Director">
        <div class="container">
            <div class="director-card">
                <img src="images/profile.jpg" alt="Dr. Ali Pourmousavi" class="director-photo">
                <div class="director-body">
                    <h2>Dr. Ali Pourmousavi</h2>
                    <p class="director-role">Director, MERIT Lab &middot; Senior Lecturer in Power Systems Engineering &middot; IEEE Senior Member</p>
                    <p>Ali leads MERIT Lab at Adelaide University's School of Electrical and Mechanical Engineering. His work spans battery storage optimisation, electricity market design, smart grid integration, and the electrification of mining and heavy industry, backed by more than $3M in research funding and a decade of collaboration with utilities, network operators, and mining companies. He serves on the board of OptiGrid Pty Ltd, the spin-off commercialising the group's work.</p>
                    <div class="director-links">
                        <a href="docs/CV_SeyyedAliPourmousavi.pdf" target="_blank" class="btn btn-secondary">Download CV</a>
                        <a href="https://scholar.google.com/citations?user=XoHCLowAAAAJ" target="_blank" class="btn btn-secondary">Google Scholar</a>
                        <a href="contact.html" class="btn btn-secondary">Contact</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
```

- [ ] **Step 2: Retitle the Background section**

In the `#background` section, change the heading text only:

```bash
sed -i '' 's|<h2 class="section-title">Background</h2>|<h2 class="section-title">Director \&mdash; Background</h2>|' index.html
```

Leave the `data-section-label="Background"` attribute and both timelines untouched.

- [ ] **Step 3: Add the CSS**

Append to `styles.css`:

```css
/* Director card */
.director-card {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 2rem;
    align-items: start;
    background: var(--surface);
    padding: 2rem;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-top: 3px solid var(--primary);
    max-width: 900px;
    margin: 0 auto;
}

.director-photo {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--primary);
}

.director-role {
    color: var(--primary);
    font-size: 0.9375rem;
    margin-bottom: 1rem;
}

.director-body p {
    color: var(--text-secondary);
    line-height: 1.8;
}

.director-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.5rem;
}

@media (max-width: 768px) {
    .director-card {
        grid-template-columns: 1fr;
        justify-items: center;
        text-align: center;
    }

    .director-links {
        justify-content: center;
    }
}
```

- [ ] **Step 4: Verify the CV path is correct**

```bash
ls -la docs/CV_SeyyedAliPourmousavi.pdf
```

Expected: the file exists. Filenames are case-sensitive on GitHub Pages, so the path in the HTML must match this exactly.

- [ ] **Step 5: Visual check**

Confirm the photo and bio render side by side on desktop, stacked and centred at 375px, and that all three buttons work.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css
git commit -m "Add Director card and retitle Background section"
```

---

### Task 7: Home page structured data

**Files:**
- Modify: `index.html` — the three `<script type="application/ld+json">` blocks in `<head>`

- [ ] **Step 1: Add `affiliation` to the existing Person block**

In the `Person` JSON-LD block, after the `"worksFor"` object and before `"alumniOf"`, insert:

```json
      "affiliation": {
        "@type": "ResearchOrganization",
        "name": "MERIT Lab",
        "url": "https://alipourmousavi.com/"
      },
```

Leave every other field of the `Person` block unchanged.

- [ ] **Step 2: Update the WebSite block name**

Change `"name": "Ali Pourmousavi"` to `"name": "MERIT Lab"` in the `WebSite` JSON-LD block. Leave its `url` unchanged.

- [ ] **Step 3: Add a ResearchOrganization block**

Insert a new script block immediately after the `WebSite` block, before `</head>`:

```html
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "ResearchOrganization",
            "name": "MERIT Lab",
            "alternateName": "Markets, Energy Resources & Intelligent Technologies",
            "description": "MERIT Lab builds the algorithms, technologies, and market mechanisms that let renewable energy, storage, and electrified industry actually operate together.",
            "url": "https://alipourmousavi.com/",
            "founder": {
                "@type": "Person",
                "name": "Seyyed Ali Pourmousavi Kani"
            },
            "parentOrganization": {
                "@type": "EducationalOrganization",
                "name": "Adelaide University",
                "department": "School of Electrical and Mechanical Engineering"
            },
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Adelaide",
                "addressRegion": "SA",
                "postalCode": "5005",
                "addressCountry": "AU"
            },
            "knowsAbout": [
                "Electricity Markets",
                "Energy Resources",
                "Intelligent Technologies",
                "Battery Energy Storage",
                "Smart Grid",
                "Renewable Energy",
                "Mining and Industrial Electrification",
                "Optimisation and Forecasting"
            ]
        }
        </script>
```

- [ ] **Step 4: Verify all JSON-LD blocks parse**

```bash
python3 - <<'EOF'
import json, re, sys
src = open('index.html').read()
blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', src, re.S)
print(f"{len(blocks)} block(s) found")
for i, b in enumerate(blocks):
    try:
        d = json.loads(b)
        print(f"  block {i}: OK  @type={d.get('@type')}  name={d.get('name')}")
    except Exception as e:
        print(f"  block {i}: PARSE ERROR {e}")
        sys.exit(1)
EOF
```

Expected: 3 blocks, all `OK`, with types `Person`, `WebSite`, `ResearchOrganization`.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Add MERIT Lab organization schema to the home page"
```

---

### Task 8: Team page

**Files:**
- Modify: `team.html:39-53` (the `ResearchGroup` JSON-LD block), `team.html:96-97` (page header), `team.html:506` (join heading)

- [ ] **Step 1: Update the page header**

Replace:

```html
            <h1>Research Team</h1>
            <p>Current and former lab members advancing power systems research</p>
```

with:

```html
            <h1>MERIT Lab Team</h1>
            <p>The people behind our work in energy markets, resources, and intelligent technologies</p>
```

- [ ] **Step 2: Update the join heading**

```bash
sed -i '' 's|<h2 class="section-title">Join Our Research Team</h2>|<h2 class="section-title">Join MERIT Lab</h2>|' team.html
```

- [ ] **Step 3: Replace the ResearchGroup schema**

Replace the existing block (currently named `Power Systems Research Group`) with:

```html
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ResearchOrganization",
      "name": "MERIT Lab",
      "alternateName": "Markets, Energy Resources & Intelligent Technologies",
      "description": "MERIT Lab builds the algorithms, technologies, and market mechanisms that let renewable energy, storage, and electrified industry actually operate together.",
      "url": "https://alipourmousavi.com/team.html",
      "leader": {
        "@type": "Person",
        "name": "Seyyed Ali Pourmousavi Kani"
      },
      "parentOrganization": {
        "@type": "EducationalOrganization",
        "name": "Adelaide University",
        "department": "School of Electrical and Mechanical Engineering"
      },
      "knowsAbout": [
        "Electricity Markets",
        "Energy Resources",
        "Intelligent Technologies"
      ]
    }
    </script>
```

Note the `@type` changes from `ResearchGroup` to `ResearchOrganization` to match the home page, so both blocks describe one consistent entity.

- [ ] **Step 4: Verify the JSON parses**

```bash
python3 - <<'EOF'
import json, re, sys
src = open('team.html').read()
for i, b in enumerate(re.findall(r'<script type="application/ld\+json">(.*?)</script>', src, re.S)):
    try:
        d = json.loads(b)
        print(f"block {i}: OK  @type={d.get('@type')}")
    except Exception as e:
        print(f"block {i}: PARSE ERROR {e}"); sys.exit(1)
EOF
```

Expected: both blocks `OK` (`ResearchOrganization`, `BreadcrumbList`).

- [ ] **Step 5: Verify no stale group name remains**

```bash
grep -n 'Power Systems Research Group\|Join Our Research Team' team.html
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add team.html
git commit -m "Rebrand team page to MERIT Lab"
```

---

### Task 9: Research page pillar tags and industry intro

**Files:**
- Modify: `research.html` — the `#consultancy-services` section starting at line 296

**Interfaces:**
- Consumes: `.pillar-tag` CSS from Task 5.

- [ ] **Step 1: Add the industry-facing intro**

Immediately after `<h2 class="section-title">Industry Consultancy & Services</h2>` (line 297) and before the commented-out subtitle, insert:

```html
            <p class="section-subtitle">A battery is only worth what the market pays it, and it only earns that if the algorithm bids it correctly. We work across the asset, the algorithm, and the market rule together &mdash; which is why our consultancy spans engineering, optimisation, and market strategy rather than any one of them. <a href="contact.html">Talk to us about a project</a>.</p>
```

- [ ] **Step 2: Add pillar tags to the six capability cards**

Inside each `.consultancy-card`, insert the tag markup immediately after the card's `<h3>` line, using this mapping:

| Card heading (line) | Tags to insert |
| --- | --- |
| `AI & Optimization` (302) | `<span class="pillar-tag">Intelligent Technologies</span>` |
| `Energy Market` (313) | `<span class="pillar-tag">Markets</span>` |
| `Smart Grid Integration` (326) | `<span class="pillar-tag">Energy Resources</span><span class="pillar-tag">Intelligent Technologies</span>` |
| `Battery Storage Systems` (338) | `<span class="pillar-tag">Energy Resources</span><span class="pillar-tag">Markets</span>` |
| `Electric Vehicle Systems` (350) | `<span class="pillar-tag">Energy Resources</span>` |
| `Mining/Industrial Electrification` (362) | `<span class="pillar-tag">Energy Resources</span><span class="pillar-tag">Markets</span>` |

Line numbers are pre-edit; they shift as you insert. Locate each card by its `<h3>` text, not by line number.

- [ ] **Step 3: Verify tag count**

```bash
grep -c 'pillar-tag' research.html
```

Expected: `9` (one + one + two + two + one + two).

- [ ] **Step 4: Visual check**

Open `http://localhost:8000/research.html#consultancy-services`. Confirm the intro paragraph renders with a working contact link, and each of the six cards shows its pill tags between the heading and body text.

- [ ] **Step 5: Commit**

```bash
git add research.html
git commit -m "Tag consultancy areas with MERIT pillars and add industry intro"
```

---

### Task 10: Opportunities and resources copy

**Files:**
- Modify: `opportunities.html` — lines 10, 20, 82, 392
- Modify: `resources.html` — line 10

- [ ] **Step 1: Update opportunities.html**

Four replacements:

```bash
sed -i '' \
  -e 's|How PhD, MPhil and MRes scholarships work in our battery storage, smart grid and electrification research group at Adelaide University, and when to get in touch\.|How PhD, MPhil and MRes scholarships work at MERIT Lab, Adelaide University, and when to get in touch.|' \
  -e 's|The three funding pathways into our research group at Adelaide University, and how to check which one applies to you\.|The three funding pathways into MERIT Lab at Adelaide University, and how to check which one applies to you.|' \
  -e 's|<p>Join our research group and contribute to the future of sustainable energy</p>|<p>Join MERIT Lab and contribute to the future of sustainable energy</p>|' \
  -e 's|<h2 class="section-title">Why Join Our Research Group?</h2>|<h2 class="section-title">Why Join MERIT Lab?</h2>|' \
  opportunities.html
```

- [ ] **Step 2: Update resources.html**

```bash
sed -i '' "s|Open-source software, research datasets, and tools from Dr. Ali Pourmousavi's research group\.|Open-source software, research datasets, and tools from MERIT Lab.|" resources.html
```

- [ ] **Step 3: Verify no stale group phrasing remains**

```bash
grep -in 'our research group\|research group at Adelaide\|Pourmousavi.s research group' opportunities.html resources.html
```

Expected: no output.

- [ ] **Step 4: Confirm the sed edits actually applied**

```bash
grep -c 'MERIT Lab' opportunities.html resources.html
```

Expected: `opportunities.html` at least `5` (four here plus the nav/footer/title from earlier tasks), `resources.html` at least `3`. If either is lower than the count of edits you made, a `sed` pattern failed to match — check for smart quotes or a trailing-space mismatch before proceeding.

- [ ] **Step 5: Commit**

```bash
git add opportunities.html resources.html
git commit -m "Rename research group to MERIT Lab in opportunities and resources copy"
```

---

### Task 11: Full-site verification

No new code. This is the gate before the user decides whether to ship.

**Files:** none modified unless a defect is found.

- [ ] **Step 1: Confirm the lab name reaches every page**

```bash
for f in *.html; do
  n=$(grep -c 'MERIT' $f)
  echo "$f: $n"
  [ "$n" -lt 3 ] && echo "  ^^ SUSPICIOUS: expected nav + footer + title at minimum"
done
```

Expected: every page reports at least 3, no `SUSPICIOUS` lines.

- [ ] **Step 2: Confirm the personal name survives site-wide**

```bash
for f in *.html; do grep -q 'Ali Pourmousavi' $f || echo "MISSING NAME: $f"; done
```

Expected: no output.

- [ ] **Step 3: Confirm no hardcoded hex crept into the new CSS**

Compare against the commit that preceded Task 1. Find it with `git log --oneline` — it is the commit immediately below `Replace nav profile lockup with MERIT Lab wordmark`. Export it as `BASE`, then:

```bash
BASE=<sha of the commit before Task 1>
git diff $BASE --stat -- styles.css
git diff $BASE -- styles.css | grep '^+' | grep -iE '#[0-9a-f]{3,6}\b'
```

Expected: the only hits are the pre-existing `rgba(0,0,0,...)` shadow values copied from the surrounding card styles. Any new `#RRGGBB` literal is a defect — replace it with the matching custom property.

- [ ] **Step 4: Confirm nothing out of scope was touched**

```bash
git diff $BASE --name-only
```

Expected: only the nine `.html` files, `styles.css`, and the two docs under `docs/superpowers/`. Nothing under `js/`, `data/`, no `sitemap.xml`, no image assets.

- [ ] **Step 5: Walk every page in the browser**

With `python3 -m http.server 8000` running, visit all nine pages at desktop width and at 375px. On each, confirm:

- the nav wordmark renders and the hamburger opens and closes the menu;
- the footer lockup renders three lines;
- no horizontal scrollbar appears at 375px;
- the browser console shows no new errors.

- [ ] **Step 6: Confirm the publications chatbot still works**

Open `http://localhost:8000/publications.html`, click the side tab to open the chatbot drawer, and confirm it opens. Then click an `Ask` button on a paper card and confirm it opens in paper-scoped mode. Nothing in this plan touches the chatbot, so any failure here means an unintended edit — investigate before shipping.

- [ ] **Step 7: Validate structured data**

Paste the `index.html` and `team.html` JSON-LD blocks into Google's Rich Results Test (`https://search.google.com/test/rich-results`). All blocks must validate with no errors.

- [ ] **Step 8: Report and hand back**

Summarise for the user: what changed, anything that looked off during verification, and the reminder that nothing has been pushed. Shipping means `git push origin main`, which deploys to production within about a minute — the user makes that call, and should confirm the §7 open question about university naming requirements first.
