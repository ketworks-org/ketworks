# Maintaining Ketworks

Notes for maintainers: how the site is deployed and how `main` is protected. Contributors do not need any of this; see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Deployment

The site is served by Netlify at **https://ketworks.org**, built from `main`. The domain is registered at Hostpoint, which also keeps its DNS: an A record for `ketworks.org` points to Netlify's load balancer `75.2.60.5`, and `www` is a CNAME to the Netlify project, which redirects to the bare domain. Netlify issues the HTTPS certificate. The project's own address, `nqs-draft-k7x2m9.netlify.app`, keeps working.

Search engines may index the site. `robots.txt` allows everything and points to `sitemap.xml`, which the build writes with the landing page and every Ketbook page. Every page carries a canonical link to its address on `ketworks.org`, and `site/_redirects` sends the project's Netlify address to the domain, so search engines see one site. Ketboard views are part of the landing page and are not listed separately.

Deployment runs in GitHub Actions. The **Deploy site** workflow (`.github/workflows/deploy.yml`) runs the tests, builds the site on every push to `main` and uploads `dist` to the Netlify project with the Netlify CLI. It needs two repository secrets, `NETLIFY_AUTH_TOKEN` (a personal access token from Netlify) and `NETLIFY_SITE_ID` (the project ID); without them the run stops with a warning. The Netlify project itself is not linked to the repository; this began because Netlify's free plan does not build private organization repositories. `netlify.toml` still describes the build for a linked setup. If the repository is linked in Netlify, remove the workflow's secrets so that only one of the two deploys.

Pull requests get previews on the same Netlify project. The **Preview build** workflow (`.github/workflows/preview-build.yml`) runs on every pull request without secrets: it builds the site with `KETWORKS_PREVIEW=1`, which adds a banner and `noindex`, writes a summary of the changed instances, entries and pages (`nqsbot/preview_summary.py`) and uploads both as an artifact. The **Preview deploy** workflow (`.github/workflows/preview-deploy.yml`) starts when that build finishes. It does not check out or run code from the pull request; it checks that the pull request is still at the built commit, uploads the files with `netlify deploy --alias pr-<number>` to `https://pr-<number>--nqs-draft-k7x2m9.netlify.app`, and keeps one comment on the pull request up to date with the link and the summary. It uses the same two secrets as the deploy, including for pull requests from forks; GitHub asks a maintainer to approve workflow runs from first-time contributors. GitHub runs `workflow_run` workflows only from the default branch, so changes to the deploy workflow take effect after they are merged.

GitHub Pages is not used (`PUBLISH_PAGES` unset); Netlify serves the site.

## Repository rules

`main` should only change through pull requests that pass the `validate` check. Protect it under Settings, Branches (or Rules) with: require a pull request before merging; require the status check `validate`; block force pushes and deletion.

While there is a single maintainer, set the number of required approvals to 0 and leave administrators able to bypass. GitHub does not let anyone approve their own pull request, so a required approval with one maintainer blocks every merge. Once there are two or more curators, raise it to 1 and require code-owner review; `.github/ruleset.example.json` holds that stricter ruleset, and the reviewers are listed in `.github/CODEOWNERS`.

## The arXiv bot

The bot that proposes results from new arXiv papers lives in its own repository, [ketworks-org/ketworks-bot](https://github.com/ketworks-org/ketworks-bot), with its model key and its token. It validates with `nqsbot/schema.py` from this repository and opens one pull request per paper version here; keep the functions it imports (`benchmarks`, `eligible`, `fingerprint`, `paper_parts`, `row_key`, `validate_row`, `validate_record`, `EXTRACTION`) stable, or update the bot in the same step. Its tests run against the current `main` of this repository.
