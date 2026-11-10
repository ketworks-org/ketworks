"""Train the learned search tagger and export it for the browser (site/search-tagger.mjs).

The model is BERT-tiny (google/bert_uncased_L-2_H-128_A-2: 2 layers, hidden size 128, Apache-2.0), fine-tuned for
token classification on the queries written by tagger/make-data.mjs. Each search token is split into WordPiece
pieces exactly as site/search-tagger.mjs does (wordpieces() below), and its label is predicted at its first piece.

    python tagger/train.py DATA_DIR OUT_DIR

writes OUT_DIR/tagger.bin (weights: word embeddings in int8 with one scale per row, other matrices in float16),
OUT_DIR/vocab.txt (the WordPiece vocabulary, without pieces the search tokens cannot contain), OUT_DIR/test-vectors.json
(logits of the exported model, computed here with NumPy, which scripts/check-search.mjs compares with the browser
code) and OUT_DIR/metrics.json.
"""
import json
import math
import os
import random
import re
import struct
import sys
import time
import unicodedata
from pathlib import Path

import numpy as np
import torch
from transformers import BertForTokenClassification

# BERT-tiny by default; KTG_BASE=google/bert_uncased_L-4_H-256_A-4 (BERT-mini) was compared and not kept (see README).
BASE = os.environ.get("KTG_BASE", "google/bert_uncased_L-2_H-128_A-2")
MAX_PIECES = 64
SEED = 20261109


# ----------------------------------------------------------------------------------------------------------------
# WordPiece, mirrored in site/search-tagger.mjs. Search tokens are already lower-case and without accents.
def is_punctuation(ch):
    cp = ord(ch)
    return 33 <= cp <= 47 or 58 <= cp <= 64 or 91 <= cp <= 96 or 123 <= cp <= 126 or unicodedata.category(ch).startswith("P")


def basic_split(text):
    words, current = [], ""
    for ch in text:
        if ch.isspace():
            if current:
                words.append(current)
            current = ""
        elif is_punctuation(ch):
            if current:
                words.append(current)
            words.append(ch)
            current = ""
        else:
            current += ch
    if current:
        words.append(current)
    return words


def wordpieces(token, vocab):
    pieces = []
    for word in basic_split(token):
        if len(word) > 100:
            pieces.append("[UNK]")
            continue
        start, sub = 0, []
        while start < len(word):
            end, found = len(word), None
            while start < end:
                piece = word[start:end] if start == 0 else "##" + word[start:end]
                if piece in vocab:
                    found = piece
                    break
                end -= 1
            if found is None:
                sub = ["[UNK]"]
                break
            sub.append(found)
            start = end
        pieces.extend(sub)
    return pieces or ["[UNK]"]


def kept_vocabulary(full):
    """Pieces a search token can produce: ASCII and Greek. Search tokens never contain other scripts."""
    keep = re.compile(r"^(##)?[\x21-\x7eͰ-Ͽ]+$")
    return [t for t in full if t in ("[PAD]", "[UNK]", "[CLS]", "[SEP]", "[MASK]") or keep.match(t)]


def encode(tokens, vocab_ids):
    """Piece ids (in the full vocabulary) and, for each token, the position of its first piece."""
    ids, first = [vocab_ids["[CLS]"]], []
    for token in tokens:
        pieces = wordpieces(token, vocab_ids)
        if len(ids) + len(pieces) >= MAX_PIECES - 1:
            first.append(None)
            continue
        first.append(len(ids))
        ids.extend(vocab_ids[p] for p in pieces)
    ids.append(vocab_ids["[SEP]"])
    return ids, first


# ----------------------------------------------------------------------------------------------------------------
def load(path):
    return [json.loads(line) for line in Path(path).read_text().splitlines() if line.strip()]


