# Learned search tagger

Ketboard search (`site/search.mjs`) reads a query with rules: a vocabulary built from `data/benchmarks.json` plus lists of aliases, and patterns for numbers, sizes and comparisons. This folder trains a small model that reads the words those rules do not know ("frustrated spin model", "toroidal", "artificial atom"). In the browser, `site/search-tagger.mjs` runs the model only on those words. Every other word keeps the tag the rules gave it. A chip the model produced has a blue border, so the reader can remove it if it is wrong.

| File | Role |
| --- | --- |
| `make-data.mjs` | Writes labelled queries: real instances described by a few facets, using the aliases and the paraphrases listed in the file. Labels are those of `labelOf` in `site/search.mjs`. |
| `train.py` | Fine-tunes BERT-tiny ([google/bert_uncased_L-2_H-128_A-2](https://huggingface.co/google/bert_uncased_L-2_H-128_A-2), Apache-2.0) for token classification. Exports `tagger.bin` and `vocab.txt`, plus reference logits computed in NumPy with the same arithmetic as the browser. |
| `../site/search-model/` | The exported model the site serves: `tagger.bin` (word embeddings in int8, other weights in float16), `vocab.txt`, `test-vectors.json` and `metrics.json`. |

The paraphrases come in two sets. `TRAIN` phrases are used for training. `HELD_OUT` phrases are used only in `heldout.jsonl`, which measures how the model reads words it never saw. `metrics.json` reports both sets, before and after quantization.

## What it does, measured

The current model was trained on 40,000 generated queries (70 labels) in 2.5 minutes on 16 CPU cores. The figures below are for the exported, quantized model; quantization changes none of them measurably.

| Measure | Value |
| --- | --- |
| Words unknown to the rules, phrased as in training (dev set) | 99.9% labelled correctly |
| Words unknown to the rules, held-out set | 81% |
| Words that appear in no training paraphrase (715 tokens) | 45% |
| Confident labels on unknown words (probability ≥ 0.7, the browser's threshold) | 86% correct, covering 76% of the meaningful unknown words |
| Hand-written queries built around unfamiliar words (`scripts/check-search.mjs`) | rules alone 1 of 12, rules and tagger 8 of 12 |
| Browser code compared with the NumPy reference | logits within 1e-5 |

BERT-mini (4 layers, hidden size 256) was also tried. It labelled 51% of the never-seen words correctly, with the same precision and the same 8 of 12 hand-written queries, and its export is 13.9 MB instead of 4.6 MB, so it was not kept. Most of what the tagger knows comes from the training paraphrases. Adding paraphrases to `make-data.mjs` helps more than a larger model.

## Retraining

Retrain when models, lattices or parameters are added to Ketboard, or when the label list in `site/search.mjs` changes. Run it on the cluster, not on a laptop.

```sh
node tagger/make-data.mjs tagger-data 40000
python tagger/train.py tagger-data site/search-model   # torch, transformers 4.46, numpy
npm test                                               # compares the browser code with the reference logits
```

Training takes a few minutes on CPUs. A model trained on an older label list still works: the rules keep tagging every word they know.
