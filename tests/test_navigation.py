"""Reading groups retain stable links and reveal the current article."""
from html.parser import HTMLParser
import unittest

from nqsbot.build import nav_html


class Navigation(HTMLParser):
    def __init__(self, markup):
        super().__init__()
        self.groups = []
        self.links = []
        self.feed(markup)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "details":
            self.groups.append(attrs)
        elif tag == "a":
            self.links.append((attrs, list(self.groups)))

    def handle_endtag(self, tag):
        if tag == "details":
            self.groups.pop()


class NavigationTests(unittest.TestCase):
    def test_reading_groups_open_only_the_current_path(self):
        pages = [
            {"slug": "guide", "title": "Guide", "section": "Architectures"},
            {"slug": "lattice", "title": "Lattice", "section": "Architectures", "subsection": "Lattice systems"},
            {"slug": "continuum", "title": "Continuous", "section": "Architectures", "subsection": "Continuous space"},
            {"slug": "benchmark", "title": "Benchmark", "section": "Benchmarks"},
        ]
        parsed = Navigation(nav_html(pages, {}, "../../", current="continuum"))
        articles = [(a, groups) for a, groups in parsed.links if a["href"].startswith("../../wiki/")]
        self.assertEqual([a["href"] for a, _ in articles],
                         ["../../wiki/guide/", "../../wiki/lattice/", "../../wiki/continuum/", "../../wiki/benchmark/"])
        paths = {a["href"]: groups for a, groups in articles}
        self.assertEqual([g["class"] for g in paths["../../wiki/guide/"]], ["nav-sub"])
        self.assertEqual([g["class"] for g in paths["../../wiki/continuum/"]], ["nav-sub", "nav-topic"])
        self.assertEqual([("open" in g) for g in paths["../../wiki/continuum/"]], [True, True])
        self.assertEqual([("open" in g) for g in paths["../../wiki/lattice/"]], [True, False])
        self.assertEqual([("open" in g) for g in paths["../../wiki/benchmark/"]], [False])
        self.assertEqual([a["href"] for a, _ in parsed.links if a.get("aria-current") == "page"],
                         ["../../wiki/continuum/"])

        home = Navigation(nav_html(pages, {}))
        self.assertFalse(any("open" in group for _, groups in home.links for group in groups))


if __name__ == "__main__":
    unittest.main()
