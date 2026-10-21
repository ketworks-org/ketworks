"""Shared schema and deterministic scientific eligibility checks."""
from decimal import Decimal, InvalidOperation
import hashlib
import json
import re
from pathlib import Path

from jsonschema import validate

ROOT = Path(__file__).resolve().parents[1]


def obj(properties):
    return {"type": "object", "properties": properties, "required": list(properties), "additionalProperties": False}


def string(enum=None, nullable=False):
    result = {"type": ["string", "null"] if nullable else "string"}
    if enum:
        result["enum"] = enum + ([None] if nullable else [])
    return result


# Architecture class of the neural state; a coarse label used for filtering on Ketboard.
METHOD_CLASSES = ["rbm", "feed_forward", "convolutional", "autoregressive", "transformer", "backflow", "hybrid", "other"]

ROW = obj({
    "benchmark_id": string(nullable=True),
    "system_description": string(),
    "method": string(),
    "variant": string(),
    "method_class": string(METHOD_CLASSES),
    "method_type": string(["nqs", "non_nqs", "unknown"]),
    "energy_type": string(["variational", "extrapolated", "projected", "reference", "unknown"]),
    "reported_here": {"type": "boolean"},
    "energy": string(),
    "energy_token": string(),
    "normalization": string(["total", "per_site", "unknown"]),
    "unit": string(),
    "uncertainty": string(nullable=True),
    # upper_bound: the text states that the error is smaller than this value (for example "below the last digit").
    "uncertainty_type": string(["standard_error", "standard_deviation", "confidence_interval", "unspecified", "upper_bound", "not_reported"]),
    # Energy variance Var(H) as printed, in the same normalization as the energy (Var(H)/N for a per-site
    # energy); null when the paper does not print it. With a reference energy it gives the V-score.
    "variance": string(nullable=True),
    "source_location": string(),
    "eligibility_evidence": string(),
    "parameter_count": {"type": ["integer", "null"]},
    "notes": string(),
})
EXTRACTION = obj({"results": {"type": "array", "items": ROW}, "issues": {"type": "array", "items": string()}})
# A stored entry may also carry convention_factor, set by a curator when the source uses another operator
# convention than the instance, for example Pauli matrices for a spin-1/2 Heisenberg instance defined with
# S = sigma/2 (factor 0.25). The printed energy, error bar and variance stay as printed; Ketboard shows the
# energy and error bar multiplied by the factor and the variance by its square. It is not shown on the site.
STORED_ROW = {**ROW, "properties": {**ROW["properties"], "convention_factor": string()}}
PAPER = obj({k: string() for k in ("id", "title", "authors", "published", "updated")})
RECORD = obj({
    "schema_version": {"const": 1}, "paper": PAPER,
    "source_url": string(), "source_sha256": string(nullable=True),
    "extraction_model": string(), "results": {"type": "array", "items": STORED_ROW},
    "issues": {"type": "array", "items": string()},
})


# Broad classes of systems on Ketboard, in display order. A class appears once it has an instance.
CATEGORIES = {
    "lattice-spins": "Lattice spins",
    "lattice-fermions": "Lattice fermions",
    "lattice-bosons": "Lattice bosons",
    "continuous-space": "Continuous space",
}


# Continuous-space instances (first quantization) carry a structured `system`: dimension, particles, space
# (a periodic cell or free space), external potential, interaction, unit and normalization. The readable fields
# are generated from it by site/continuum.mjs; these checks keep the stored structure complete.
# A crystal lists its nuclei in the simulation cell, clamped ("fixed nuclei") or as distinguishable quantum particles
# ("quantum nuclei", whose listed positions are the crystal sites the nuclear state is localized on).
EXTERNAL_POTENTIALS = ("none", "uniform background", "harmonic trap", "fixed nuclei", "quantum nuclei", "other")


