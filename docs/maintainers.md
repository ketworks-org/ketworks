# Maintaining Ketworks

Notes for maintainers: how the site is deployed, and how the optional arXiv bot proposes results. Contributors do not need any of this; see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Deployment

The site is served by Netlify at **https://ketworks.org**, built from `main`. The domain is registered at Hostpoint, which also keeps its DNS: an A record for `ketworks.org` points to Netlify's load balancer `75.2.60.5`, and `www` is a CNAME to the Netlify project, which redirects to the bare domain. Netlify issues the HTTPS certificate. The project's own address, `nqs-draft-k7x2m9.netlify.app`, keeps working.

Until the content has been reviewed, the site asks not to be indexed: a `noindex` meta tag in `site/index.html` and `site/wiki.template.html`, a `robots.txt` that disallows everything (`site/robots.txt`), and an `X-Robots-Tag` header (`site/_headers`). Remove all three when the site should appear in search engines.

Deployment runs in GitHub Actions. The **Deploy site** workflow (`.github/workflows/deploy.yml`) runs the tests, builds the site on every push to `main` and uploads `dist` to the Netlify project with the Netlify CLI. It needs two repository secrets, `NETLIFY_AUTH_TOKEN` (a personal access token from Netlify) and `NETLIFY_SITE_ID` (the project ID); without them the run stops with a warning. The Netlify project itself is not linked to the repository; this began because Netlify's free plan does not build private organization repositories. `netlify.toml` still describes the build for a linked setup. If the repository is linked in Netlify, remove the workflow's secrets so that only one of the two deploys.

GitHub Pages is not used (`PUBLISH_PAGES` unset); Netlify serves the site.

## Repository rules

`main` should only change through reviewed pull requests. A suggested ruleset (required approval, code-owner review, the `validate` check, no bypass) is in `.github/ruleset.example.json`; apply it under Settings, Rules. The reviewer is set in `.github/CODEOWNERS`.

## The arXiv bot

The bot is switched off. When enabled, it searches arXiv daily for new neural-quantum-state papers, extracts candidate energies and opens one pull request per paper version. A human reviews and merges; the bot never merges.

### Setup

1. The repository is [ketworks-org/ketworks](https://github.com/ketworks-org/ketworks), with `main` as its default branch. The bot discovers the default branch; the included validation/publication workflows target `main`.
2. The initial reviewer is `@gcarleo` in `.github/CODEOWNERS`; add other curators as needed. In repository settings, require at least one human approval, dismiss stale approvals on new commits, require code-owner review and the `validate` check, and disallow bypasses. A suggested ruleset is in `.github/ruleset.example.json`. The bot checks for a required approval and stale-review dismissal before writing anything.
3. Configure repository **secrets** `OPENAI_API_KEY` and `NQS_BOT_TOKEN`. Use a dedicated bot identity and a repository-scoped fine-grained token with Contents read/write, Pull requests read/write, and Administration read (for branch-protection inspection). Do not give the bot a ruleset bypass or approval responsibility. An installation token from a GitHub App can replace this token if supplied at runtime.
4. Configure repository **variables** `OPENAI_MODEL` (a model supporting Responses structured outputs) and `ARXIV_CONTACT` (maintainer email). No model or API key is assumed.
5. GitHub Pages is optional, since Netlify serves the site. To move to Pages, enable Pages with **GitHub Actions** as its source, set the repository variable `PUBLISH_PAGES=true`, point the two DNS records at GitHub, and remove the Netlify secrets. Run `Validate` and `Publish reviewed site` after setup.
6. Set repository variable `BOT_ENABLED=true`. Run `Daily arXiv proposals` manually to validate connectivity, then let its 06:17 UTC daily schedule run. Inspect the first real extractions before broadening discovery.

Use a bot PAT or GitHub App token, not the built-in `GITHUB_TOKEN`, for PR creation: events made using `GITHUB_TOKEN` generally do not start other workflows. The validation workflow must run on the proposed data. No bot code calls a merge, approval, or default-branch update endpoint.

GitHub schedules can be delayed and public-repository schedules can be disabled after 60 inactive days. Configure workflow-failure notifications and an external heartbeat if uninterrupted daily operation is required; a missing run cannot report its own failure. The workflow retains a summary and extraction artifacts for 30 days. It caches completed paper versions and carries an incomplete scan forward until its backlog is processed.

### Extraction and review

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

### Limits

The offline tests cover eligibility, normalization, source provenance, duplicates, revision handling, PR idempotency, API response handling, and exclusion of proposals from publication. They do not measure real-paper extraction precision or recall. A model key, GitHub repository, review configuration, and an initial curator audit are needed before calling the daily system operational. Keyword discovery cannot guarantee that every relevant paper is found; expand the query and review missed papers over time.

### References

- [arXiv API manual](https://info.arxiv.org/help/api/user-manual.html)
- [arXiv API terms and rate limits](https://info.arxiv.org/help/api/tou.html)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [GitHub workflow triggering and tokens](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- [GitHub scheduled workflow limitations](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [GitHub repository rules](https://docs.github.com/en/rest/repos/rules)