def batches(rows, vocab_ids, label_ids, batch_size, shuffle, unknown_weight=3.0):
    order = list(range(len(rows)))
    if shuffle:
        random.shuffle(order)
    for at in range(0, len(order), batch_size):
        chunk = [rows[i] for i in order[at:at + batch_size]]
        encoded = [encode(r["tokens"], vocab_ids) for r in chunk]
        width = max(len(ids) for ids, _ in encoded)
        input_ids = torch.zeros(len(chunk), width, dtype=torch.long)
        mask = torch.zeros(len(chunk), width, dtype=torch.long)
        labels = torch.full((len(chunk), width), -100, dtype=torch.long)
        weights = torch.zeros(len(chunk), width)
        for b, (row, (ids, first)) in enumerate(zip(chunk, encoded)):
            input_ids[b, :len(ids)] = torch.tensor(ids)
            mask[b, :len(ids)] = 1
            for k, position in enumerate(first):
                if position is not None:
                    labels[b, position] = label_ids[row["labels"][k]]
                    weights[b, position] = unknown_weight if row["unknown"][k] else 1.0
        yield chunk, encoded, input_ids, mask, labels, weights


def predict(model, rows, vocab_ids, label_ids, device):
    model.eval()
    out = []
    with torch.no_grad():
        for chunk, encoded, input_ids, mask, _, _ in batches(rows, vocab_ids, label_ids, 512, False):
            probs = model(input_ids=input_ids.to(device), attention_mask=mask.to(device)).logits.softmax(-1).cpu().numpy()
            for b, (_, first) in enumerate(encoded):
                out.append([probs[b, p] if p is not None else None for p in first])
    return out


def metrics(rows, probs, labels, heldout_words=frozenset()):
    """Accuracy on all tokens, on the tokens the rules do not know, on held-out words; and, for unknown tokens, how
    often a confident non-O prediction is right (precision) and how many such tokens get one (coverage)."""
    total = correct = unknown = unknown_correct = held = held_correct = 0
    by_threshold = {t: [0, 0, 0] for t in (0.5, 0.6, 0.7, 0.8, 0.9)}  # predicted non-O, right, gold non-O
    for row, p in zip(rows, probs):
        for k, gold in enumerate(row["labels"]):
            if p[k] is None:
                continue
            guess = labels[int(np.argmax(p[k]))]
            total += 1
            correct += guess == gold
            if row["unknown"][k]:
                unknown += 1
                unknown_correct += guess == gold
                for t, counts in by_threshold.items():
                    if guess not in ("O", "stop") and p[k].max() >= t:
                        counts[0] += 1
                        counts[1] += guess == gold
                    counts[2] += gold not in ("O", "stop")
            if row["tokens"][k] in heldout_words:
                held += 1
                held_correct += guess == gold
    return {
        "accuracy": correct / max(total, 1), "unknown_accuracy": unknown_correct / max(unknown, 1), "unknown_tokens": unknown,
        "heldout_word_accuracy": held_correct / max(held, 1) if held else None, "heldout_word_tokens": held,
        "confident": {str(t): {"precision": c[1] / max(c[0], 1), "coverage": c[1] / max(c[2], 1)} for t, c in by_threshold.items()},
    }


# ----------------------------------------------------------------------------------------------------------------
# Export, and the same forward pass in NumPy on the exported (quantized) weights.
def f16(a):
    return np.asarray(a, dtype=np.float32).astype(np.float16)


