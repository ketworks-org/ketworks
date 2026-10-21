"""Energy tables for Ketbook pages, generated at build time from the Ketboard entries and from the energies of
other methods in data/references, so that a page is never behind the board.

A page asks for a table with a fenced block:

    ```ketboard
    summary
    instances: heg3d-sc-n14-unpol-rs*
    row: r_s
    ```

entries     every Ketboard entry and every reference energy of the instances, highest first, with the lowest
            variational energy and the distance of the best neural state from the exact energy or the estimate.
summary     one row per instance: the lowest neural energy on Ketboard, the lowest upper bound from another
            method, which of the two is lower, and the distance to the exact energy or the best estimate.
references  the energies of other methods for the instances, as recorded in data/references.
difference  for two instances, the difference of the energies of the same state (same paper and variant),
            e.g. a reaction barrier; "scale" and "unit" convert it (627.509 kcal/mol per Hartree).

"instances" takes instance keys or shell patterns; "row" labels the rows by r_s, label, size or molecule.
"""
import fnmatch
import json
import math
import re
from decimal import Decimal

from .schema import per_site, plain, reference_row

BLOCK = re.compile(r"^```ketboard[ \t]*\n(.*?)^```[ \t]*$", re.M | re.S)
KIND = {"exact": "exact", "upper_bound": "upper bound", "estimate": "estimate"}


PARTICLES = {"von", "van", "de", "der", "den", "di", "da", "du", "le", "la", "del"}
UNITS = {"J1": "$J_1$", "J": "$J$", "t": "$t$"}


def short_authors(authors):
    names = [a.strip() for a in authors.split(",") if a.strip()]

    def last(name):
        words = name.split()
        start = len(words) - 1
        while start > 0 and words[start - 1].casefold() in PARTICLES:
            start -= 1
        return " ".join(words[start:])
    if len(names) == 1:
        return last(names[0])
    if len(names) == 2:
        return f"{last(names[0])} and {last(names[1])}"
    return f"{last(names[0])} et al."


def cell(text):
    return str(text).replace("|", "/").replace("\n", " ")


def brief(source):
    """A citation cut after its arXiv identifier, for summary tables: "Wilson et al., arXiv:2202.04622v3"."""
    match = re.search(r"arXiv:\S+?(?=[,;)]|$)", source)
    return source[:match.end()] if match else source


def number(value, error):
    """A value with its error in brackets on its last digits, as LaTeX: $-0.0798544(4)$."""
    if error is None:
        return f"${value}$"
    decimals = len(value.split(".")[1]) if "." in value else 0
    units = Decimal(error).scaleb(decimals)
    if units == units.to_integral() and units > 0:
        return f"${value}({int(units)})$"
    return f"${value}\\pm{error}$"


def significant(value, digits=2):
    if value == 0:
        return Decimal(0)
    return value.quantize(Decimal(1).scaleb(value.adjusted() - digits + 1))


def difference(diff, unit):
    """A signed energy difference in readable units: mHa or μHa for Hartree, powers of ten otherwise."""
    sign = "+" if diff > 0 else "−" if diff < 0 else ""
    size = abs(diff)
    if size == 0:
        return "0"
    if unit == "Ha":
        if size >= Decimal("1e-4"):
            return f"{sign}{plain(significant(size * 1000))} mHa"
        return f"{sign}{plain(significant(size * 1000000))} μHa"
    mantissa = significant(size)
    exponent = mantissa.adjusted()
    unit = UNITS.get(unit, unit)
    if -2 <= exponent <= 0:
        return f"{sign}{plain(mantissa)} {unit}"
    return f"${'+' if sign == '+' else '-' if sign else ''}{plain(mantissa.scaleb(-exponent))}\\times10^{{{exponent}}}$ {unit}"


def verdict(diff, sigma):
    if abs(diff) <= 2 * sigma:
        return "within error bars"
    return "neural lower" if diff < 0 else "other lower"


