# MERIT Lab identity — design

Date: 2026-08-29
Status: approved for planning
Scope: website only (`pourmousavi.github.io`). No changes to PaperCast or the chat Worker.

## 1. Goal

Reflect the newly chosen lab name — **MERIT Lab (Markets, Energy Resources & Intelligent Technologies)** —
across the site, and use the rollout to strengthen two conversion paths that the current
personal-profile site serves weakly:

- **Industry** — visitors evaluating whether the lab can solve a commercial problem.
- **Research talent** — prospective PhD students and postdocs deciding whether to apply.

A named lab is something a company can contract and a student can join; a personal profile is
neither. The name also survives beyond any individual, giving grants, alumni, and OptiGrid a
single entity to point at.

## 2. Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Brand level | **Lab-led.** MERIT Lab is the site's primary identity; Ali appears as Director. | Companies engage labs; students join labs. |
| Home page | **Lab masthead, Director card beneath.** | Keeps the lab first without hiding the person people searched for. |
| Research structure | **Three pillars + explicit integration claim.** Existing six capability areas retained and tagged. | Makes the acronym mean something without discarding working content. |
| Visual mark | **Typographic wordmark**, HTML/CSS, existing design tokens. | No new assets, no build step, scales, zero maintenance. |
| Personal bio | **Stays on `index.html`**, retitled. | `index.html` ranks for "Ali Pourmousavi"; stripping its biographical content would cost that ranking. |
| Name in titles | **Every page title keeps "Dr. Ali Pourmousavi"** alongside "MERIT Lab". | The personal name carries years of search equity the lab name does not. |

## 3. Brand and messaging layer

### 3.1 Lockup

- Short form everywhere: **MERIT Lab**
- Expansion — *Markets, Energy Resources & Intelligent Technologies* — appears **once per page**:
  in the hero (home) or the footer (all other pages). Never repeated inline in body copy.
- Affiliation lockup, used in the footer and in schema:
  *MERIT Lab · School of Electrical and Mechanical Engineering, Adelaide University*

### 3.2 Positioning sentence

Used verbatim in three places: the home hero, the home `<meta name="description">`, and the home
Open Graph description.

> MERIT Lab builds the algorithms, technologies, and market mechanisms that let renewable energy,
> storage, and electrified industry actually operate together.

### 3.3 Tagline

> Where energy markets, resources, and intelligence meet.

Sits directly under the wordmark in the hero. States the integration claim and explains the
acronym without spelling it out.

### 3.4 The three pillars

Home-page card copy, one card each:

- **Markets** — electricity market design, bidding and settlement, tariffs, aggregation and VPP
  business models: the economics that decide whether a technology gets built.
- **Energy Resources** — batteries, renewables, EVs, flexible demand, and mining/industrial
  electrification: the physical assets and how they behave.
- **Intelligent Technologies** — optimisation, forecasting, and AI that coordinate those assets in
  real time, under uncertainty.

### 3.5 Integration claim

Sits directly under the three pillar cards. This is the load-bearing paragraph of the whole
rollout — industry reads it as commercial understanding, strong applicants read it as a
distinctive research programme rather than a topic list.

> Most groups work in one of these. Our work lives in the overlap. A battery is only worth what
> the market pays it, and it only earns that if the algorithm bids it correctly — so we design the
> asset, the algorithm, and the market rule together.

### 3.6 Pillar mapping for existing capability areas

Used to tag the six areas under `research.html` → *Industry Consultancy & Services*:

| Existing capability area | Pillar tag(s) |
| --- | --- |
| AI & Optimization | Intelligent Technologies |
| Energy Market | Markets |
| Smart Grid Integration | Energy Resources, Intelligent Technologies |
| Battery Storage Systems | Energy Resources, Markets |
| Electric Vehicle Systems | Energy Resources |
| Mining/Industrial Electrification | Energy Resources, Markets |

## 4. File-by-file changes

### 4.1 All nine pages — nav

`index.html`, `research.html`, `publications.html`, `team.html`, `teaching.html`, `resources.html`,
`opportunities.html`, `media.html`, `contact.html`. Each contains one identical `.nav-container`
block.

- Remove `<img class="nav-profile-image">` and the `Dr. Ali Pourmousavi` span from `.logo`.
- Replace with a typographic lockup: `MERIT` in `--primary`, `Lab` in a lighter weight.
- Nav links, hamburger toggle, `aria-*` attributes, and the `.active` class on each page's own
  link are unchanged.
- The profile photo relocates to the Director card on `index.html` (§4.3).

### 4.2 All nine pages — footer and `<head>`

Footer:
- `.footer-about` heading becomes `MERIT Lab`.
- First paragraph line: the expansion. Second line: the school/university lockup.
- Link columns unchanged. Copyright line remains `© 2026 Dr. Seyyed Ali Pourmousavi Kani`.

`<head>`:
- Title pattern: `<Page> | MERIT Lab | Dr. Ali Pourmousavi`. Home becomes
  `MERIT Lab | Dr. Ali Pourmousavi | Adelaide University`.
