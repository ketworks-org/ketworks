"""Synthetic records test mechanics only; none are real scientific results."""
import copy
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

from nqsbot import schema
from nqsbot.build import build
from nqsbot.collect import prepare, pr_body
from nqsbot.extract import extract
from nqsbot.github import GitHub
from nqsbot.arxiv import Arxiv

REGISTRY = schema.benchmarks()
BENCHMARK = next(iter(REGISTRY))
PAPER = {"id": "2601.00001v1", "title": "Synthetic fixture, not a scientific result", "authors": "Test Author", "published": "2026-01-01T00:00:00Z", "updated": "2026-01-01T00:00:00Z"}
ROW = {
    "benchmark_id": BENCHMARK, "system_description": "Synthetic unit-test match", "method": "Test NQS", "variant": "fixture", "method_class": "rbm", "method_type": "nqs", "energy_type": "variational", "reported_here": True,
    "energy": "-50.000", "energy_token": "-50.000(20)", "normalization": "total", "unit": "J1", "uncertainty": "0.020", "uncertainty_type": "standard_error", "source_location": "Synthetic Table 1", "eligibility_evidence": "Synthetic direct NQS expectation-value fixture", "parameter_count": None, "notes": "Not a real result"
}
SOURCE = {"url": "https://arxiv.org/html/2601.00001v1", "sha256": "0" * 64, "text": "Synthetic table: -50.000(20)"}


def record(row=None):
    return {"schema_version": 1, "paper": copy.deepcopy(PAPER), "source_url": SOURCE["url"], "source_sha256": SOURCE["sha256"], "extraction_model": "test-model", "results": [copy.deepcopy(row or ROW)], "issues": []}


