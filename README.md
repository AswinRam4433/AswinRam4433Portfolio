# aswinnr.com

Personal portfolio for Aswin Ramanathan — plus two long-lived sections for
writing: a **Blog** and a **Bookshelf**.

Live at <https://aswinnr.com>.

---

## How the site is put together

There are two layers, and it's worth understanding the split before editing
anything:

| Layer | Lives in | Built by | Served at |
| --- | --- | --- | --- |
| Hand-written pages | `index.html`, `blog.html`, `bookshelf.html` | nothing — they're static | `/`, `/blog.html`, `/bookshelf.html` |
| Long-form content | `blogs/` (a Hugo site) | Hugo + the [Blowfish](https://blowfish.page) theme | `/blogs/...` |

The hand-written pages own the site's visual identity (cream background, olive
palette, Lora + Inter). The Hugo site owns the *content*: it renders each
Markdown file into a readable article page under `/blogs/`, and additionally
emits small **JSON feeds** that the hand-written pages fetch at runtime to build
their listings.

So the flow for a new blog post or book note is always the same:

```
blogs/content/...  →  Hugo build  →  article page at /blogs/...
                                 ↘  JSON feed    →  fetched by blog.html / bookshelf.html
```

Nothing is duplicated by hand. Write Markdown, push, done.

```
.
├── index.html               # landing page
├── blog.html                # blog listing (fetches the posts feed)
├── bookshelf.html           # bookshelf listing (fetches the shelf feed)
├── css/
│   ├── style.css            # design tokens + every component, including the shelf
│   └── post.css             # long-form article styles (used by Hugo posts)
├── js/
│   ├── main.js              # mobile nav + scroll-reveal
│   ├── blog.js              # renders blog.html from the posts feed
│   └── bookshelf.js         # renders bookshelf.html from the shelf feed
├── blogs/                   # ← the Hugo site
│   ├── config/_default/     # hugo.toml, params.toml, menus.en.toml, languages.en.toml
│   ├── content/
│   │   ├── posts/           # blog posts  → /blogs/posts/<slug>/
│   │   └── bookshelf/       # book + paper notes → /blogs/bookshelf/<slug>/
│   ├── layouts/             # site-level template overrides (see the warning below)
│   ├── archetypes/          # front-matter templates for `hugo new`
│   └── themes/              # Blowfish — gitignored, re-downloaded on every build
└── scripts/
    └── build.sh             # Hugo build + dist/ assembly — shared by local dev and CI
```

> **Never edit anything inside `blogs/themes/`.** That directory is gitignored
> and replaced with a fresh download on every CI run, so theme edits are lost
> silently on the next deploy. Site-level overrides go in `blogs/layouts/`,
> which takes precedence over the theme anyway.

---

## Local development

Requires [Hugo extended](https://gohugo.io/installation/) (v0.163.3 — the same
version CI pins). The theme is not committed, so fetch it once after cloning:

```bash
# One-time: grab the Blowfish theme at the version CI uses
curl -L -o /tmp/blowfish.tar.gz \
  https://github.com/nunocoracao/blowfish/archive/refs/tags/v2.104.0.tar.gz
mkdir -p blogs/themes
tar -xzf /tmp/blowfish.tar.gz -C blogs/themes/
mv blogs/themes/blowfish-2.104.0 blogs/themes/blowfish
```

Then build the whole site — Hugo plus the `dist/` assembly — with the same
script CI uses:

```bash
bash scripts/build.sh
python3 -m http.server -d dist 8000     # preview at http://localhost:8000
```

For live reload while editing Markdown, serve the Hugo site directly:

```bash
hugo server --source blogs/ --buildDrafts   # :1313, rebuilds on save
```

`blogs/public/` and `dist/` are both gitignored.

> **Why `dist/` and not the repo root?** `blog.html` and `bookshelf.html` fetch
> their feeds from `/blogs/.../index.json`, and in production those URLs are
> served out of `dist/blogs/`. Serving the repo root instead would 404 on every
> feed — the root pages would render their empty state and look broken.
> `scripts/build.sh` reproduces the production layout locally so what you see is
> what deploys. It also means the `dist/` assembly lives in one place instead of
> being duplicated in the CI workflow.

---

## Writing a blog post

```bash
hugo new content posts/my-post.md --source blogs/
```

…or just create `blogs/content/posts/my-post.md` directly:

```markdown
---
title: "My Post"
date: 2026-09-27
draft: false
summary: "One or two lines shown in the listing on blog.html."
tags: ["go", "distributed-systems"]
---

Body goes here. Standard Markdown, fenced code blocks get copy buttons.
```

- **`summary`** is what appears as the excerpt on `blog.html`. If you omit it,
  Hugo falls back to the first ~220 characters of the post with the HTML
  stripped.
- **`draft: true`** keeps the post out of the build entirely — it won't appear
  in the feed or on the site until you flip it.
- Posts are listed newest-first automatically.
- The feed is emitted by `blogs/layouts/posts/list.postindex.json` to
  `/blogs/posts/index.json`.

---

## Adding to the Bookshelf

The Bookshelf is for notes on things you've read — books, research papers,
long articles. Each entry is a Markdown file that renders as a full article
page under `/blogs/bookshelf/<slug>/`, and also appears as a card on
`/bookshelf.html`.

```bash
hugo new content bookshelf/building-microservices.md --source blogs/
```

That uses the archetype at `blogs/archetypes/bookshelf.md`. The front matter it
produces, and what each field does:

```markdown
---
title: "Building Microservices"
author: "Sam Newman"         # who wrote the work — not you
medium: "book"               # book | paper | article — drives the card label + filters
year: 2021                   # year the work was published, shown next to the label
date: 2026-08-02             # when you read it / wrote the notes
draft: true                  # see "Drafts" below
status: "read"               # read | reading | queued
rating: 5                    # optional, 1–5. Omit the line to hide the dots.
summary: "Shown on the card in the shelf grid."
tags: ["microservices", "architecture"]
---

## What it argues
...
```

Field notes:

- **`medium`** is the one field to get right. It labels the card and drives the
  filter chips at the top of `/bookshelf.html`. Recognised values are `book`,
  `paper`, and `article`; anything else falls back to `book`. Filters are built
  from the data, so a medium with no entries simply doesn't get a chip, and a
  shelf with only one medium hides the filter bar.
- **`status`** only shows a pill on the card when it is `reading` or `queued` —
  finished items stay visually quiet, so in-progress ones stand out.
- **`rating`** is optional and per-entry; there is no site-wide expectation to
  rate things.
- **`date`** controls ordering (newest first).
- The feed is emitted by `blogs/layouts/bookshelf/list.shelfindex.json` to
  `/blogs/bookshelf/index.json`. The blog and shelf feeds are deliberately
  separate output formats, so changing one never affects the other.

### Drafts

`draft: true` works identically for posts and shelf entries, and it is a hard
exclusion — not a hidden-but-reachable page:

- no article page is generated, so `/blogs/bookshelf/<slug>/` does not exist
- the entry is absent from the JSON feed, so it never renders on `/bookshelf.html`
- it is left out of the section list, the sitemap, the RSS feed, and Blowfish's
  search index

`scripts/build.sh` enforces this two ways. It passes `--buildDrafts=false`
explicitly (CLI flags beat config), so drafts cannot ship even if `buildDrafts`
in `hugo.toml` is flipped to `true` by accident. It also wipes `blogs/public/`
before building, because Hugo does not delete destinations it no longer
generates — without that, an entry you published and then re-drafted would
survive as stale HTML and get deployed anyway.

To preview drafts on your machine while writing, serve with the draft flag:

```bash
hugo server --source blogs/ -D      # :1313, drafts included
```

`-D` only affects that local server. The deployed build never uses it.

### Starter entries vs. real ones

**All three entries are currently `draft: true`, so the live shelf is empty** —
`/bookshelf.html` shows its "notes coming soon" state and no entry pages exist
under `/blogs/bookshelf/`. Flip an entry's `draft` to `false` when it is ready.

Two of them are still placeholders: `designing-data-intensive-applications.md`
and `attention-is-all-you-need.md`. Their bodies are generic summaries rather
than your own reading notes, and their `rating` values are invented. Each has a
"Starter entry" note at the top of the body saying so. Replace them with your
own write-up (deleting that line), or remove them outright:

```bash
rm blogs/content/bookshelf/{designing-data-intensive-applications,attention-is-all-you-need}.md
```

`building-microservices.md` is real content — your own review of Sam Newman's
book, moved here from `blogs/content/posts/`.

---

## Deployment

Deploys are automatic. `.github/workflows/vercel.yaml` runs on every push to
`main` (production) and on every pull request (preview).

What the workflow does:

1. Installs Hugo `0.163.3` (extended).
2. Downloads Blowfish `v2.104.0` into `blogs/themes/`.
3. Runs `bash scripts/build.sh`, which builds the Hugo site and assembles
   `dist/`:
   - every `.html` at the repo root → served at `/`
   - `css/`, `js/`, `bazinga.png`, `github-mark-white.png`, `CNAME` → served at `/`
   - `blogs/public/` → served at `/blogs/`
4. Deploys `dist/` to Vercel — `--prod` for pushes to `main`, a preview URL for
   pull requests.

Because the assembly lives in `scripts/build.sh` rather than in the workflow,
running it locally produces the same `dist/` CI deploys — useful for checking a
change before pushing.

**Adding a new top-level page** needs no workflow change — the `cp ./*.html` step
picks up any HTML file at the repo root. Just make sure it links `css/` and
`js/` with paths relative to the root (see `bookshelf.html` for the pattern).

**Bumping Hugo or Blowfish** is done by editing `HUGO_VERSION` /
`BLOWFISH_VERSION` in the `env:` block of the workflow — those two pins are the
single source of truth for the build.

### Required GitHub secrets

Vercel deploys via CLI, so three repository secrets must exist
(**Settings → Secrets and variables → Actions**):

| Secret | Where to find it |
| --- | --- |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

The `.vercel/` directory is gitignored; the committed values in
`.vercel/project.json` correspond to the `aswinnr-portfolio` project.

### Manual deploy

```bash
bash scripts/build.sh
vercel deploy dist --prod
```

### Domain

`CNAME` holds the custom domain and is copied into `dist/` on every deploy.

---

## Analytics

Two trackers are wired into each root page — remove either if you'd rather not
have it.

- **GoatCounter** (privacy-first, no cookies): already configured for
  `https://aswinramanathan.goatcounter.com`. Stats are private to you.
- **Vercel Web Analytics**: enabled per-project in the Vercel dashboard; the
  `/ _vercel/insights/script.js` snippet is the client-side half.

Note that Hugo-rendered pages under `/blogs/` are a separate document tree and
do not inherit these snippets — add them to
`blogs/layouts/partials/extend-head.html` if you want coverage there too.

---

## Design tokens

All colours, fonts, and layout constants live at the top of `css/style.css`
under `:root`. The active palette is deep olive / moss on warm cream; two
alternate palettes (amber/terracotta, dusty teal/slate) sit commented out
directly beneath it and can be swapped in by uncommenting one block.

The Bookshelf reuses those tokens rather than defining its own — card
backgrounds, tag chips, and the coloured "spine" on each card all come from the
same accent variables, so a palette swap restyles the shelf automatically.