- `<meta name="title">`, `og:title`, and `twitter:title` follow the same pattern.
- Meta descriptions and OG descriptions: prepend or substitute the lab name where they currently
  lead with the personal name.
- `og:site_name` becomes `MERIT Lab`.
- **Unchanged:** canonical URLs, the Google Analytics block, Dublin Core and `citation_*` tags,
  `geo.*` tags, favicon links, stylesheet links.

### 4.3 `index.html`

Largest change. Section order after the edit: hero → pillars → Director card → news → Director
background → flagship projects.

- **Hero** (`section.hero#overview`): becomes the lab masthead — wordmark, expansion, tagline,
  positioning sentence. The four existing `.hero-metric` blocks are retained and re-labelled as
  lab metrics; the `id="hero-pubs"` and `id="hero-citations"` hooks must be preserved because
  `js/scholar.js` writes into them.
- **CTAs**: `Work with us` → `research.html#consultancy-services`; `Join us` → `opportunities.html`.
  (Replaces the current `Research` / `PhD Opportunities` pair.)
- **New pillars section**, directly under the hero: three cards from §3.4 plus the integration
  paragraph from §3.5. Reuses existing card-grid classes.
- **New Director card**, under the pillars: profile photo, name, title, IEEE Senior Member,
  one-paragraph bio, links to the CV PDF and Google Scholar.
- **`#background` section** retitled `Director — Background`. Education and appointments timelines
  are unchanged.
- **JSON-LD**: retain the existing `Person` block and add
  `"affiliation": {"@type": "ResearchOrganization", "name": "MERIT Lab"}`. Add a new
  `ResearchOrganization` block with `name`, `alternateName` (the expansion), `description` (the
  positioning sentence), `url`, `founder` (the Person), `parentOrganization` (Adelaide University),
  and `knowsAbout` listing the three pillars. Leave the existing `WebSite` block in place, updating
  its `name` to `MERIT Lab`.

### 4.4 `team.html`

- `<h1>` `Research Team` → `MERIT Lab Team`; subtitle updated to reference the lab.
- `Join Our Research Team` section heading → `Join MERIT Lab`.
- The existing `ResearchGroup` JSON-LD block (currently `"name": "Power Systems Research Group"`)
  takes the real name, the expansion as `alternateName`, the positioning sentence as `description`,
  and the three pillars in `knowsAbout`.
- Team member cards, stats grid, and alumni list are unchanged.

### 4.5 `research.html`

- Add a short intro paragraph above `Industry Consultancy & Services` stating the integration claim
  in industry-facing language, with a call to action pointing at `contact.html`.
- Add a small pillar tag to each of the six capability area cards, per the mapping in §3.6.
- Flagship projects, past consultancy, commercialization, recognition, and professional service
  sections are unchanged.

### 4.6 `opportunities.html` and `resources.html`

Replace group-referring phrasing with the lab name in both body copy and meta descriptions —
approximately six occurrences across the two files:

- `opportunities.html`: meta description, `og:description`, hero subtitle
  ("Join our research group…"), and the `Why Join Our Research Group?` section heading.
- `resources.html`: meta description ("…from Dr. Ali Pourmousavi's research group").

### 4.7 `styles.css`

Three new blocks appended in the existing page-section order, roughly 120 lines. All colours,
spacing, and type sizes come from the existing custom properties — **no hardcoded hex values**.

- `.brand-lockup` — nav variant plus a larger hero masthead variant.
- `.pillar-grid` / `.pillar-card` — three-up on desktop, stacking on mobile.
- `.director-card` — photo plus text, side by side on desktop, stacked on mobile.

### 4.8 Explicitly not touched

`sitemap.xml`, `robots.txt`, `site.webmanifest`, all favicon and Open Graph image assets, every
file under `js/`, every file under `data/`, `styles-chatbot.css`, and the publications chatbot.

## 5. Verification

1. Serve locally: `python3 -m http.server 8000`.
2. Walk all nine pages at a desktop width and at 375px:
   - nav lockup renders and the hamburger toggle still opens and closes;
   - footer lockup renders;
   - no horizontal overflow at 375px.
3. `index.html` specifically: confirm `js/scholar.js` still populates `#hero-citations` and
   `#hero-pubs` after the hero rewrite.
4. Paste the `index.html` and `team.html` JSON-LD blocks into Google's Rich Results test; both must
   validate.
5. Confirm no page title has lost the string `Ali Pourmousavi`.

## 6. Out of scope

Flagged during design, deliberately excluded from this change:

- MERIT-branded favicon set and Open Graph card images.
- A `meritlab.*` domain or any DNS change.
- A dedicated lab landing page separate from the home page.
- Updating Google Scholar, LinkedIn, and the Adelaide University staff profile to name the lab.

## 7. Open question

Does Adelaide University require lab names to be registered, or mandate a specific affiliation
lockup? Not a blocker for implementation, but should be confirmed before the change ships to
production, since every push to `main` deploys live.
