# Contributing to Ketbook and Ketboard

Wiki pages and NQS energy results both enter through pull requests. Anyone can propose a contribution. You do not need direct write access: GitHub can create a fork and a branch for your proposal. A maintainer reviews and merges the change. Contributions are released under the repository's [MIT License](LICENSE).

Every pull request gets a preview of the site with the change applied. A few minutes after each push, a comment on the pull request links to it and to the instances, entries and pages that changed. The preview carries a yellow banner and is not indexed.

## Edit the wiki

1. Open an article on Ketbook and choose **Edit this page**.
2. Edit its Markdown file in GitHub. Use `$...$` for inline LaTeX and `$$...$$` on separate lines for display equations. `\(...\)` and `\[...\]` are also supported. Do not replace math with Unicode approximations or images.
3. Choose **Propose changes**, create a branch/fork as prompted, and open a pull request. Explain the correction and cite its sources.

To add an article, create `wiki/your-topic.md` and add a slug, title, section, and summary to `wiki/index.json`. Sections are Fundamentals, Architectures and Benchmarks; the order of entries in the index is the reading order. Architecture articles also set `subsection` to `Lattice systems` or `Continuous space`, according to the representation developed in the article; the architecture guide sits above these groups without a subsection. The sidebar, contents and topic search use this grouping. Write densely: state the result, give the equation, cite the arXiv identifier. Use `##` headings for sections; they become anchors and the page's table of contents. Slugs use lowercase letters, numbers, and hyphens. Link to another article with `../other-topic/`. The build supplies navigation, edit links, and page history.

KaTeX renders equations into HTML and accessible MathML during the build. Its CSS and fonts are served with the site. Invalid LaTeX fails the build. Raw HTML is escaped; use Markdown for content. Text changes, references, examples, and new topics all follow the same PR process.

## Editorial standards for wiki pages

- **Shape.** Every page opens with a blockquote beginning `**In brief.**` that states the result of the page in three or four sentences, followed by `Notation follows the [conventions page](../notation/).` Sections use `##` headings; they become anchors and the table of contents. The page ends with `## References`.
- **Voice.** State things; do not announce them. No "in this page we will", no "it is worth noting", no lists introduced by a sentence that counts their items. Prefer a derivation or an equation to a description of one.
- **Claims.** Every quantitative statement cites the table, figure or equation it comes from, as an arXiv identifier. Numbers that cannot be traced to a source are not written; if a rounded value is given for scale, say so and point to Ketboard for the digits. Phase-diagram and method attributions name the paper.
- **Notation.** Symbols are those of the [notation page](wiki/notation.md). A page that needs a new symbol defines it where it first appears.
- **References.** One entry per line: authors, *title*, arXiv identifier with year in parentheses, then a short note saying what the reference is for. Journal references are given only for works without an arXiv version.
- **Status.** Each entry in `wiki/index.json` carries `"status": "draft"` or `"reviewed"`. A curator flips a page to reviewed after checking its claims against the sources; the page shows the status next to its section. New and substantially rewritten pages are drafts.

## Energies of other methods and generated tables

Ketboard holds only neural-network results. Energies of other methods for a Ketboard instance (diffusion Monte Carlo, DMRG, CCSD(T), FCIQMC, exact diagonalization) go in `data/references/<page>.json` and appear only on Ketbook benchmark pages. Each reference names the instance, the method, its `kind` (`exact`; `upper_bound` for a variational energy of another method; `estimate` for anything that is not a bound, such as an extrapolation, coupled cluster or a transcorrelated result), the printed token, the normalization and unit (with a `convention_factor` for another unit, as for entries), and the source with its table. It must be for exactly the same finite system as the instance; a value for another cell, twist, geometry or basis is not a reference. The checks validate every reference.

Energy tables on benchmark pages are not written by hand. A page asks for one with a fenced block:

    ```ketboard
    summary
    instances: heg3d-sc-n14-unpol-rs*
    row: r_s
    ```

