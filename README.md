# Rebecca Diamond

A small, static academic website, hosted on GitHub Pages. No framework, package installation, analytics, or external font service is required.

## Update content

- `content/profile.json`: affiliation, contact details, CV link, and short introduction.
- `content/papers.json`: research titles, coauthors, dates, publication status, links, and optional abstracts. Set `recent: true` on the three papers to display on the homepage.
- `content/work-in-progress.json`: work without a current standalone paper page.
- `files/`: original paper PDFs and CV, served directly by GitHub Pages.
- `content/pdf-manifest.json`: original filenames, page counts, sizes, and SHA-256 checksums.
- `assets/rebecca-diamond.jpg`: portrait from the existing website.
- `assets/style.css`: shared visual styles and mobile layouts.
- `assets/fonts/`: self-hosted Newsreader typeface and its SIL Open Font License.

Preserve a paper's `slug` when updating its title or status: it identifies the paper in the research list. Previously published individual paper URLs redirect to those list entries. Use the actual paper's author order in `authors` and verified BibTeX in `citation`; omit these fields when not verified. Do not add code or data links. Keep the tone factual and restrained.

## Build and preview

Requires Node.js 20 or later. There are no npm dependencies.

```sh
npm run build
npm run check
npm run dev
```

The local preview is at `http://127.0.0.1:4173/`. The build generates `docs/`, with the homepage, the full research list, compatibility redirects, shared assets, sitemap, and a `.nojekyll` file. Paper titles link directly to PDFs; verified abstracts expand in place on both pages. CV navigation links directly to the document. Core content and navigation work without JavaScript; search and topic filtering are progressive enhancements.

## Publish

GitHub Pages is configured to publish the `docs` directory on the `main` branch. After editing, run the build and checks, then commit the source and generated `docs/` together. Pushing to `main` publishes the change.

The default site URL is `https://diamondr.github.io/rebecca-diamond/`. Override `SITE_URL` when rebuilding for a custom domain. The `home/` compatibility page redirects to the homepage, and `research/` retains the existing research path.

No custom domain is set in this repository. Connecting `www.rebecca-diamond.com` is a separate cutover requiring the domain's DNS settings. At cutover, set the custom domain in GitHub Pages, update DNS, rebuild with `SITE_URL=https://www.rebecca-diamond.com`, and verify HTTPS and old URLs. Keep the current site available until the new domain setup has been verified.

## Sources and content notes

The research list, publication statuses, CV link, office details, and portrait were migrated from Rebecca's public website on September 5, 2026. The homepage highlights three 2026 working papers. All 21 linked papers and three works in progress are retained.

Abstracts and citation metadata for the recent GLP-1 and rental-property papers come from their NBER pages, using the June 2026 NBER versions. Existing author-draft dates remain as listed on the original website. The HOPE VI abstract and author order are from Opportunity Insights. Source links appear beside the abstracts. Other paper abstracts and exact citation records are omitted until verified.

- https://www.rebecca-diamond.com/
- https://www.rebecca-diamond.com/research
- https://www.nber.org/papers/w35387
- https://www.nber.org/papers/w35258
- https://opportunityinsights.org/paper/hopevi/

All 23 PDFs—including the CV and original rent-control draft—were downloaded from the original website through the browser and are now hosted in this repository. Each file was checked as a readable PDF and retained byte for byte. There are no SharePoint links in the generated website. Updating a document now means replacing its file in `files/`, updating its size, page count, and SHA-256 in the manifest, and rebuilding the website.

The build checks all internal links and anchors, paper counts, homepage recency, excluded code/data sections, search/filter behavior, and the checksums of all source and published PDF copies.
