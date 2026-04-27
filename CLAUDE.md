# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository. Keep this file in sync with reality — if you change a workflow, naming rule, or data shape, update the matching section here in the same commit.

## 1. What this is

Personal academic website for **Dr. Seyyed Ali Pourmousavi Kani** (Adelaide University), deployed via **GitHub Pages** at the custom domain in `CNAME` (`alipourmousavi.com`). Source repo also serves at `pourmousavi.github.io`. The site is a small **static, vanilla HTML / CSS / JavaScript** application — no bundler, no framework, no build step. Content lives in JSON files under `data/` and is rendered client-side.

There is one server-side dependency: a Cloudflare Worker named `papercast-chat` (deployed at `https://papercast-chat.alipourmousavi.workers.dev`) that powers the publications chatbot. The Worker source and the upstream content pipeline both live outside this repo — see §13.

## 2. Stack & deploy

- **Hosting:** GitHub Pages on `main` branch — every push to `main` ships to production. There is no staging environment.
- **DNS:** `alipourmousavi.com` is the canonical domain (`CNAME` file). All Open Graph / canonical links point there.
- **Analytics:** Google Analytics tag `G-J58ZKCC7G9`, embedded inline on each page.
- **No package.json, no node_modules.** Do not introduce a build step without a strong reason — it would break the "edit a file, push, ship" loop the site is designed around.

## 3. Repository layout

```
.
├── index.html                  # Home
├── research.html, publications.html, team.html, teaching.html,
│   resources.html, opportunities.html, media.html, contact.html
├── styles.css                  # Site-wide design system + page styles (~5800 lines, single file by design)
├── styles-chatbot.css          # Scoped to .pc-* classes for the publications chatbot
├── js/
│   ├── common.js               # Loaded everywhere: nav toggle, smooth scroll, email obfuscation, scroll-to-top
│   ├── publications.js         # Renders publications.html from data/publications.json
│   ├── news.js                 # Renders news on index.html from data/news.json
│   ├── research.js             # Research page interactions
│   ├── scholar.js              # Hydrates citation/h-index numbers from data/scholar_metrics.json
│   ├── chatbot-widget.js       # Publications chatbot drawer + side trigger; calls the Worker
│   ├── eligibility-wizard.js   # PhD opportunities page
│   └── section-nav.js          # In-page section navigation
├── data/
│   ├── publications.json       # Source of truth for all publications (97+ entries)
│   ├── news.json               # Home-page news feed
│   ├── scholar_metrics.json    # Auto-updated daily by GitHub Action
│   ├── chatbot-papers.json     # IDs of papers indexed for chat (gates "Ask" buttons)
│   └── chatbot-index.json      # Vector index consumed by the Worker (large, ~1.6 MB)
├── docs/                       # All PDFs and audio summaries (~180 files)
├── images/                     # Profile, team, hero images
├── scripts/
│   └── update_scholar_metrics.py  # Run by the GitHub Action; not for local use
├── scholarlib/                 # Lightweight redirect/landing page
├── .github/workflows/
│   └── update-scholar.yml      # Daily Scholar metrics refresh (03:17 UTC)
├── HOW-TO-FEATURE-PAPERS.md    # End-user guide for marking papers as featured
└── CLAUDE.md                   # This file
```

## 4. Data is the source of truth

Almost every page is rendered from a JSON file. Edit JSON, not HTML, when adding content.

### 4.1 `data/publications.json`

Top-level shape: `{ "publications": [ ... ] }`. Each entry has the following fields (only `id`, `type`, `title`, `authors`, `year` are required for every paper; the rest depend on `type`):