and the build replaces it with a table made from the current Ketboard entries and references. `summary` gives, for each instance, the lowest neural energy, the lowest upper bound from another method, which of the two is lower (or that they agree within twice the combined error bars), and the distance to the exact energy or the best estimate. `entries` lists every entry and reference of an instance, highest first. `difference` gives the difference between two instances for the same state, such as a reaction barrier (`scale` and `unit` convert it). `instances` takes keys or patterns; `row` labels rows by `r_s`, `size`, `molecule`, for crystals by `cell`, `twist` or `lattice`, or by the instance label. Text on a page should not repeat numbers that the tables already show, since text does not update when an entry is added.

## Add a Ketboard result

1. Open **Ketboard → Submit a result**. Choose the class of system (lattice spins, lattice fermions, …), then the system and the exact instance, type the versioned arXiv identifier, the method, the variant, the architecture class, the energy **exactly as printed** (for example `-0.497634(1)`; the decimal value and the uncertainty are derived from it), whether that printed value is per site or total, the error bar and what it means, the energy variance if the paper prints it, the table or page, and one sentence on why the result is a directly evaluated NQS variational energy. Title and authors can be left empty; they are filled from arXiv on the pull request.

   Every entry needs an error bar. It is read from the parentheses of the printed energy; if the paper prints it as ±, type it in the error-bar field. If the paper states only a bound, for example that statistical errors are below the last printed digit, enter that bound and choose *Upper bound stated in the text*. An energy with no error bar and no stated bound cannot be submitted, and the checks on the pull request reject it. The energy variance is optional: give $\operatorname{Var}(H)$ in the same normalization as the energy (per site if the energy is per site), so that the V-score can be reconstructed.
2. Confirm that the paper reports an original, directly evaluated NQS variational energy and that the instance matches the complete Hamiltonian, lattice, boundaries, couplings and sector.
3. Click **Prepare the record**. For a paper not yet on the board, **Create the file on GitHub** opens the editor with the file filled in. For a paper that already has a record, the page shows the complete file with your row appended: open the existing file on GitHub, replace its content with the JSON shown, and propose the change.
4. Open the pull request and explain the result. A maintainer checks eligibility and transcription before merging.

Results live in `data/results/<unversioned-arxiv-id>.json`. Each row names an architecture class in `method_class` (`rbm`, `feed_forward`, `convolutional`, `autoregressive`, `transformer`, `backflow`, `hybrid`, or `other`); Ketboard filters on it. The record itself pins the exact arXiv version. `energy` and `uncertainty` are decimal strings; `energy_token` preserves the original printed number including parenthesized uncertainty. Unreported uncertainty is `null`, never an invented zero. Leave unknown bibliographic dates empty rather than guessing them.

Human submissions use `extraction_model: "human"`. A source checksum may be null for a human entry; the exact versioned source URL and location are still required. Bot records always include a source checksum. All result rows undergo the same scientific validation.

A benchmark may name a wiki page in `wiki` (a slug from `wiki/index.json`); Ketboard then links the instance to that page, as for the J₁–J₂ square lattice.

**A result for an instance that is not on the board.** In the form, choose *A new instance* and define it from a template: model (Heisenberg, J₁–J₂, transverse-field Ising, Hubbard, t–t′ Hubbard, or a custom Hamiltonian in plain text), lattice, extents, boundary conditions, couplings and sector. The page derives the key, the labels, the Hamiltonian text and LaTeX, and the site count, and shows the complete entry for `data/benchmarks.json` next to the result record. Append the entry to the array in `data/benchmarks.json` and create the result file, in the same pull request; the checks validate both, and the key must follow the scheme of the existing instances (`j1j2-square-10x10-pbc-j2-0p5-sz0`, `hubbard-square-8x8-pbc-u8-n56-sz0`). Keep `name` and `family` as the model, named by its Hamiltonian (`Heisenberg`, `Hubbard`, `Electron gas`, `Solids`), without lattice, size or parameter values; `part` names the part of the model the instance belongs to, which Ketboard uses to navigate it (the lattice, such as `Square` or `Triangular`; the dimension of the electron gas; the molecule; the material); and put size, boundaries, couplings and sector in `instance_label`. The form fills all three. `category` is the class of system that groups models on Ketboard: `lattice-spins`, `lattice-fermions`, `lattice-bosons` or `continuum-electrons`. It is the class chosen at the top of the form; the templates offered for a new instance are those of that class. To add an instance to a model already on the board, use *Add an instance of this model* on the model's page, or *Add an instance like this one* on an instance's page: the form opens with the template filled in from that instance, and you change what differs (size, boundaries, couplings, sector, particle numbers, density). For a model that no template covers (the kagome and pyrochlore Heisenberg models and the t–V model so far), the link opens a proposal that starts from the existing definition, and a curator adds the instance.

