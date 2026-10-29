# Mohammad Amin Raeisi — personal homepage

A dark navy academic homepage for **aminra81.github.io**, with About, Publications, CV, and Misc pages. The About page contains a few biographical paragraphs, profile links, and the photograph at its original proportions. Plain HTML, CSS, and JavaScript; no package installation or framework is required.

## Edit the content

- `content/site.json`: biography, social links, education, teaching, service, and Misc entries.
- `content/publications.json`: paper titles, authors, venues, links, abstract summaries, and BibTeX. Use `abstractType: "full"` when replacing a summary with the full author-provided abstract.
- `assets/portrait.jpg`: profile photograph.
- `assets/cv.pdf`: downloadable and embedded CV. `assets/cv.tex` is the corresponding editable source.
- `assets/style.css`: colors, typography, and responsive layout.
- `scripts/build.mjs`: shared page markup and templates.

After content changes, regenerate the HTML and bibliography from the repository root:

```sh
node scripts/build.mjs
node scripts/check.mjs
```

Commit the regenerated HTML and bibliography with the content edits. GitHub Pages can serve the committed files directly. The website still works without JavaScript; JavaScript adds publication search, topic filters, and the mobile menu.

The public routes are `/`, `/publications/`, `/cv/`, and `/misc/`. Each section is served by an `index.html` inside its directory. The old `/publications.html`, `/cv.html`, and `/misc.html` URLs redirect to the corresponding clean routes and retain query strings and paper anchors. Explicit `index.html` visits are normalized in the address bar by the shared script.

## Preview locally

```sh
node scripts/serve.mjs
```

Open `http://localhost:4173`. Stop the server with Ctrl+C.

## Publish updates

Push checked changes to `master` to update the live site. In the repository’s **Settings → Pages**, the publishing source is **Deploy from a branch**, the `master` branch, and **/ (root)**. `.nojekyll` makes GitHub Pages serve the plain static pages. The public address is `https://aminra81.github.io/`.

The previous Academic Pages/Jekyll files are preserved in the repository history and source tree. The static homepage uses its own HTML and assets.

## Notes

Publication metadata was checked against primary paper sources on 2026-10-29. Expandable text is labeled as a research/abstract summary; the linked papers contain the complete abstracts. Source URLs and verification notes are retained in `content/publications.json`. No personal hobbies, advisor names, or teaching dates have been invented.

The CV PDF was compiled from the current Overleaf resume, including the Yale Teaching Fellow entry. The website’s LaTeX copy uses an equivalent TeX accent for the character ć to ensure it renders with the local compiler. The original Overleaf source is maintained separately.

Typography uses Roboto and Roboto Mono from Google Fonts with system fallbacks. The browser icon is Yale’s official 96×96 favicon, sourced from `https://www.yale.edu/sites/all/themes/yale_blue/images/favicons/favicon-96x96.png`. There are no analytics, cookies, external JavaScript libraries, or backend services.
