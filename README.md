# Ketworks

Ketworks is a community project on neural quantum states with two parts, shown with one colour each.

- **Ketbook** (red square) is a reference on variational Monte Carlo, optimization, network architectures and benchmark problems, with a common notation and a citation for each quantitative statement.
- **Ketboard** (blue circle) lists variational energies for exactly defined benchmark instances. **Original NQS variational energies only.** Each entry is the energy printed in a versioned arXiv paper, with its table and row.

Contributing is the third colour (yellow triangle): wiki edits and result records both go through a pull request that a curator reviews. A daily bot can discover new arXiv papers and revisions, extract numerical results and open a pull request; it is switched off, and a human approves and merges before any number reaches the published site.

## Current state

The repository is private and the site is a draft. Ketbook has 14 pages, all drafts awaiting curator review: fundamentals, five architecture pages and the benchmark pages. Ketboard has 17 instances (square J1–J2, triangular Heisenberg, Hubbard and t–t′ Hubbard) with 79 reviewed rows from 29 papers. Instances are defined in `data/benchmarks.json`, records in `data/results/`.

## Run locally

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
npm ci --ignore-scripts
npm test
python -m unittest discover -s tests -v
python -m nqsbot.build
python -m http.server 8080 --directory dist
```

Requires Node.js 22+ and Python 3.12+. LaTeX is rendered by pinned KaTeX during the build, including accessible MathML; CSS and math fonts are bundled with the site. Section headings get stable anchors and each article carries a table of contents. The site's own typography is DM Sans for display, Source Serif 4 for reading text, and IBM Plex Mono for benchmark keys, energies and identifiers, all with local fallbacks. Wiki edits and manually contributed results are proposed through GitHub PRs. See [CONTRIBUTING.md](CONTRIBUTING.md). The repository must be public for anyone to fork and contribute.

The site works under a subdirectory, including a GitHub project Pages URL. It uses no server database or browser API keys. Fonts have local fallbacks.

## Hosting and private preview

The site is served by Netlify at **https://ketworks.org**, built from `main`. The domain is registered at Hostpoint, which also keeps its DNS: an A record for `ketworks.org` points to Netlify's load balancer `75.2.60.5`, and `www` is a CNAME to the Netlify project, which redirects to the bare domain. Netlify issues the HTTPS certificate. The project's own address, `nqs-draft-k7x2m9.netlify.app`, keeps working.

While the repository is private, the site is not meant to be found. The build adds `noindex` to every page, a `robots.txt` that disallows everything, and an `X-Robots-Tag` header, so neither address is indexed even if it leaks. It is obscurity, not authentication: share the address only with reviewers, and note that the domain name itself is public in certificate logs.

Simplest setup, no secrets: in Netlify choose **Add new project → Import an existing project → GitHub**, authorize access to `ketworks-org/ketworks`, and pick the branch to deploy. `netlify.toml` supplies the build command, the publish directory and the Python and Node versions; Netlify rebuilds on every push to that branch and gives the project a random name. Deploy previews for pull requests get their own random addresses. Edit links on the preview point at the deployed branch.

Alternative, when the build should run in GitHub Actions instead: store `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` as repository secrets, set the variable `PREVIEW_ENABLED=true`, and run the **Preview site** workflow. In that case do not also connect the repository in Netlify.

GitHub Pages stays off (`PUBLISH_PAGES` unset) until the content has been reviewed and the repository is public.

## Activate the daily bot

1. The repository is [ketworks-org/ketworks](https://github.com/ketworks-org/ketworks), with `main` as its default branch. The bot discovers the default branch; the included validation/publication workflows target `main`.
2. The initial reviewer is `@gcarleo` in `.github/CODEOWNERS`; add other curators as needed. In repository settings, require at least one human approval, dismiss stale approvals on new commits, require code-owner review and the `validate` check, and disallow bypasses. A suggested ruleset is in `.github/ruleset.example.json`. The bot checks for a required approval and stale-review dismissal before writing anything.
3. Configure repository **secrets** `OPENAI_API_KEY` and `NQS_BOT_TOKEN`. Use a dedicated bot identity and a repository-scoped fine-grained token with Contents read/write, Pull requests read/write, and Administration read (for branch-protection inspection). Do not give the bot a ruleset bypass or approval responsibility. An installation token from a GitHub App can replace this token if supplied at runtime.
4. Configure repository **variables** `OPENAI_MODEL` (a model supporting Responses structured outputs) and `ARXIV_CONTACT` (maintainer email). No model or API key is assumed.
5. Choose the intended audience before enabling GitHub Pages: this repository is private, and a Pages site may be publicly accessible. When ready, enable Pages with **GitHub Actions** as its source and set repository variable `PUBLISH_PAGES=true`. Run `Validate` and `Publish reviewed site` after setup. The included private Sites preview is available independently.
6. Set repository variable `BOT_ENABLED=true`. Run `Daily arXiv proposals` manually to validate connectivity, then let its 06:17 UTC daily schedule run. Inspect the first real extractions before broadening discovery.

Use a bot PAT or GitHub App token, not the built-in `GITHUB_TOKEN`, for PR creation: events made using `GITHUB_TOKEN` generally do not start other workflows. The validation workflow must run on the proposed data. No bot code calls a merge, approval, or default-branch update endpoint.

GitHub schedules can be delayed and public-repository schedules can be disabled after 60 inactive days. Configure workflow-failure notifications and an external heartbeat if uninterrupted daily operation is required; a missing run cannot report its own failure. The workflow retains a summary and extraction artifacts for 30 days. It caches completed paper versions and carries an incomplete scan forward until its backlog is processed.

## Extraction and review

- Discovery queries the arXiv API by last update, with a 14-day overlap by default. It paginates, deduplicates cross-lists, serializes requests with at least 3 seconds between them, and uses retry/backoff. A saved scan watermark extends the window after downtime. A manual `lookback_days` input supports backfilling.
- Version-pinned HTML is preferred; text-extracted PDF is the fallback. Raw paper files are processed locally and are not redistributed with the site. Source URLs and SHA-256 checksums are recorded. Image-only or oversized sources fail explicitly; figures are not silently digitized.
- Structured extraction proposes numbers and evidence. It has no tools and receives no GitHub credentials. Paper text is treated as untrusted data. An exact schema is useful for parsing, but does **not** establish scientific correctness.
- Deterministic validation rejects non-NQS, non-variational, cited comparison results, invalid decimals, incompatible units, unknown normalization on matched benchmarks, duplicate rows, and energy tokens absent from the fetched source.
- One PR is opened per paper version. Existing open, merged, or closed PRs suppress repeat proposals; a deliberately closed PR is not reopened. A new arXiv version can produce a new PR. Review must reconcile pending earlier versions; CI rejects version regressions.
- Results matching registered instances go to `data/results/<arxiv-id>.json`. Eligible unmatched systems go to `data/proposals/<arxiv-id>.json` in a **draft PR**. A curator can add the exact definition and move matching rows into results. Proposal files never enter the site payload. Extraction issues also make a PR a draft.
- Source locations and reviewer checkboxes are included in the PR. A source-level review is not an independent reproduction. Statistical uncertainties are displayed with their reported type; absent uncertainties remain unknown.
- Every result row carries a `method_class` (one of `rbm`, `feed_forward`, `convolutional`, `autoregressive`, `transformer`, `backflow`, `hybrid`, `other`) used for filtering on Ketboard; the extraction prompt defines the classes.
- Store printed decimals as strings. Only total-to-per-site normalization is automatic. Pauli/spin conventions, energy offsets, and unit conversions require curator reconciliation.
- Only newly reported ground-state NQS variational results are in scope. Neural backflow and neural fermionic wavefunctions may qualify; using a neural guide in a projection method does not. Extrapolated energies, non-NQS references, and results quoted from earlier papers are excluded.

For local extraction without creating a PR, set environment variables securely and run:

```sh
python -m nqsbot.collect --max-papers 2
```

This writes proposed files and a PR body under ignored `.run/`. Add `--publish-prs` only after configuring the GitHub token and required review gate. Local and PR processing have separate cache keys. To reconsider a closed proposal, resolve it on GitHub deliberately; changing the extraction prompt does not reopen it automatically.

## Layout

- `site/`: Bauhaus-inspired interface; publication includes only reviewed result files. `site/leaderboard.mjs` holds the Ketboard table logic (filtering by architecture class and text, sorting by any column, per-instance summaries) and is unit-tested in `npm test`.
- `wiki/`: community-editable Markdown articles with build-time LaTeX rendering, grouped by section (Fundamentals, Architectures, Benchmarks) in `wiki/index.json`.
- `CONTRIBUTING.md`: wiki and result PR instructions; the site has direct edit links and a result preparation form.
- `data/benchmarks.json`: canonical physical definitions.
- `data/results/`: entries approved by merging their PRs.
- `data/proposals/`: unmatched instances, excluded from the site.
- `nqsbot/`: collection, extraction, validation, PR creation, and static build.
- `prompts/extract.txt`: extraction scope and scientific rules.
- `.github/workflows/`: daily collection, PR checks, metadata completion on result pull requests, preview and publication after merge.

## Verification limits

The offline tests cover eligibility, normalization, source provenance, duplicates, revision handling, PR idempotency, API response handling, and exclusion of proposals from publication. They do not measure real-paper extraction precision or recall. A model key, GitHub repository, review configuration, and an initial curator audit are needed before calling the daily system operational. Keyword discovery cannot guarantee that every relevant paper is found; expand the query and review missed papers over time.

## References

- [arXiv API manual](https://info.arxiv.org/help/api/user-manual.html)
- [arXiv API terms and rate limits](https://info.arxiv.org/help/api/tou.html)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [GitHub workflow triggering and tokens](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- [GitHub scheduled workflow limitations](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [GitHub repository rules](https://docs.github.com/en/rest/repos/rules)