def validate_system(row):
    s, where = row.get("system"), row["id"]
    assert isinstance(s, dict), f"{where}: a continuous-space instance needs a structured system"
    assert s.get("dimension") in (1, 2, 3), f"{where}: dimension must be 1, 2 or 3"
    particles = s.get("particles")
    assert isinstance(particles, list) and particles, f"{where}: list the particles"
    total = 0
    for p in particles:
        assert str(p.get("name", "")).strip(), f"{where}: every particle species needs a name"
        if "count" in p:
            assert isinstance(p["count"], int) and p["count"] > 0, f"{where}: particle counts must be positive integers"
            total += p["count"]
        else:
            assert all(isinstance(p.get(k), int) and p[k] >= 0 for k in ("up", "down")), f"{where}: give up and down counts"
            total += p["up"] + p["down"]
    assert total == row["sites"], f"{where}: the particle numbers must add up to sites ({row['sites']})"
    space = s.get("space") or {}
    assert space.get("type") in ("periodic", "free"), f"{where}: space must be a periodic cell or free space"
    if space["type"] == "periodic":
        assert str(space.get("cell", "")).strip() and str(space.get("twist", "")).strip(), f"{where}: a periodic cell needs its shape and twist"
        vectors = space.get("lattice_vectors")
        if vectors is not None:
            assert isinstance(vectors, list) and len(vectors) == s["dimension"] and all(isinstance(a, list) and len(a) == s["dimension"] for a in vectors), f"{where}: give {s['dimension']} lattice vectors of {s['dimension']} coordinates"
        assert "r_s" in space or str(space.get("size", "")).strip() or vectors, f"{where}: a periodic cell needs the density r_s, its size or its lattice vectors"
    external = s.get("external") or {}
    assert external.get("type") in EXTERNAL_POTENTIALS, f"{where}: external potential must be one of {', '.join(EXTERNAL_POTENTIALS)}"
    if external["type"] == "harmonic trap":
        decimal(external.get("omega"))
    if external["type"] in ("fixed nuclei", "quantum nuclei"):
        nuclei = external.get("nuclei")
        assert isinstance(nuclei, list) and nuclei, f"{where}: list the nuclei"
        assert all(isinstance(n.get("Z"), int) and n["Z"] > 0 and len(n.get("position", [])) == s["dimension"] for n in nuclei), f"{where}: each nucleus needs Z and {s['dimension']} coordinates"
        assert external.get("coordinate_units") in ("bohr", "angstrom") and str(external.get("geometry", "")).strip(), f"{where}: give the coordinate units and name the geometry"
        assert external.get("charge") == sum(n["Z"] for n in nuclei) - total, f"{where}: charge must equal the nuclear charge minus the number of electrons"
        if space["type"] == "periodic":
            assert space.get("lattice_vectors") and external["charge"] == 0, f"{where}: a crystal needs the lattice vectors of its simulation cell and a neutral cell"
        if external["type"] == "quantum nuclei":
            decimal(external.get("mass"))
            assert external.get("statistics") == "distinguishable", f"{where}: quantum nuclei are recorded as distinguishable particles"
    if row.get("per") == "atom":
        assert row.get("per_count") == len(external.get("nuclei") or []), f"{where}: per_count must be the number of atoms"
    if row.get("per") == "cell":
        assert row.get("per_count") == space.get("primitive_cells"), f"{where}: per_count must be the number of primitive cells"
    if external["type"] == "other":
        assert str(external.get("description", "")).strip(), f"{where}: describe the external potential"
    interaction = s.get("interaction") or {}
    assert interaction.get("type") == "coulomb" or (interaction.get("type") == "other" and str(interaction.get("description", "")).strip()), f"{where}: the interaction is Coulomb or described"
    assert s.get("unit") == row["unit"] and s.get("per") == row.get("per", "site"), f"{where}: system unit and normalization must match the instance"


