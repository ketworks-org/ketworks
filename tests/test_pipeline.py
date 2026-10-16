"""Synthetic records test mechanics only; none are real scientific results."""
import copy
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

from nqsbot import schema
from nqsbot.build import build, mark_preview
from nqsbot.fill_metadata import fill
from nqsbot.preview_summary import describe

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
        self.assertEqual(schema.per_site(ROW, REGISTRY), ("-0.50000", "0.00020"))

    def test_only_original_variational_nqs(self):
        for field, values in {"method_type": ["non_nqs", "unknown"], "energy_type": ["extrapolated", "projected", "reference", "unknown"], "reported_here": [False]}.items():
            for value in values:
                with self.subTest(field=field, value=value):
                    row = dict(ROW, **{field: value})
                    with self.assertRaises(ValueError): schema.validate_row(row, REGISTRY)

    def test_every_entry_needs_an_error_bar(self):
        missing = dict(ROW, uncertainty=None, uncertainty_type="not_reported", energy_token="-50.000")
        for bad in (missing, dict(missing, uncertainty_type="standard_error"), dict(ROW, uncertainty="-0.2"), dict(ROW, energy_token="-50.000", uncertainty="0")):
            with self.assertRaises(ValueError): schema.validate_row(bad, REGISTRY)
        # An error bar printed separately (as ±) or a bound stated in the text is accepted.
        schema.validate_row(dict(ROW, energy_token="-50.000", uncertainty="0.020"), REGISTRY)
        bound = dict(ROW, energy_token="-50.000", uncertainty="0.001", uncertainty_type="upper_bound")
        schema.validate_row(bound, REGISTRY)
        self.assertEqual(schema.per_site(bound, REGISTRY)[1], "0.00001")

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

    def test_total_energies_keep_the_printed_precision_per_site(self):
        # 144 sites, as the 12 x 12 TFIM instances: no repeating decimals, error bar to two digits.
        registry = dict(REGISTRY, big={"sites": 144, "unit": "J1"})
        row = dict(ROW, benchmark_id="big", energy="-456.4977", uncertainty="0.0088")
        self.assertEqual(schema.per_site(row, registry), ("-3.170123", "0.000061"))
        self.assertEqual(schema.per_site(dict(row, energy="-456.4209", uncertainty="0.0636"), registry), ("-3.16959", "0.00044"))
        self.assertEqual(schema.per_site(dict(ROW, normalization="per_site", energy="-0.4976921", uncertainty="0.0000004"), REGISTRY), ("-0.4976921", "0.0000004"))

    def test_variance_is_optional_and_non_negative(self):
        schema.validate_row(dict(ROW, variance="1.25"), REGISTRY, SOURCE["text"])
        schema.validate_row(dict(ROW, variance=None), REGISTRY, SOURCE["text"])
        with self.assertRaises(ValueError): schema.validate_row(dict(ROW, variance="-0.1"), REGISTRY, SOURCE["text"])
        sites = REGISTRY[BENCHMARK]["sites"]
        self.assertEqual(schema.variance_per_site(dict(ROW, variance=str(2 * sites)), REGISTRY), "2.00")
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
            self.assertEqual(payload["results"][0]["energy_per_site"], "-0.50000")
            self.assertEqual(payload["paper_count"], 1)
            self.assertEqual(payload["papers"]["2601.00001"]["paper"]["id"], "2601.00001v1")
            self.assertNotIn("results", payload["papers"]["2601.00001"])
            self.assertIn("<loc>https://ketworks.org/</loc>", (root / "dist/sitemap.xml").read_text())
            self.assertIn("<loc>https://ketworks.org/about/</loc>", (root / "dist/sitemap.xml").read_text())

    def test_preview_summary_links_changed_instances_entries_and_pages(self):
        registry = json.dumps(list(REGISTRY.values()))
        path = "data/results/2601.00001.json"
        before = {"data/benchmarks.json": registry, path: json.dumps(record())}
        changed = dict(ROW, energy="-50.010", energy_token="-50.010(20)")
        after = {"data/benchmarks.json": registry, path: json.dumps(dict(record(), results=[changed, dict(ROW, variant="new")])), "wiki/new-page.md": "# New"}
        text = describe([path, "wiki/new-page.md"], before, after)
        self.assertIn("{PREVIEW}/#benchmarks?system=" + BENCHMARK, text)
        self.assertIn("1 added, 1 changed (arXiv:2601.00001v1)", text)
        self.assertIn("[new-page]({PREVIEW}/wiki/new-page/)", text)
        self.assertIn("No pages, instances or entries change", describe(["README.md"], {}, {}))
        changed = json.dumps([dict(b, category="lattice-bosons") for b in REGISTRY.values()])
        self.assertIn(f"- `category` changed on {len(REGISTRY)} instances", describe(["data/benchmarks.json"], {"data/benchmarks.json": registry}, {"data/benchmarks.json": changed}))
        self.assertIn("[about]({PREVIEW}/about/)", describe(["pages/about.md", "brand/logo.png"], {}, {"pages/about.md": "# About"}))

    def test_every_instance_has_a_known_category(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); (root / "data").mkdir()
            rows = [dict(b) for b in REGISTRY.values()]
            (root / "data/benchmarks.json").write_text(json.dumps(rows))
            self.assertEqual(set(schema.benchmarks(root)), set(REGISTRY))
            rows[0]["category"] = "spins"
            (root / "data/benchmarks.json").write_text(json.dumps(rows))
            with self.assertRaises(AssertionError): schema.benchmarks(root)

    def test_preview_build_is_not_indexed_and_carries_a_banner(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "index.html").write_text('<html><head><meta name="viewport" content="x"></head><body></body></html>')
            (root / "_headers").write_text("/*\n  X-Content-Type-Options: nosniff\n")
            mark_preview(root)
            page = (root / "index.html").read_text()
            self.assertIn('<meta name="robots" content="noindex">', page)
            self.assertIn('class="preview-banner"', page)
            self.assertIn("Disallow: /", (root / "robots.txt").read_text())
            self.assertIn("X-Robots-Tag: noindex", (root / "_headers").read_text())

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
