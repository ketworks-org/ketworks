"""Run discovery and extraction, then write local proposals or open review-only PRs."""
import argparse
from datetime import datetime, timezone
import json
import os
import requests
from pathlib import Path

from .arxiv import Arxiv
from .extract import extract
from .github import GitHub
from .schema import ROOT, benchmarks, eligible, fingerprint, paper_parts, validate_row, row_key


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    temporary.replace(path)


def prepare(paper, source, extraction, registry, model):
    accepted, unresolved, issues, seen = [], [], list(extraction["issues"]), set()
    for row in extraction["results"]:
        if not eligible(row):
            continue
        try:
            validate_row(row, registry, source["text"], allow_unmatched=True)
            key = row_key(row)
            if key in seen:
                raise ValueError("Duplicate method/variant; reviewer must resolve")
            seen.add(key)
            (accepted if row["benchmark_id"] is not None else unresolved).append(row)
        except ValueError as error:
            issues.append(f"{row['method']} / {row['variant']}: {error}")
    base, _ = paper_parts(paper["id"])
    records = {}
    for folder, rows in (("results", accepted), ("proposals", unresolved)):
        if rows:
            records[f"data/{folder}/{base}.json"] = {
                "schema_version": 1, "paper": paper, "source_url": source["url"],
                "source_sha256": source["sha256"], "extraction_model": model,
                "results": rows, "issues": issues,
            }
    return records, issues, bool(unresolved)


def pr_body(paper, records, issues, registry):
    def escape(value):
        return str(value).replace("|", "\\|").replace("\n", " ").replace("@", "＠")
    lines = [f"Proposed original NQS variational energies from [arXiv:{paper['id']}](https://arxiv.org/abs/{paper['id']}).",
             "", "These are automated extractions awaiting scientific review. Merging publishes only rows in `data/results/`; `data/proposals/` is never published.", "",
             "| Instance | Method / variant | Class | Reported energy | Uncertainty | Source location |",
             "| --- | --- | --- | --- | --- | --- |"]
    for record in records.values():
        for row in record["results"]:
            name = registry.get(row["benchmark_id"], {}).get("name", "Unmatched — needs benchmark definition")
            values = [name, row["method"] + " / " + row["variant"], row["method_class"], f"{row['energy']} {row['unit']} ({row['normalization']})", f"{row['uncertainty'] or 'not reported'}; {row['uncertainty_type']}", row["source_location"]]
            lines.append("| " + " | ".join(escape(x) for x in values) + " |")
    lines += ["", "Reviewer checks:", "", "- [ ] The state is an NQS and each energy is directly variational, without extrapolation or projection.",
              "- [ ] Each number is a result of this paper, not a cited comparison.",
              "- [ ] Hamiltonian, operator convention, cluster, boundaries, and sector match exactly.",
              "- [ ] Energy digits, units, normalization, uncertainty, and source locations are correct.",
              "- [ ] Any unmatched systems or extraction issues have been resolved; stale revisions have been considered.",
              "", "The bot cannot approve or merge this PR. Review confirms transcription and eligibility; it is not independent reproduction."]
    if issues:
        lines += ["", "Extraction issues:", ""] + ["- " + escape(x) for x in issues]
    return "\n".join(lines)


def run(args):
    config = json.loads((ROOT / "config/discovery.json").read_text())
    registry = benchmarks()
    state_path = Path(args.state_dir) / "state.json"
    state = json.loads(state_path.read_text()) if state_path.exists() else {"processed": {}, "last_complete_scan": None}
    now = datetime.now(timezone.utc)
    if state.get("last_complete_scan"):
        elapsed = now - datetime.fromisoformat(state["last_complete_scan"])
        config["lookback_days"] = max(config["lookback_days"], elapsed.days + 3)
    if args.lookback_days:
        config["lookback_days"] = max(config["lookback_days"], args.lookback_days)
    if args.max_papers:
        config["max_papers_per_run"] = args.max_papers
    if not os.getenv("OPENAI_API_KEY") or not os.getenv("OPENAI_MODEL"):
        raise ValueError("Set OPENAI_API_KEY and OPENAI_MODEL; no live extraction has run")
    github = None
    if args.publish_prs:
        github = GitHub(os.getenv("GITHUB_REPOSITORY"), os.getenv("GH_TOKEN"))
        github.require_review_gate()
    arxiv = Arxiv(os.getenv("ARXIV_CONTACT"))
    papers = arxiv.discover(config)
    # Process older discoveries first so daily caps cannot starve a backlog.
    papers.sort(key=lambda p: p["updated"])
    signature = fingerprint({"registry": registry, "prompt": (ROOT / "prompts/extract.txt").read_text(), "model": os.environ["OPENAI_MODEL"]})
    count, failed, capped, urls = 0, [], False, []
    for paper in papers:
        cache_key = paper["id"] + ":" + signature + (":pr" if github else ":local")
        if cache_key in state["processed"]:
            continue
        base, version = paper_parts(paper["id"])
        published = ROOT / "data/results" / f"{base}.json"
        if published.exists() and paper_parts(json.loads(published.read_text())["paper"]["id"])[1] >= version:
            state["processed"][cache_key] = "already merged"
            continue
        if github and github.existing_pr(paper["id"]):
            # Open, merged, and deliberately rejected PRs are all respected.
            state["processed"][cache_key] = "existing PR"
            continue
        if count >= config["max_papers_per_run"]:
            capped = True
            break
        count += 1
        try:
            source = arxiv.source(paper["id"])
            extracted = extract(paper, source, registry)
            records, issues, draft = prepare(paper, source, extracted, registry, os.environ["OPENAI_MODEL"])
            output = Path(args.output_dir) / paper["id"]
            write_json(output / "extraction.json", extracted)
            if records:
                body = pr_body(paper, records, issues, registry)
                for path, record in records.items():
                    write_json(output / path, record)
                (output / "pull-request.md").write_text(body)
                if github:
                    pr = github.propose(paper, records, body, registry, draft=draft or bool(issues))
                    if pr:
                        urls.append(pr["html_url"])
                        print(pr["html_url"])
            elif issues:
                # Do not cache an extraction failure as a successful no-result paper.
                raise ValueError("Extraction needs manual attention; see local run artifacts")
            state["processed"][cache_key] = "proposed" if records else "no eligible numerical results"
            write_json(state_path, state)
        except (ValueError, RuntimeError, requests.RequestException) as error:
            # Only class and paper ID in public logs; extraction and provider payloads stay private.
            failed.append(paper["id"])
            print(f"Needs retry: arXiv:{paper['id']} ({type(error).__name__})")
    if not failed and not capped:
        state["last_complete_scan"] = now.isoformat()
    write_json(state_path, state)
    summary = {"papers_discovered": len(papers), "papers_processed": count, "backlog_remaining": capped, "failed_papers": failed, "pull_requests": urls, "last_complete_scan": state["last_complete_scan"]}
    write_json(Path(args.output_dir) / "summary.json", summary)
    print(json.dumps(summary, indent=2))
    if failed:
        raise RuntimeError("Some papers failed; see run artifacts. They will be retried.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--publish-prs", action="store_true", help="Open PRs; never merge or push the default branch")
    parser.add_argument("--state-dir", default=".cache/nqs")
    parser.add_argument("--output-dir", default=".run")
    parser.add_argument("--lookback-days", type=int)
    parser.add_argument("--max-papers", type=int)
    args = parser.parse_args()
    run(args)


if __name__ == "__main__":
    import requests
    main()