def benchmarks(root=ROOT):
    rows = json.loads((root / "data/benchmarks.json").read_text())
    assert len({x["id"] for x in rows}) == len(rows), "Duplicate benchmark IDs"
    for row in rows:
        assert isinstance(row["sites"], int) and row["sites"] > 0
        assert all(row[k].strip() for k in ("id", "name", "family", "geometry", "hamiltonian", "sector", "unit"))
        assert row.get("category") in CATEGORIES, f"{row['id']}: category must be one of {', '.join(CATEGORIES)}"
        # Optional: what the energy is normalized by on the board (default "site"), and a section name used to
        # group the instances of a model on its page (default: the boundary class).
        # "atom" and "cell" (primitive cell) divide a total by per_count instead of the number of sites.
        assert row.get("per", "site") in ("site", "electron", "particle", "system", "atom", "cell"), f"{row['id']}: per must be site, electron, particle, system, atom or cell"
        if row.get("per") in ("atom", "cell"):
            assert isinstance(row.get("per_count"), int) and row["per_count"] > 0, f"{row['id']}: per {row['per']} needs a positive integer per_count"
        if row["category"] == "continuous-space":
            validate_system(row)
        assert isinstance(row.get("group", ""), str), f"{row['id']}: group must be a string"
    return {x["id"]: x for x in rows}


def paper_parts(identifier):
    match = re.fullmatch(r"(\d{4}\.\d{4,5})v([1-9]\d*)", identifier)
    if not match:
        raise ValueError("Expected a versioned modern arXiv ID")
    return match[1], int(match[2])