class EligibilityTests(unittest.TestCase):
    def test_total_normalization_preserves_uncertainty(self):
        schema.validate_row(ROW, REGISTRY, SOURCE["text"])
        self.assertEqual(schema.per_site(ROW, REGISTRY), ("-0.500", "0.0002"))

    def test_only_original_variational_nqs(self):
        for field, values in {"method_type": ["non_nqs", "unknown"], "energy_type": ["extrapolated", "projected", "reference", "unknown"], "reported_here": [False]}.items():
            for value in values:
                with self.subTest(field=field, value=value):
                    row = dict(ROW, **{field: value})
                    with self.assertRaises(ValueError): schema.validate_row(row, REGISTRY)

    def test_uncertainty_is_not_fabricated(self):
        row = dict(ROW, uncertainty=None, uncertainty_type="not_reported", energy_token="-50.000")
        schema.validate_row(row, REGISTRY)
        self.assertIsNone(schema.per_site(row, REGISTRY)[1])
        for bad in (dict(row, uncertainty_type="standard_error"), dict(ROW, uncertainty="-0.2")):
            with self.assertRaises(ValueError): schema.validate_row(bad, REGISTRY)

    def test_source_token_required_and_decimal_must_agree(self):
        with self.assertRaises(ValueError): schema.validate_row(ROW, REGISTRY, "no energy here")
        with self.assertRaises(ValueError): schema.validate_row(dict(ROW, energy="-60"), REGISTRY, SOURCE["text"])
        with self.assertRaises(ValueError): schema.validate_row(dict(ROW, uncertainty="0.2"), REGISTRY, SOURCE["text"])

    def test_finite_decimal_and_units(self):
        for bad in (dict(ROW, energy="NaN"), dict(ROW, energy="-Infinity"), dict(ROW, unit="sigma"), dict(ROW, normalization="unknown")):
            with self.assertRaises(ValueError): schema.validate_row(bad, REGISTRY)

    def test_method_class_is_a_known_label(self):
        for label in schema.METHOD_CLASSES:
            schema.validate_row(dict(ROW, method_class=label), REGISTRY)
        with self.assertRaises(Exception): schema.validate_row(dict(ROW, method_class="RBM"), REGISTRY)
        with self.assertRaises(Exception): schema.validate_row({k: v for k, v in ROW.items() if k != "method_class"}, REGISTRY)

    def test_unmatched_is_proposal_only(self):
        row = dict(ROW, benchmark_id=None)
        schema.validate_row(row, REGISTRY, allow_unmatched=True)
        with self.assertRaises(ValueError): schema.validate_row(row, REGISTRY)
        with self.assertRaises(ValueError): schema.validate_row(dict(ROW, benchmark_id="invented"), REGISTRY, allow_unmatched=True)

    def test_human_submissions_can_omit_checksum_but_bot_cannot(self):
        human = dict(record(), extraction_model="human", source_sha256=None)
        schema.validate_record(human, REGISTRY)
        with self.assertRaises(ValueError):
            schema.validate_record(dict(record(), source_sha256=None), REGISTRY)

    def test_versioned_source_and_duplicate_validation(self):
        schema.validate_record(record(), REGISTRY)
        for bad in (dict(record(), source_url="https://arxiv.org/html/2601.00001v2"), dict(record(), results=[ROW, ROW])):
            with self.assertRaises(ValueError): schema.validate_record(bad, REGISTRY)

    def test_prepare_filters_comparison_and_extrapolation(self):
        records, issues, draft = prepare(PAPER, SOURCE, {"results": [ROW, dict(ROW, method_type="non_nqs"), dict(ROW, energy_type="extrapolated"), dict(ROW, reported_here=False)], "issues": []}, REGISTRY, "test-model")
        self.assertEqual(len(records), 1)
        self.assertEqual(len(next(iter(records.values()))["results"]), 1)
        self.assertFalse(draft)
        self.assertEqual(issues, [])

    def test_unmatched_enters_draft_proposal(self):
        records, _, draft = prepare(PAPER, SOURCE, {"results": [dict(ROW, benchmark_id=None)], "issues": []}, REGISTRY, "test-model")
        self.assertTrue(draft)
        self.assertIn("data/proposals/2601.00001.json", records)
        self.assertNotIn("data/results/2601.00001.json", records)
        body = pr_body(PAPER, records, [], REGISTRY)
        self.assertIn("arXiv:2601.00001v1", body)
        self.assertIn("Synthetic Table 1", body)
        self.assertIn("| rbm |", body)
        self.assertIn("cannot approve or merge", body)

    def test_build_never_leaks_proposals(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for folder in ("site", "data/results", "data/proposals"):
                (root / folder).mkdir(parents=True)
            (root / "site/index.html").write_text("<html></html>")
            (root / "data/benchmarks.json").write_text(json.dumps(list(REGISTRY.values())))
            (root / "data/proposals/2601.00001.json").write_text(json.dumps(record(dict(ROW, benchmark_id=None))))
            payload = build(root)
            self.assertEqual(payload["results"], [])
            self.assertNotIn("Test Author", (root / "dist/data.json").read_text())
            (root / "data/results/2601.00001.json").write_text(json.dumps(record()))
            payload = build(root)
            self.assertEqual(payload["results"][0]["energy_per_site"], "-0.500")
            self.assertEqual(payload["paper_count"], 1)


class GitHubTests(unittest.TestCase):
    def fake(self):
        github = object.__new__(GitHub)
        github.repository = "test/nqs"
        github.base = "main"
        return github

    def test_review_gate_is_required(self):
        github = self.fake()
        github.call = Mock(side_effect=[[], None])
        with self.assertRaises(RuntimeError): github.require_review_gate()
        github.call = Mock(return_value=[{"type": "pull_request", "parameters": {"required_approving_review_count": 1, "dismiss_stale_reviews_on_push": True}}])
        github.require_review_gate()

    def test_existing_closed_or_open_pr_is_not_recreated(self):
        for state in ("open", "closed"):
            github = self.fake()
            github.existing_pr = Mock(return_value={"state": state})
            github.call = Mock()
            self.assertIsNone(github.propose(PAPER, {}, "body", REGISTRY))
            github.call.assert_not_called()

    def test_pr_writer_only_writes_paper_files(self):
        github = self.fake()
        github.existing_pr = Mock(return_value=None)
        with self.assertRaises(ValueError): github.propose(PAPER, {".github/workflows/injected.yml": record()}, "body", REGISTRY)

    def test_pr_never_pushes_main_or_merges(self):
        github = self.fake()
        github.existing_pr = Mock(return_value=None)
        def call(method, path, **kwargs):
            if path == '/git/ref/heads/main': return {"object": {"sha": "base"}}
            if path == '/git/commits/base': return {"tree": {"sha": "tree"}}
            if path.startswith('/contents/'): return None
            if path == '/git/trees': return {"sha": "new-tree"}
            if path == '/git/commits': return {"sha": "new-commit"}
            if path.startswith('/git/ref/heads/codex/'): return None
            if path == '/git/refs':
                self.assertEqual(kwargs['json']['ref'], 'refs/heads/codex/arxiv-2601-00001v1'); return {}
            if path == '/pulls': return {"html_url": "https://github.com/test/nqs/pull/1"}
            self.fail(f"Unexpected API operation: {method} {path}")
        github.call = Mock(side_effect=call)
        pr = github.propose(PAPER, {'data/results/2601.00001.json': record()}, "body", REGISTRY)
        self.assertTrue(pr['html_url'].endswith('/1'))
        self.assertFalse(any('/merge' in c.args[1] or '/reviews' in c.args[1] or c.args[0] == 'PATCH' for c in github.call.call_args_list))


class ExtractionTests(unittest.TestCase):
    @patch.dict(os.environ, {"OPENAI_API_KEY": "synthetic-test-key", "OPENAI_MODEL": "test-model"})
    def test_structured_response_and_no_tools(self):
        session = Mock()
        session.post.return_value.ok = True
        session.post.return_value.json.return_value = {"status": "completed", "output": [{"content": [{"type": "output_text", "text": json.dumps({"results": [ROW], "issues": []})}]}]}
        result = extract(PAPER, SOURCE, REGISTRY, session)
        self.assertEqual(result['results'][0]['energy'], '-50.000')
        sent = session.post.call_args.kwargs['json']
        self.assertNotIn('tools', sent)
        self.assertFalse(sent['store'])
        self.assertTrue(sent['text']['format']['strict'])
        self.assertNotIn('synthetic-test-key', sent['input'])

    @patch.dict(os.environ, {"OPENAI_API_KEY": "synthetic-test-key", "OPENAI_MODEL": "test-model"})
    def test_incomplete_and_refused_outputs_do_not_produce_rows(self):
        for payload in ({"status": "incomplete"}, {"status": "completed", "output": [{"content": [{"type": "refusal", "refusal": "No"}]}]}):
            session = Mock()
            session.post.return_value.ok = True
            session.post.return_value.json.return_value = payload
            with self.assertRaises(ValueError): extract(PAPER, SOURCE, REGISTRY, session)

    def test_discovery_deduplicates_and_obeys_cutoff(self):
        arxiv = Arxiv('test@example.invalid')
        template = '<entry><id>https://arxiv.org/abs/{id}</id><title>Test</title><published>{date}</published><updated>{date}</updated><author><name>Author</name></author></entry>'
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).isoformat()
        xml = '<feed xmlns="http://www.w3.org/2005/Atom">' + template.format(id='2601.00001v2', date=today) * 2 + template.format(id='2001.00001v1', date='2020-01-01T00:00:00Z') + '</feed>'
        arxiv.get = Mock(return_value=xml.encode())
        result = arxiv.discover({'query': 'test', 'lookback_days': 14, 'page_size': 100, 'max_pages': 2})
        self.assertEqual([p['id'] for p in result], ['2601.00001v2'])


if __name__ == '__main__':
    unittest.main()