def export(model, full_vocab, kept, labels, out):
    state = {k: v.detach().cpu().numpy().astype(np.float32) for k, v in model.state_dict().items()}
    config = model.config
    full_ids = {t: i for i, t in enumerate(full_vocab)}
    rows = np.array([full_ids[t] for t in kept])
    words = state["bert.embeddings.word_embeddings.weight"][rows]
    scales = np.maximum(np.abs(words).max(axis=1), 1e-8) / 127.0
    tensors = {
        "word": (np.round(words / scales[:, None]).astype(np.int8), "i8"), "word_scale": (scales.astype(np.float32), "f32"),
        "position": (f16(state["bert.embeddings.position_embeddings.weight"][:MAX_PIECES]), "f16"),
        "type": (state["bert.embeddings.token_type_embeddings.weight"][0].astype(np.float32), "f32"),
        "embed_ln_w": (state["bert.embeddings.LayerNorm.weight"], "f32"), "embed_ln_b": (state["bert.embeddings.LayerNorm.bias"], "f32"),
        "classifier_w": (f16(state["classifier.weight"]), "f16"), "classifier_b": (state["classifier.bias"], "f32"),
    }
    for layer in range(config.num_hidden_layers):
        p = f"bert.encoder.layer.{layer}."
        for short, name in [("q", "attention.self.query"), ("k", "attention.self.key"), ("v", "attention.self.value"), ("o", "attention.output.dense"),
                            ("i", "intermediate.dense"), ("f", "output.dense")]:
            tensors[f"l{layer}_{short}_w"] = (f16(state[p + name + ".weight"]), "f16")
            tensors[f"l{layer}_{short}_b"] = (state[p + name + ".bias"], "f32")
        for short, name in [("ln1", "attention.output.LayerNorm"), ("ln2", "output.LayerNorm")]:
            tensors[f"l{layer}_{short}_w"] = (state[p + name + ".weight"], "f32")
            tensors[f"l{layer}_{short}_b"] = (state[p + name + ".bias"], "f32")
    header = {"format": "ketworks-tagger-1", "base": BASE, "config": {
        "hidden": config.hidden_size, "layers": config.num_hidden_layers, "heads": config.num_attention_heads, "intermediate": config.intermediate_size,
        "positions": MAX_PIECES, "eps": config.layer_norm_eps, "labels": labels, "vocab": len(kept)}, "tensors": {}}
    blobs, offset = [], 0
    for name, (array, dtype) in tensors.items():
        data = np.ascontiguousarray(array).tobytes()
        header["tensors"][name] = {"dtype": dtype, "shape": list(array.shape), "offset": offset}
        pad = (-len(data)) % 4
        blobs.append(data + b"\0" * pad)
        offset += len(data) + pad
    head = json.dumps(header, ensure_ascii=False).encode()
    head += b" " * ((-len(head)) % 4)
    (out / "tagger.bin").write_bytes(b"KTG1" + struct.pack("<I", len(head)) + head + b"".join(blobs))
    (out / "vocab.txt").write_text("\n".join(kept) + "\n")
    # The dequantized weights, as the browser holds them.
    w = {name: (array.astype(np.float32) if dtype != "i8" else array.astype(np.float32) * tensors["word_scale"][0][:, None]) for name, (array, dtype) in tensors.items()}
    return w, header["config"]


def erf(x):
    # Abramowitz and Stegun 7.1.26, as in site/search-tagger.mjs (absolute error below 1.5e-7).
    sign = np.sign(x)
    x = np.abs(x)
    t = 1.0 / (1.0 + 0.3275911 * x)
    y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * np.exp(-x * x)
    return sign * y


def numpy_logits(ids, w, cfg):
    def ln(x, g, b):
        mean = x.mean(-1, keepdims=True)
        var = ((x - mean) ** 2).mean(-1, keepdims=True)
        return (x - mean) / np.sqrt(var + cfg["eps"]) * g + b
    n, heads = len(ids), cfg["heads"]
    dh = cfg["hidden"] // heads
    x = ln(w["word"][ids] + w["position"][:n] + w["type"], w["embed_ln_w"], w["embed_ln_b"])
    for layer in range(cfg["layers"]):
        g = lambda s: w[f"l{layer}_{s}"]
        q, k, v = (x @ g(f"{s}_w").T + g(f"{s}_b") for s in "qkv")
        ctx = np.zeros_like(x)
        for h in range(heads):
            sl = slice(h * dh, (h + 1) * dh)
            scores = q[:, sl] @ k[:, sl].T / math.sqrt(dh)
            scores = np.exp(scores - scores.max(-1, keepdims=True))
            ctx[:, sl] = (scores / scores.sum(-1, keepdims=True)) @ v[:, sl]
        x = ln(x + ctx @ g("o_w").T + g("o_b"), g("ln1_w"), g("ln1_b"))
        hidden = x @ g("i_w").T + g("i_b")
        hidden = 0.5 * hidden * (1 + erf(hidden / math.sqrt(2)))
        x = ln(x + hidden @ g("f_w").T + g("f_b"), g("ln2_w"), g("ln2_b"))
    return x @ w["classifier_w"].T + w["classifier_b"]