**A new instance of continuum electrons.** For `continuum-electrons` the form describes the system in first quantization, in six parts: the dimension; the electrons, $N_\uparrow$ and $N_\downarrow$; the space (a periodic cell with its shape, the density $r_s$ or the cell size, and the twist, or free space); the external potential (none, a uniform neutralizing background, a harmonic trap of frequency $\omega$, fixed nuclei, or another potential in words); the interaction (Coulomb, or another one in words); and the unit and normalization of the energy (per electron, per particle, or the total energy of the system). Presets fill these for the electron gas, a quantum dot, a molecule and a crystal. Systems of other particles in continuous space, such as nuclear matter, quantum gases or helium, will get categories of their own; until then, submit one as an instance you cannot define. A molecule is a set of fixed nuclei given as `Symbol x y z` lines in bohr or ångström, with a short name for the geometry (`r-2p068-bohr`, `equilibrium`); the charge follows from the nuclei and the electron count, and the energy is the total energy, as printed. A crystal is given by its material, structure and lattice parameter (`Lithium hydride`, `rock salt`, `L = 4.0 Å`), the simulation cell in words (`2×2×2 primitive cells`) with its lattice vectors, one per line, and every nucleus in it, in the same units; the twist (empty for Γ, or fractions of the simulation-cell reciprocal vectors such as `(1/3, 1/3, 0)`); the pseudopotential, if any; clamped or quantum nuclei (with the mass in electron masses); and the energy per primitive cell (with the number of primitive cells in the cell), per atom, or the total. The cell must be neutral. The form stores this description as `system` in the instance entry and derives the key from it (`heg3d-sc-n14-unpol-rs1`, `trap2d-electrons-n6-unpol-w0p28`, `mol-n2-r-2p068-bohr-s0`, `solid-lithium-hydride-rock-salt-l-4p0-a-2x2x2-primitive-cells-gamma`); the checks rebuild the instance from `system` and reject an entry that does not match.

**A result whose instance you cannot define.** Choose *An instance I cannot define* and describe the system completely in words. The record goes to `data/proposals/<arxiv-id>.json` with `benchmark_id: null`; it validates but is never published. A curator adds the definition and moves the row to `data/results/`, exactly as for unmatched results found by the bot.

Only original NQS variational results are accepted. A data release published with a paper, such as the Varbench data of arXiv:2302.04919, counts as that paper's own results; the entry names the file and the commit. If the source uses another operator convention than the instance (Pauli matrices instead of $S=\sigma/2$, for instance), keep the printed numbers and add `convention_factor` to the entry, with the reason in `notes`; the board shows the converted values. Extrapolated energies, projected estimates, non-NQS methods, and numbers quoted from earlier papers are excluded. See the wiki's benchmark-conventions page for details.

## Local checks

```sh
npm ci --ignore-scripts
python3 -m pip install -r requirements.txt
npm test
python3 -m unittest discover -s tests -v
python3 -m nqsbot.build
```

The PR checks run the renderer, data validation, and tests. A failed check must be fixed before merge. Automated success is not scientific approval. Contributors should never add credentials or downloaded paper files to the repository.
