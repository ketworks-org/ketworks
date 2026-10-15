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
from nqsbot.fill_metadata import fill

REGISTRY = schema.benchmarks()
BENCHMARK = next(iter(REGISTRY))
PAPER = {"id": "2601.00001v1", "title": "Synthetic fixture, not a scientific result", "authors": "Test Author", "published": "2026-01-01T00:00:00Z", "updated": "2026-01-01T00:00:00Z"}
ROW = {
    "benchmark_id": BENCHMARK, "system_description": "Synthetic unit-test match", "method": "Test NQS", "variant": "fixture", "method_class": "rbm", "method_type": "nqs", "energy_type": "variational", "reported_here": True,
    "energy": "-50.000", "energy_token": "-50.000(20)", "normalization": "total", "unit": "J1", "uncertainty": "0.020", "uncertainty_type": "standard_error", "variance": None, "source_location": "Synthetic Table 1", "eligibility_evidence": "Synthetic direct NQS expectation-value fixture", "parameter_count": None, "notes": "Not a real result"
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

    def test_variance_is_optional_and_non_negative(self):
        schema.validate_row(dict(ROW, variance="1.25"), REGISTRY, SOURCE["text"])
        schema.validate_row(dict(ROW, variance=None), REGISTRY, SOURCE["text"])
        with self.assertRaises(ValueError): schema.validate_row(dict(ROW, variance="-0.1"), REGISTRY, SOURCE["text"])
        sites = REGISTRY[BENCHMARK]["sites"]
        self.assertEqual(schema.variance_per_site(dict(ROW, variance=str(2 * sites)), REGISTRY), "2")
        self.assertIsNone(schema.variance_per_site(ROW, REGISTRY))

    def test_new_entries_need_an_error_bar(self):
        import subprocess
        from nqsbot.check_revisions import check
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "data/results").mkdir(parents=True); (root / "data/proposals").mkdir(parents=True)
            git = lambda *a: subprocess.run(["git", *a], cwd=root, check=True, capture_output=True, text=True).stdout.strip()
            git("init", "-q"); git("config", "user.email", "t@example.invalid"); git("config", "user.name", "t")
            bare = dict(ROW, energy_token="-50.000", uncertainty=None, uncertainty_type="not_reported")
            path = root / "data/results/2601.00001.json"
            path.write_text(json.dumps(record(bare)))
            git("add", "-A"); git("commit", "-qm", "base"); base = git("rev-parse", "HEAD")
            check(base, root)  # an entry already on main is left alone
            path.write_text(json.dumps(dict(record(bare), results=[bare, dict(bare, variant="new")])))
            with self.assertRaises(ValueError): check(base, root)
            path.write_text(json.dumps(dict(record(bare), results=[bare, dict(ROW, variant="new")])))
            check(base, root)

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
            self.assertEqual(payload["papers"]["2601.00001"]["paper"]["id"], "2601.00001v1")
            self.assertNotIn("results", payload["papers"]["2601.00001"])
            self.assertIn("<loc>https://ketworks.org/</loc>", (root / "dist/sitemap.xml").read_text())

    def test_metadata_is_filled_only_where_empty(self):
        feed = ('<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>http://arxiv.org/abs/2601.00001v1</id><title>Filled  title</title>'
                '<published>2026-01-02T00:00:00Z</published><updated>2026-01-03T00:00:00Z</updated><author><name>A. Author</name></author><author><name>B. Author</name></author></entry></feed>')
        session = Mock(); session.get.return_value.content = feed.encode(); session.get.return_value.raise_for_status = Mock()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); (root / "data/results").mkdir(parents=True); (root / "data/proposals").mkdir(parents=True)
            incomplete = record(); incomplete["paper"].update(title="", authors="", published="", updated="")
            (root / "data/results/2601.00001.json").write_text(json.dumps(incomplete))
            complete = record(); complete["paper"]["id"] = "2601.00002v1"
            (root / "data/results/2601.00002.json").write_text(json.dumps(complete))
            changed = fill(root, session, pause=0)
            self.assertEqual([p.name for p in changed], ["2601.00001.json"])
            filled = json.loads((root / "data/results/2601.00001.json").read_text())["paper"]
            self.assertEqual(filled["title"], "Filled title"); self.assertEqual(filled["authors"], "A. Author, B. Author"); self.assertEqual(filled["published"], "2026-01-02T00:00:00Z")
            session.get.assert_called_once()


if __name__ == '__main__':
    unittest.main()