# ----------------------------------------------------------------------------------------------------------------
def main(data, out):
    random.seed(SEED)
    np.random.seed(SEED)
    torch.manual_seed(SEED)
    data, out = Path(data), Path(out)
    out.mkdir(parents=True, exist_ok=True)
    labels = json.loads((data / "labels.json").read_text())
    label_ids = {l: i for i, l in enumerate(labels)}
    train, dev, heldout = load(data / "train.jsonl"), load(data / "dev.jsonl"), load(data / "heldout.jsonl")
    heldout_words = frozenset(json.loads((data / "heldout-words.json").read_text()))
    model = BertForTokenClassification.from_pretrained(BASE, num_labels=len(labels))
    from transformers import BertTokenizer
    full_vocab = list(BertTokenizer.from_pretrained(BASE).vocab.keys())
    kept = kept_vocabulary(full_vocab)
    full_ids = {t: i for i, t in enumerate(full_vocab)}
    vocab_ids = {t: full_ids[t] for t in kept}  # tokenization uses the kept pieces only, as the browser does
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)
    epochs, batch_size, lr = 8, 128, 4e-4
    steps = epochs * math.ceil(len(train) / batch_size)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    schedule = torch.optim.lr_scheduler.LambdaLR(optimizer, lambda s: min(1.0, s / (0.06 * steps)) * max(0.0, (steps - s) / (0.94 * steps)))
    print(f"{len(train)} train rows, {len(labels)} labels, {len(kept)} of {len(full_vocab)} pieces kept, device {device}", flush=True)
    started = time.time()
    for epoch in range(epochs):
        model.train()
        total = 0.0
        for _, _, input_ids, mask, gold, weights in batches(train, vocab_ids, label_ids, batch_size, True):
            logits = model(input_ids=input_ids.to(device), attention_mask=mask.to(device)).logits
            loss = torch.nn.functional.cross_entropy(logits.reshape(-1, len(labels)), gold.to(device).reshape(-1), reduction="none", ignore_index=-100)
            loss = (loss * weights.to(device).reshape(-1)).sum() / weights.sum().to(device)
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            schedule.step()
            total += loss.item()
        m = metrics(dev, predict(model, dev, vocab_ids, label_ids, device), labels)
        print(f"epoch {epoch + 1}: loss {total:.1f}, dev accuracy {m['accuracy']:.4f}, dev unknown-word accuracy {m['unknown_accuracy']:.4f} ({time.time() - started:.0f} s)", flush=True)
    model.cpu()
    result = {"dev": metrics(dev, predict(model, dev, vocab_ids, label_ids, "cpu"), labels),
              "heldout": metrics(heldout, predict(model, heldout, vocab_ids, label_ids, "cpu"), labels, heldout_words)}
    # The exported model: quantized weights, NumPy forward pass identical to the browser's.
    w, cfg = export(model, full_vocab, kept, labels, out)
    new_ids = {t: i for i, t in enumerate(kept)}
    remap = {full_ids[t]: new_ids[t] for t in kept}
    def quantized(rows):
        out_probs = []
        for row in rows:
            ids, first = encode(row["tokens"], vocab_ids)
            logits = numpy_logits([remap[i] for i in ids], w, cfg)
            e = np.exp(logits - logits.max(-1, keepdims=True))
            probs = e / e.sum(-1, keepdims=True)
            out_probs.append([probs[p] if p is not None else None for p in first])
        return out_probs
    result["dev_exported"] = metrics(dev, quantized(dev), labels)
    result["heldout_exported"] = metrics(heldout, quantized(heldout), labels, heldout_words)
    vectors = []
    for row in dev[:6] + heldout[:6]:
        ids, first = encode(row["tokens"], vocab_ids)
        logits = numpy_logits([remap[i] for i in ids], w, cfg)
        vectors.append({"tokens": row["tokens"], "pieces": [remap[i] for i in ids], "first": first, "logits": [[round(float(x), 5) for x in logits[p]] if p is not None else None for p in first]})
    (out / "test-vectors.json").write_text(json.dumps(vectors) + "\n")
    (out / "metrics.json").write_text(json.dumps(result, indent=1) + "\n")
    print(json.dumps(result, indent=1))
    print(f"tagger.bin: {(out / 'tagger.bin').stat().st_size / 1e6:.2f} MB, vocab.txt: {(out / 'vocab.txt').stat().st_size / 1e3:.0f} kB")


if __name__ == "__main__":
    main(*sys.argv[1:3])
