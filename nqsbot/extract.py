"""Constrained extraction; no tools or repository credentials are sent to the model."""
import json
import os
import requests
from jsonschema import validate
from .schema import EXTRACTION, ROOT


def extract(paper, source, registry, session=None):
    key, model = os.getenv("OPENAI_API_KEY"), os.getenv("OPENAI_MODEL")
    if not key or not model:
        raise ValueError("Configure OPENAI_API_KEY and OPENAI_MODEL before live extraction")
    response = (session or requests).post("https://api.openai.com/v1/responses", headers={
        "Authorization": f"Bearer {key}", "Content-Type": "application/json",
    }, json={
        "model": model, "store": False,
        "instructions": (ROOT / "prompts/extract.txt").read_text(),
        "input": json.dumps({"paper_metadata": paper, "registered_benchmarks": list(registry.values()), "untrusted_paper_text": source["text"]}),
        "text": {"format": {"type": "json_schema", "name": "nqs_energy_extraction", "strict": True, "schema": EXTRACTION}},
        "max_output_tokens": 16000,
    }, timeout=(20, 300))
    # Do not include API response bodies or authorization headers in logs.
    if not response.ok:
        raise RuntimeError(f"Extraction API HTTP {response.status_code}; retry on the next run")
    payload = response.json()
    if payload.get("status") != "completed":
        raise ValueError("Extraction incomplete; no result is proposed")
    texts = [c["text"] for item in payload.get("output", []) for c in item.get("content", []) if c.get("type") == "output_text"]
    if not texts:
        raise ValueError("No structured extraction (possibly refusal)")
    parsed = json.loads("".join(texts))
    validate(parsed, EXTRACTION)
    return parsed