| Field            | Used for                                                             |
| ---------------- | -------------------------------------------------------------------- |
| `id`             | Anchor (`#jpaper4-2026`) and chatbot lookup. Lowercase. **Must be unique.** |
| `type`           | One of `journal`, `conference`, `book_chapter`, `book`, `patent`, `presentation` |
| `title`          | Plain text, no trailing period                                       |
| `authors`        | `"Firstname Lastname and Firstname Lastname and ..."` (BibTeX-style "and" separator) |
| `year`           | Integer                                                              |
| `month`          | English month name or 3-letter abbreviation (`"April"`, `"Oct."`) — used for intra-year sort |
| `journal`        | Journal title (for `type: journal`)                                  |
| `conference`     | Conference name (for `type: conference`)                             |
| `volume`, `pages`| Optional bibliographic metadata                                      |
| `publisher`, `isbn`, `book_editor` | Books / chapters                                   |
| `patent_number`, `location` | Patents                                                   |
| `url`            | DOI or publisher link (preferred) — empty string is acceptable       |
| `pdf`            | Path relative to repo root, e.g. `"docs/JPaper4-2026.pdf"`           |
| `audio`          | Path to MP3 summary, e.g. `"docs/JPaper4-2026.mp3"`. Presence of this field is what enables the audio player button on that paper. |
| `featured`       | `true` to pin to the Featured tab (see HOW-TO-FEATURE-PAPERS.md)     |
| `featuredReason` | Optional one-line justification shown under a featured paper         |
| `award`          | Award name — auto-features the paper                                 |
| `notes`          | Free-form. Supports markdown links `[text](url)` (rendered as buttons by `publications.js:convertMarkdownLinksToButtons`) |
| `status`, `submitted` | For in-press / under-review entries                             |

**Sort order** is computed at render time (`publications.js:loadPublications`): year desc, then month desc. Don't try to enforce ordering by reordering the JSON.

### 4.2 `data/news.json`

Shape: `{ "_types": [...], "news": [ ... ] }`. The `_types` array is documentation only — the renderer ignores it. Each entry:

```json
{
  "id": "news-2026-005",
  "date": "2026-04-21",
  "type": "publication | grant | award | conference | media | student | graduation | collaboration",
  "title": "Short headline",
  "link": "publications.html#jpaper5-2026",
  "featured": true
}
```

`link` is optional and may be relative (use anchors into `publications.html` for new-paper announcements). `featured: true` surfaces the item on the home page.

### 4.3 `data/scholar_metrics.json`

```json
{ "lastUpdated": "YYYY-MM-DD", "totalCitations": <int>, "hIndex": <int> }
```

**Do not edit by hand.** It is overwritten every morning by the `Update Scholar Metrics` GitHub Action (`.github/workflows/update-scholar.yml`, cron `17 3 * * *` UTC) using SerpAPI. The script is monotonically non-decreasing — transient API drops never lower the displayed values. If you need to bump it manually, dispatch the workflow from the Actions tab; do not commit edits.

### 4.4 `data/chatbot-papers.json` and `data/chatbot-index.json`

