"""GitHub writer restricted to proposal branches and pull requests."""
import base64
import json
import re
import requests

from .schema import paper_parts, validate_record


class GitHub:
    def __init__(self, repository, token, session=None):
        if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repository or "") or not token:
            raise ValueError("Configure GITHUB_REPOSITORY and GH_TOKEN")
        self.repository = repository
        self.session = session or requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"})
        self.base = self.call("GET", "")["default_branch"]

    def call(self, method, path, *, missing=False, **kwargs):
        response = self.session.request(method, f"https://api.github.com/repos/{self.repository}{path}", timeout=(20, 60), **kwargs)
        if missing and response.status_code == 404:
            return None
        if not response.ok:
            raise RuntimeError(f"GitHub {method} {path}: HTTP {response.status_code}")
        return response.json() if response.content else None

    def require_review_gate(self):
        """Do not start proposing until at least one review and stale-review dismissal are required."""
        rules = self.call("GET", f"/rules/branches/{self.base}")
        for rule in rules:
            p = rule.get("parameters", {})
            if rule.get("type") == "pull_request" and p.get("required_approving_review_count", 0) >= 1 and p.get("dismiss_stale_reviews_on_push"):
                return
        protection = self.call("GET", f"/branches/{self.base}/protection", missing=True)
        p = (protection or {}).get("required_pull_request_reviews") or {}
        if p.get("required_approving_review_count", 0) < 1 or not p.get("dismiss_stale_reviews"):
            raise RuntimeError("Default branch must require human PR approval and dismiss stale approvals before the bot can run")

    def branch(self, identifier):
        paper_parts(identifier)
        return f"codex/arxiv-{identifier.replace('.', '-')}"

    def existing_pr(self, identifier):
        head = f"{self.repository.split('/')[0]}:{self.branch(identifier)}"
        prs = self.call("GET", "/pulls", params={"state": "all", "head": head, "base": self.base, "per_page": 100})
        return prs[0] if prs else None

    def propose(self, paper, records, body, registry, *, draft=False):
        if self.existing_pr(paper["id"]):
            return None
        base_id, _ = paper_parts(paper["id"])
        for path, record in records.items():
            if path not in (f"data/results/{base_id}.json", f"data/proposals/{base_id}.json"):
                raise ValueError("The bot may only change this paper's data files")
            validate_record(record, registry, allow_unmatched="/proposals/" in path)
        branch = self.branch(paper["id"])
        head = self.call("GET", f"/git/ref/heads/{self.base}")["object"]["sha"]
        base_commit = self.call("GET", f"/git/commits/{head}")
        # Refuse revision downgrades even if the runner's checkout was stale.
        for path in records:
            current = self.call("GET", f"/contents/{path}", params={"ref": self.base}, missing=True)
            if current:
                previous = json.loads(base64.b64decode(current["content"]))
                if paper_parts(previous["paper"]["id"])[1] >= paper_parts(paper["id"])[1]:
                    return None
        tree = [{"path": path, "mode": "100644", "type": "blob", "content": json.dumps(record, indent=2, ensure_ascii=False) + "\n"} for path, record in records.items()]
        new_tree = self.call("POST", "/git/trees", json={"base_tree": base_commit["tree"]["sha"], "tree": tree})
        commit = self.call("POST", "/git/commits", json={"message": f"Propose NQS energies from arXiv:{paper['id']}", "tree": new_tree["sha"], "parents": [head]})
        existing = self.call("GET", f"/git/ref/heads/{branch}", missing=True)
        if existing:
            # Crash recovery may find an orphan branch; never overwrite it.
            if self.call("GET", f"/git/commits/{existing['object']['sha']}")["tree"]["sha"] != new_tree["sha"]:
                raise RuntimeError(f"Orphan branch {branch} differs; inspect it before retrying")
        else:
            self.call("POST", "/git/refs", json={"ref": f"refs/heads/{branch}", "sha": commit["sha"]})
        return self.call("POST", "/pulls", json={"title": f"NQS energies: arXiv:{paper['id']} — {paper['title'][:150]}", "head": branch, "base": self.base, "body": body, "draft": draft})