class Tables:
    def __init__(self, root, registry):
        self.registry = registry
        self.entries, self.references = {}, {}
        for path in sorted((root / "data/results").glob("*.json")):
            record = json.loads(path.read_text())
            source = f"{short_authors(record['paper']['authors'])}, arXiv:{record['paper']['id']}"
            for row in record["results"]:
                energy, error = per_site(row, registry)
                variant = row["variant"] if row["method"].casefold() in row["variant"].casefold() else f"{row['method']}, {row['variant']}"
                self.entries.setdefault(row["benchmark_id"], []).append(
                    {"energy": energy, "error": error, "method": variant, "source": source, "paper": record["paper"]["id"], "variant": row["variant"]})
        for path in sorted((root / "data/references").glob("*.json")):
            for reference in json.loads(path.read_text())["references"]:
                energy, error = per_site(reference_row(reference), registry)
                self.references.setdefault(reference["benchmark_id"], []).append(
                    {"energy": energy, "error": error, "method": reference["method"], "kind": reference["kind"], "source": reference["source"]})

    # Instances named by key or pattern; a pattern is expanded in order of density, then size.
    def instances(self, spec):
        chosen = []
        for item in spec.split():
            if any(ch in item for ch in "*?["):
                found = [b for key, b in self.registry.items() if fnmatch.fnmatch(key, item)]
                found.sort(key=lambda b: (float((b.get("system") or {}).get("space", {}).get("r_s", 0)), b["sites"], b["id"]))
                chosen += found
            elif item in self.registry:
                chosen.append(self.registry[item])
            else:
                raise ValueError(f"Ketboard table: unknown instance {item!r}")
        if not chosen:
            raise ValueError(f"Ketboard table: no instance matches {spec!r}")
        return chosen

    def label(self, benchmark, row):
        system = benchmark.get("system") or {}
        if row == "r_s":
            text = system.get("space", {}).get("r_s", benchmark["instance_label"])
        elif row == "size":
            text = benchmark["lattice_size"]
        elif row == "molecule":
            text = f"{benchmark.get('group', benchmark['name'])}, {system.get('external', {}).get('geometry', '')}".rstrip(", ")
        else:
            text = benchmark["instance_label"]
        return f"[{cell(text)}](../../#benchmarks?system={benchmark['id']})"

    @staticmethod
    def lowest(items):
        return min(items, key=lambda item: Decimal(item["energy"])) if items else None

    @staticmethod
    def sigma(*items):
        return Decimal(math.sqrt(sum(float(Decimal(item["error"])) ** 2 for item in items if item["error"]))) if items else Decimal(0)

    def summary(self, options):
        benchmarks = self.instances(options["instances"])
        row = options.get("row", "label")
        heading = {"r_s": "$r_s$", "size": "Cluster", "molecule": "Molecule"}.get(row, "Instance")
        rows, tally = [], {"neural lower": 0, "other lower": 0, "within error bars": 0, "no other method": 0}
        exact_column = any(r["kind"] != "upper_bound" for b in benchmarks for r in self.references.get(b["id"], []))
        for benchmark in benchmarks:
            unit = benchmark["unit"]
            neural = self.lowest(self.entries.get(benchmark["id"], []))
            references = self.references.get(benchmark["id"], [])
            other = self.lowest([r for r in references if r["kind"] == "upper_bound"])
            target = next((r for r in references if r["kind"] == "exact"), None) or next((r for r in references if r["kind"] == "estimate"), None)
            cells = [self.label(benchmark, row)]
            cells.append(f"{number(neural['energy'], neural['error'])} {cell(neural['method'])} ({cell(neural['source'])})" if neural else "—")
            cells.append(f"{number(other['energy'], other['error'])} {cell(other['method'])} ({cell(brief(other['source']))})" if other else "—")
            if neural and other:
                diff = Decimal(neural["energy"]) - Decimal(other["energy"])
                outcome = verdict(diff, self.sigma(neural, other))
                tally[outcome] += 1
                cells.append(f"{difference(diff, unit)}, {outcome}")
            else:
                if neural:
                    tally["no other method"] += 1
                cells.append("—")
            if exact_column:
                if target:
                    gap = f"; neural {difference(Decimal(neural['energy']) - Decimal(target['energy']), unit)}" if neural else ""
                    cells.append(f"{number(target['energy'], target['error'])} {cell(target['method'])}, {KIND[target['kind']]} ({cell(brief(target['source']))}){gap}")
                else:
                    cells.append("—")
            rows.append(cells)
        header = [heading, "Lowest neural energy", "Lowest upper bound from another method", "Neural − other"] + (["Exact or best estimate"] if exact_column else [])
        table = "\n".join(["| " + " | ".join(header) + " |", "|" + " --- |" * len(header)] + ["| " + " | ".join(r) + " |" for r in rows])
        compared = tally["neural lower"] + tally["other lower"] + tally["within error bars"]
        parts = []
        if compared:
            parts.append(f"Of the {compared} instance{'s' if compared != 1 else ''} with an upper bound from another method, a neural state is lower on {tally['neural lower']}, another method on {tally['other lower']}, and the two agree within error bars on {tally['within error bars']}")
        if tally["no other method"]:
            parts.append(f"{tally['no other method']} instance{'s have' if tally['no other method'] != 1 else ' has'} neural entries but no upper bound from another method here")
        note = ("; ".join(parts) + ". \"Within error bars\" means within twice the combined error bars.") if parts else ""
        return table + ("\n\n" + note if note else "")

    def entries_table(self, options):
        """Every Ketboard entry and every reference energy of the instances, highest energy first."""
        lines, notes = [], []
        for benchmark in self.instances(options["instances"]):
            items = [{**e, "kind": "neural"} for e in self.entries.get(benchmark["id"], [])] + self.references.get(benchmark["id"], [])
            if not items:
                continue
            if len(self.instances(options["instances"])) > 1:
                lines += [f"**{self.label(benchmark, options.get('row', 'label'))}**", ""]
            lines += ["| Method | Kind | Energy | Source |", "| --- | --- | --- | --- |"]
            for item in sorted(items, key=lambda item: -Decimal(item["energy"])):
                kind = "neural network" if item["kind"] == "neural" else KIND[item["kind"]]
                lines.append(f"| {cell(item['method'])} | {kind} | {number(item['energy'], item['error'])} | {cell(item['source'])} |")
            bounds = [i for i in items if i["kind"] in ("neural", "upper_bound")]
            best = self.lowest(bounds)
            target = next((r for r in items if r["kind"] == "exact"), None) or next((r for r in items if r["kind"] == "estimate"), None)
            sentence = f"The lowest variational energy is {'a neural state' if best['kind'] == 'neural' else 'from another method'}: {cell(best['method'])} ({cell(best['source'])})."
            neural = self.lowest([i for i in items if i["kind"] == "neural"])
            if target and neural:
                gap = Decimal(neural["energy"]) - Decimal(target["energy"])
                where = "above" if gap > 0 else "below" if gap < 0 else "at"
                what = "the exact energy" if target["kind"] == "exact" else "the estimate"
                sentence += f" The lowest neural energy lies {difference(abs(gap), benchmark['unit']).lstrip('+')} {where} {what} ({cell(target['method'])})." if gap else f" The lowest neural energy equals {what} ({cell(target['method'])})."
            lines += ["", sentence, ""]
        if not lines:
            raise ValueError(f"Ketboard table: no energies for {options['instances']!r}")
        return "\n".join(lines).rstrip()

    def reference_table(self, options):
        benchmarks = self.instances(options["instances"])
        row = options.get("row", "label")
        lines = ["| Instance | Method | Kind | Energy | Source |", "| --- | --- | --- | --- | --- |"]
        for benchmark in benchmarks:
            for r in sorted(self.references.get(benchmark["id"], []), key=lambda r: -Decimal(r["energy"])):
                lines.append(f"| {self.label(benchmark, row)} | {cell(r['method'])} | {KIND[r['kind']]} | {number(r['energy'], r['error'])} | {cell(r['source'])} |")
        if len(lines) == 2:
            raise ValueError(f"Ketboard table: no reference energies for {options['instances']!r}")
        return "\n".join(lines)

    def difference_table(self, options):
        first, second = self.instances(options["instances"])[:2]
        scale, unit = Decimal(options.get("scale", "1")), options.get("unit", first["unit"])
        by_state = {(e["paper"], e["variant"]): e for e in self.entries.get(second["id"], [])}
        lines = [f"| Method | {self.label(first, options.get('row', 'label'))} | {self.label(second, options.get('row', 'label'))} | Difference ({unit}) | Source |", "| --- | --- | --- | --- | --- |"]
        pairs = [(e, by_state[(e["paper"], e["variant"])]) for e in self.entries.get(first["id"], []) if (e["paper"], e["variant"]) in by_state]
        for a, b in sorted(pairs, key=lambda pair: Decimal(pair[0]["energy"]) - Decimal(pair[1]["energy"])):
            value = ((Decimal(a["energy"]) - Decimal(b["energy"])) * scale).quantize(Decimal("0.01"))
            lines.append(f"| {cell(a['method'])} | {number(a['energy'], a['error'])} | {number(b['energy'], b['error'])} | ${plain(value)}$ | {cell(a['source'])} |")
        if not pairs:
            raise ValueError(f"Ketboard table: no state has entries on both {first['id']} and {second['id']}")
        return "\n".join(lines)

    def render(self, block):
        lines = [line.strip() for line in block.strip().splitlines() if line.strip()]
        mode, options = lines[0], dict(line.split(":", 1) for line in lines[1:])
        options = {key.strip(): value.strip() for key, value in options.items()}
        if "instances" not in options:
            raise ValueError("Ketboard table: give the instances")
        render = {"summary": self.summary, "entries": self.entries_table, "references": self.reference_table, "difference": self.difference_table}.get(mode)
        if render is None:
            raise ValueError(f"Ketboard table: unknown table {mode!r}")
        return render(options)

    def expand(self, markdown):
        return BLOCK.sub(lambda match: self.render(match[1]) + "\n", markdown)