`chatbot-papers.json` is a small allowlist of publication `id`s that have been embedded into the vector index. `publications.js` reads it to decide whether to render the **Ask** button on a given card. **A paper without an entry here has no Ask button**, even if its PDF exists. The index file (`chatbot-index.json`) is generated externally and uploaded to the Worker; the front-end never reads it directly. When adding a paper to the chatbot, both files (and the Worker's deployed index) must be updated together.

## 5. Common tasks (recipe book)

### 5.1 Add a new journal/conference paper

1. Drop the PDF into `docs/` using the canonical filename: `JPaperN-YYYY.pdf` for journals, `CPaperN-YYYY.pdf` for conference papers. **Filenames are case-sensitive on GitHub Pages** — match the existing `JPaper`/`CPaper` casing exactly.
2. (Optional) Drop the matching MP3 audio summary at `docs/JPaperN-YYYY.mp3`.
3. Add an entry to `data/publications.json`. The `id` must be the lowercase form of the filename stem: `jpaperN-yyyy`. Keep the entry near the top of the array if you like, but ordering doesn't affect the rendered page.
4. (Optional) Add a news entry to `data/news.json` with `link: "publications.html#jpaperN-yyyy"`.
5. Commit and push to `main`. Live within ~1 minute.

### 5.2 Feature a paper

See `HOW-TO-FEATURE-PAPERS.md` — set `"featured": true` and optionally `"featuredReason": "..."`. Cap is 10; auto-fill kicks in below 6.

### 5.3 Add a paper to the chatbot

1. Verify the paper has a `pdf` path in `publications.json`.
2. Add its `id` to the `ids` array in `data/chatbot-papers.json` (this is what gates the Ask button — required).
3. Re-index in the **PaperCast** project (see §13) and copy the regenerated `chatbot-index.json` + `chatbot-papers.json` into `data/`. The Worker reads its index from its own deployment, so a separate publish step in `papercast-chat-worker` may be required.
4. Bump `generated_at` in `chatbot-papers.json` to today's UTC timestamp for traceability.

### 5.4 Update Scholar metrics manually

Don't. Trigger the workflow instead: GitHub → Actions → "Update Scholar Metrics" → Run workflow. If `SERPAPI_API_KEY` is unset or the API fails, the script exits cleanly without changes, leaving the previous numbers in place.

### 5.5 Add or replace audio summaries

The MP3s themselves are produced upstream by **PaperCast** (§13) — they are not authored by hand in this repo. Once you have the file, place it at `docs/JPaperN-YYYY.mp3` (PascalCase to match the PDF), then add `"audio": "docs/JPaperN-YYYY.mp3"` to that paper's entry in `publications.json`. The sticky audio player at the bottom of `publications.html` (HTML lives in that file, behavior in `publications.js`) picks it up automatically.

### 5.6 Add a team member, news item, or grant

- Team: edit `team.html` (no JSON yet — directly authored).
- News: append to `data/news.json`.
- Grants/awards: edit `research.html` (Recognition section) and add a news entry.

## 6. Naming & ID conventions (treat as load-bearing)

- **Publication IDs:** lowercase, `jpaperN-YYYY` / `cpaperN-YYYY` / `book1-YYYY` etc. The `N` is a per-year sequence (1 = first paper of that year, increasing). These IDs appear in URLs (`#jpaper4-2026`), in `chatbot-papers.json`, and in `news.json` links — keep them stable once published.
- **PDF/MP3 filenames:** `JPaper`/`CPaper` are PascalCase; the rest is the same as the ID with the year appended. Mismatched casing breaks links on GitHub Pages.
- **News IDs:** `news-YYYY-NNN`, monotonic per year.
- **Author strings:** join with ` and ` (BibTeX convention). `publications.js` splits on this when rendering.
- **Don't rename** an existing `id` after publication — external links and anchors will break silently.

## 7. Design system

Defined as CSS custom properties at the top of `styles.css`. The palette is **Material Blue**:

- Brand: `--primary` (`#1565C0`), `--primary-dark`, `--primary-light`, `--accent` (`#1976D2`)
- Neutrals: `--text-primary`, `--text-secondary`, `--text-hint`, `--surface`, `--background`, `--divider`
- Semantic: `--success`, `--warning`
- Use the variables — do not hardcode hex values in new CSS.

Both stylesheets share the same variables (`styles-chatbot.css` consumes them under `.pc-*` classes). Page-specific styles all live in `styles.css`; only the chatbot widget has its own file.

## 8. Publications chatbot architecture

```
[ Browser ]
  └── chatbot-widget.js  (drawer + side trigger + FAB)
        │  POST { paperId?, messages, ... }
        ▼
[ Cloudflare Worker: papercast-chat ]   ← origins allowlisted: alipourmousavi.com, pourmousavi.github.io
        │  reads chatbot-index.json (deployed alongside the Worker)
        ▼
[ LLM provider ]  → streaming reply
```

- The Worker URL is configured via `data-worker-url` on `<div id="pc-chat-root">` in `publications.html`. If the attribute is missing or contains `example.workers.dev`, the widget self-disables (see `chatbot-widget.js:9-13`).
- The widget renders **three** entry points: a slide-in drawer (`.pc-drawer`), a desktop side pull-tab (`.pc-side-tab`), and a mobile FAB (`.pc-fab`). All are always visible — there is no scroll gating.
- The "Ask" button on each publication card is rendered by `publications.js` only if the paper's `id` is in `chatbot-papers.json`.
- When the user clicks Ask on a specific paper, `chatbot-widget.openWithPaper(paperId)` opens the drawer in paper-scoped mode; opening the drawer from the side tab/FAB opens it in whole-corpus mode. Be careful when modifying mode-switching — the bug "context not cleared when switching to general mode" was specifically fixed and is easy to regress.

## 9. Automated workflows

- **`.github/workflows/update-scholar.yml`** — daily 03:17 UTC. Reads SerpAPI, runs `scripts/update_scholar_metrics.py`, commits `data/scholar_metrics.json` if changed. Requires repo secret `SERPAPI_API_KEY`. Author ID `XoHCLowAAAAJ` is hardcoded in the workflow env.
- The `chore: update scholar metrics` commits are this bot. Don't squash them into feature commits.

## 10. Local development

No install step. Two options:

```bash
# Option A: just open the file (some features that fetch JSON will fail under file://)
open index.html

# Option B: serve the directory (preferred — JSON fetches and the chatbot widget work)
python3 -m http.server 8000
# then visit http://localhost:8000/publications.html
```

The chatbot widget will hit the production Worker from localhost, which is fine for read-only testing. There is no local Worker dev loop in this repo.

## 11. Conventions & guardrails

- **Edit JSON, not HTML, for content.** If you find yourself adding `<div class="publication-card">` markup by hand to `publications.html`, stop — add a `data/publications.json` entry instead.
- **Preserve every page's `<head>`.** Open Graph tags, canonical URLs, JSON-LD structured data, and the Google Analytics block are SEO-critical. Don't reorder or strip them when refactoring.
- **No JS frameworks.** Vanilla DOM APIs only. No bundling, no transpilation, no module imports beyond plain `<script src>` tags.
- **No emojis in code or commits** unless the user asks. The Featured guide uses some for decoration but new files should not introduce them.
- **Filenames are case-sensitive in production.** `Jpaper1-2025.pdf` and `JPaper1-2025.pdf` are different files on GitHub Pages even though macOS treats them as equal locally.
- **The single big `styles.css` is intentional.** Don't split it into per-page files unless explicitly asked — global cascade order matters and the whole site is small enough that the file size is not a problem.
- **Commit style:** short imperative subject, optionally followed by a body. Examples from history: `Add jpaper2-2026, jpaper3-2026 to chatbot`, `Move chatbot into a slide-in drawer with persistent side trigger`, `feat: add audio summaries for publications`. Both bare and `feat:`/`chore:`-prefixed forms exist; match the surrounding style.
- **Don't push secrets.** `SERPAPI_API_KEY` lives in GitHub Actions secrets; never hardcode it. `.gitignore` already excludes `.claude/settings.local.json` and `.DS_Store` — keep it that way.
- **Citations and h-index in HTML are placeholders.** They appear in `publications.html` and `index.html` as stat-bar defaults (`90+`, `3,700+`, `30`) but are overwritten at runtime by `js/scholar.js` from `data/scholar_metrics.json`. Edit the JSON, not the HTML, if a number looks wrong.

## 12. When in doubt

- For "how do I feature paper X?" → `HOW-TO-FEATURE-PAPERS.md`.
- For "what fields can a publication have?" → §4.1 above, or grep existing entries in `data/publications.json` for examples of the rarer types.
- For "why isn't the Ask button showing on paper X?" → check that the `id` is in `data/chatbot-papers.json`.
- For "the chatbot returns 4xx from the Worker" → that's a Worker-side issue; this repo only ships the front-end. Check the Worker repo (§13) and Cloudflare logs.

## 13. Companion projects (outside this repo)

Two sibling projects feed this site. They live on the same machine but in **separate git repos** — changes there don't auto-propagate; the website only consumes their outputs (MP3s in `docs/`, `chatbot-index.json` and `chatbot-papers.json` in `data/`).

### 13.1 PaperCast — `~/Documents/PaperCast/papercast/`

**The upstream content pipeline.** A local-first FastAPI + React app that turns PDFs into podcast-style audio summaries and (per the user) also drives chatbot indexing. Stack: Python 3.11+ / FastAPI / SQLite / SQLAlchemy 2 backend, React 19 / Vite / Tailwind frontend, PyMuPDF for PDF extraction, Anthropic Claude for script generation, Microsoft Edge TTS for synthesis. See `~/Documents/PaperCast/papercast/README.md` and the `papercast-implementation-plan-v2.md` / `chatbot-plan.md` documents at its root for current scope.

What this means for the website:

- Audio summaries (`docs/JPaperN-YYYY.mp3`) are **produced in PaperCast and copied here** — don't try to regenerate them in this repo.
- The chatbot vector index (`data/chatbot-index.json`) and its allowlist (`data/chatbot-papers.json`) are also generated by PaperCast. When you add a paper to the chatbot (§5.3), the indexing step happens there.
- PaperCast has its own `CLAUDE.md`. If a task spans both repos, read both.

### 13.2 papercast-chat-worker — `~/Dropbox/Website/papercast-chat-worker/`

**The deployed Cloudflare Worker** that the front-end widget talks to. TypeScript + Wrangler (`wrangler.toml`, `package.json`, `src/`, `test/`). This is where:

- The CORS allowlist for `alipourmousavi.com` and `pourmousavi.github.io` is enforced.
- The vector index produced by PaperCast is hosted/served.
- LLM calls and per-IP rate limiting/quota live.

Deploy is `wrangler deploy` from that directory. The website never imports its source — it only knows the URL via `data-worker-url` on `#pc-chat-root`.
