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
PAPER = obj({k: string() for k in ("id", "title", "authors", "published", "updated")})
RECORD = obj({
    "schema_version": {"const": 1}, "paper": PAPER,
    "source_url": string(), "source_sha256": string(nullable=True),
    "extraction_model": string(), "results": {"type": "array", "items": ROW},
    "issues": {"type": "array", "items": string()},
})


def benchmarks(root=ROOT):
    rows = json.loads((root / "data/benchmarks.json").read_text())
    assert len({x["id"] for x in rows}) == len(rows), "Duplicate benchmark IDs"
    for row in rows:
        assert isinstance(row["sites"], int) and row["sites"] > 0
        assert all(row[k].strip() for k in ("id", "name", "family", "geometry", "hamiltonian", "sector", "unit"))
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
    validate(row, ROW)
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
    if row["normalization"] not in ("total", "per_site") or row["unit"] != benchmark["unit"]:
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


def variance_per_site(row, registry):
    """Var(H)/N, or None when no variance is recorded."""
    if row["variance"] is None:
        return None
    divisor = registry[row["benchmark_id"]]["sites"] if row["normalization"] == "total" else 1
    value = decimal(row["variance"]) / divisor
    return format(value.normalize() if value == value.to_integral() else value, "f")


def per_site(row, registry):
    divisor = registry[row["benchmark_id"]]["sites"] if row["normalization"] == "total" else 1
    energy = decimal(row["energy"]) / divisor
    error = decimal(row["uncertainty"]) / divisor if row["uncertainty"] is not None else None
    # Plain decimal strings (no exponent) so the site shows 0.0000004 rather than 4E-7.
    plain = lambda value: format(value.normalize() if value == value.to_integral() else value, "f")
    return plain(energy), plain(error) if error is not None else None


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def validate_tree(root=ROOT):
    registry = benchmarks(root)
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