def decimal(value):
    if not isinstance(value, str) or not re.fullmatch(r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?", value):
        raise ValueError("Energy and uncertainty must be finite decimal strings")
    try:
        number = Decimal(value)
    except InvalidOperation as exc:
        raise ValueError("Invalid decimal") from exc
    if not number.is_finite():
        raise ValueError("Non-finite value")
    return number


def eligible(row):
    return row["method_type"] == "nqs" and row["energy_type"] == "variational" and row["reported_here"]


def validate_row(row, registry, source_text=None, allow_unmatched=False):
    validate(row, STORED_ROW)
    if "convention_factor" in row:
        factor = decimal(row["convention_factor"])
        if factor <= 0 or factor == 1:
            raise ValueError("convention_factor must be positive and different from 1")
        if "convention" not in row["notes"].lower():
            raise ValueError("Explain the convention_factor in the notes (which convention the source uses)")
    if not eligible(row):
        raise ValueError("Only original NQS variational estimates are eligible")
    for field in ("method", "variant", "system_description", "source_location", "eligibility_evidence", "energy_token"):
        if not row[field].strip():
            raise ValueError(f"Missing {field}")
    energy_value = decimal(row["energy"])
    token = row["energy_token"].strip().replace("−", "-")
    printed = re.fullmatch(r"([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\((\d+)\))?([eE][+-]?\d+)?", token)
    if not printed or decimal(printed[1] + (printed[3] or "")) != energy_value:
        raise ValueError("Energy does not match the printed numeric token")
    if printed[2] is not None:
        places = len(printed[1].split(".")[1]) if "." in printed[1] else 0
        exponent = int(printed[3][1:]) if printed[3] else 0
        implied_error = Decimal(printed[2]) * Decimal(10) ** (exponent - places)
        if row["uncertainty"] is None or decimal(row["uncertainty"]) != implied_error:
            raise ValueError("Uncertainty disagrees with the printed parentheses")
    # Every entry needs an error bar, printed or stated in the text; "not_reported" stays in the enum only
    # so that automated extraction can say so, and such rows are then rejected here for review.
    if row["uncertainty"] is None:
        raise ValueError("No error bar: entries need the uncertainty printed or stated in the paper")
    if decimal(row["uncertainty"]) <= 0 or row["uncertainty_type"] == "not_reported":
        raise ValueError("Invalid uncertainty")
    if row["variance"] is not None and decimal(row["variance"]) < 0:
        raise ValueError("Invalid variance")
    if row["parameter_count"] is not None and row["parameter_count"] < 0:
        raise ValueError("Negative parameter count")
    if source_text is not None:
        normalize = lambda s: " ".join(s.replace("−", "-").split())
        if normalize(row["energy_token"]) not in normalize(source_text):
            raise ValueError("Printed energy token not found in the downloaded source")
    benchmark = registry.get(row["benchmark_id"])
    if not benchmark:
        if allow_unmatched and row["benchmark_id"] is None:
            return
        raise ValueError("Result needs an exact registered benchmark")
    # A unit other than the instance's is allowed only with a convention_factor that converts it (e.g. Ry to Ha).
    if benchmark.get("per") == "system" and row["normalization"] != "total":
        raise ValueError("This instance is compared by total energy; record the printed total")
    if row["normalization"] not in ("total", "per_site") or (row["unit"] != benchmark["unit"] and "convention_factor" not in row):
        raise ValueError("Unresolved normalization or mismatched units")


def row_key(row):
    return (row["benchmark_id"] or row["system_description"], row["method"].casefold(), row["variant"].casefold())


def validate_record(record, registry, allow_unmatched=False):
    validate(record, RECORD)
    paper_parts(record["paper"]["id"])
    if not record["results"]:
        raise ValueError("Empty result files are not published")
    expected_urls = [f"https://arxiv.org/{kind}/{record['paper']['id']}" for kind in ("html", "pdf")]
    if record["source_url"] not in expected_urls:
        raise ValueError("Source must be the exact versioned arXiv HTML or PDF")
    checksum = record["source_sha256"]
    if checksum is None:
        if record["extraction_model"] != "human":
            raise ValueError("Automated extraction requires a source checksum")
    elif not re.fullmatch(r"[0-9a-f]{64}", checksum):
        raise ValueError("Invalid source checksum")
    keys = []
    for row in record["results"]:
        validate_row(row, registry, allow_unmatched=allow_unmatched)
        keys.append(row_key(row))
    if len(set(keys)) != len(keys):
        raise ValueError("Duplicate benchmark/method/variant rows")


def significant_digits(text):
    """Significant digits of a printed decimal, e.g. 0.0099 -> 2, -202.4230 -> 7, 0.020 -> 2."""
    digits = re.sub(r"[eE].*$", "", str(text)).lstrip("+-").replace(".", "").lstrip("0")
    return max(len(digits), 1)


def round_significant(value, digits):
    if value == 0:
        return value
    return value.quantize(Decimal(1).scaleb(value.adjusted() - digits + 1))


# Plain decimal strings (no exponent) so the site shows 0.0000004 rather than 4E-7.
def plain(value):
    return format(value.normalize() if value == value.to_integral() and value.as_tuple().exponent >= 0 else value, "f")


def variance_per_site(row, registry):
    """Var(H)/N to the significant digits of the printed variance (at most six), or None when none is recorded."""
    if row["variance"] is None:
        return None
    divisor = per_divisor(row, registry)
    factor = convention_factor(row)
    value = decimal(row["variance"])
    if divisor == 1 and factor == 1 and significant_digits(row["variance"]) <= 6:
        return plain(value)
    return plain(round_significant(value * factor * factor / divisor, min(6, significant_digits(row["variance"]))))


def per_divisor(row, registry):
    """What a printed total is divided by: the number of sites or particles, the number of atoms or primitive
    cells (per_count), or 1 for an instance whose board value is the total energy of the system (per = "system",
    e.g. a molecule)."""
    benchmark = registry[row["benchmark_id"]]
    if benchmark.get("per") == "system":
        return 1
    return benchmark.get("per_count", benchmark["sites"]) if row["normalization"] == "total" else 1


def convention_factor(row):
    return decimal(row["convention_factor"]) if row.get("convention_factor") else Decimal(1)


def per_site(row, registry):
    """Energy and error bar per site, as printed for per-site rows. A total energy is divided by the
    number of sites (and a converted one multiplied by its convention_factor) and rounded back to the
    printed precision: the error bar keeps its printed significant digits (at most two) and the energy
    is cut at the error bar's last digit."""
    divisor = per_divisor(row, registry) / convention_factor(row)
    energy = decimal(row["energy"])
    error = decimal(row["uncertainty"]) if row["uncertainty"] is not None else None
    if divisor == 1:
        return plain(energy), plain(error) if error is not None else None
    if error is None:
        return plain(round_significant(energy / divisor, significant_digits(row["energy"]))), None
    error = round_significant(error / divisor, min(2, significant_digits(row["uncertainty"])))
    energy = (energy / divisor).quantize(Decimal(1).scaleb(error.as_tuple().exponent))
    return plain(energy), plain(error)


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


# Energies of other methods (DMC, FCIQMC, CCSD(T), DMRG, exact diagonalization) for Ketboard instances. They are
# shown only in the generated tables of Ketbook pages, never on Ketboard. kind: exact (or an estimate of the exact
# energy with a stated error), upper_bound (a variational energy of another method), estimate (not variational:
# extrapolations, coupled cluster, transcorrelated or constrained-path results).
REFERENCE_KINDS = ["exact", "upper_bound", "estimate"]
REFERENCE = obj({"benchmark_id": string(), "method": string(), "kind": string(REFERENCE_KINDS), "energy_token": string(),
                 "normalization": string(["total", "per_site"]), "unit": string(), "source": string(), "notes": string()})
# Like an entry, a reference printed in another unit (Rydberg) carries the factor that converts it.
REFERENCE["properties"] = {**REFERENCE["properties"], "convention_factor": string()}
REFERENCE_FILE = obj({"schema_version": {"const": 1}, "references": {"type": "array", "items": REFERENCE, "minItems": 1}})
TOKEN = re.compile(r"([+-]?\d+(?:\.\d+)?)(?:\((\d+)\))?")


def reference_row(reference):
    """A reference as a row that per_site() understands: energy and uncertainty from the printed token."""
    match = TOKEN.fullmatch(reference["energy_token"])
    if not match:
        raise ValueError(f"{reference['benchmark_id']}: reference token {reference['energy_token']!r} must look like -1.2345(6)")
    value, digits = match[1], match[2]
    decimals = len(value.split(".")[1]) if "." in value else 0
    row = {"benchmark_id": reference["benchmark_id"], "energy": value, "normalization": reference["normalization"],
           "uncertainty": plain(Decimal(digits).scaleb(-decimals)) if digits else None}
    if "convention_factor" in reference:
        row["convention_factor"] = reference["convention_factor"]
    return row


def validate_references(root, registry):
    seen = set()
    for path in sorted((root / "data/references").glob("*.json")):
        record = json.loads(path.read_text())
        validate(record, REFERENCE_FILE)
        for reference in record["references"]:
            benchmark = registry.get(reference["benchmark_id"])
            if benchmark is None:
                raise ValueError(f"{path.name}: unknown instance {reference['benchmark_id']}")
            reference_row(reference)
            if "convention_factor" in reference:
                factor = decimal(reference["convention_factor"])
                if factor <= 0 or factor == 1:
                    raise ValueError(f"{path.name}: convention_factor must be positive and differ from 1")
            elif reference["unit"] != benchmark["unit"]:
                raise ValueError(f"{path.name}: {reference['benchmark_id']} is in {benchmark['unit']}; a reference in {reference['unit']} needs a convention_factor")
            if benchmark.get("per") == "system" and reference["normalization"] != "total":
                raise ValueError(f"{path.name}: {reference['benchmark_id']} is compared by total energy")
            if not reference["source"].strip() or not reference["method"].strip():
                raise ValueError(f"{path.name}: a reference needs a method and a source")
            key = (reference["benchmark_id"], reference["method"].casefold(), reference["source"].casefold())
            if key in seen:
                raise ValueError(f"{path.name}: duplicate reference {key}")
            seen.add(key)


def validate_tree(root=ROOT):
    registry = benchmarks(root)
    validate_references(root, registry)
    for folder, unmatched in (("results", False), ("proposals", True)):
        for path in sorted((root / "data" / folder).glob("*.json")):
            record = json.loads(path.read_text())
            validate_record(record, registry, allow_unmatched=unmatched)
            base, _ = paper_parts(record["paper"]["id"])
            if path.stem != base:
                raise ValueError(f"{path}: filename must be the unversioned paper ID")
    return registry


if __name__ == "__main__":
    validate_tree()
    print("Benchmark and result validation passed.")
