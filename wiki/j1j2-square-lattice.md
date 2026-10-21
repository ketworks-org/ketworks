# J₁–J₂ Heisenberg model on the square lattice

> **In brief.** At $J_2/J_1=0.5$ the classical model is extensively degenerate, the Marshall sign rule fails, quantum Monte Carlo has a sign problem, and the ground state sits in a nonmagnetic region whose nature is still debated. On a $10\times10$ torus there is no exact energy; the best variational energies come from neural quantum states and agree to about $10^{-4}J_1$ per site. This is why the instance is the standard NQS benchmark.

Notation follows the [conventions page](../notation/). This page fixes the conventions of the Ketboard instance `j1j2-square-10x10-pbc-j2-0p5-sz0`, explains why this point of the phase diagram is hard, and summarizes what is known about its energy. Reviewed entries live in [Ketboard](../../#benchmarks?system=j1j2-square-10x10-pbc-j2-0p5-sz0), not here.

## Hamiltonian and instance

$$
H=J_1\sum_{\langle i,j\rangle}\mathbf{S}_i\cdot\mathbf{S}_j+J_2\sum_{\langle\!\langle i,j\rangle\!\rangle}\mathbf{S}_i\cdot\mathbf{S}_j,
\qquad \mathbf{S}_i=\tfrac12\boldsymbol{\sigma}_i,\qquad J_1=1,\quad J_2=0.5 .
$$

- Lattice: $L\times L$ square lattice with $L=10$, $N=100$ sites, periodic in both directions. The first sum runs over the $2N=200$ nearest-neighbour bonds, the second over the $2N=200$ diagonal next-nearest-neighbour bonds; each undirected bond is counted once.
- Operators: spin-$\tfrac12$ operators $\mathbf{S}=\boldsymbol{\sigma}/2$. The same model written with Pauli matrices, $\sum\boldsymbol{\sigma}_i\cdot\boldsymbol{\sigma}_j$, has energies four times larger; a result quoted in that convention must be divided by 4 before comparison. No constant offset.
- Sector: total $S^z=0$. The ground state on an even-by-even torus is a singlet with momentum $\mathbf{k}=0$ and is even under all point-group operations; a calculation restricted to that symmetry sector targets the same state.
- Energy: reported per site, $e=E/N$, in units of $J_1$. The variational energy is a strict upper bound to $e_0$; a finite-sample estimate may fluctuate below it within its error bar.

Four-by-four, six-by-six and $8\times8$ clusters are also common in the literature; they are separate instances. Thermodynamic-limit extrapolations are different quantities and are excluded from Ketboard by construction.

## Why $J_2/J_1=0.5$

**Classical degeneracy.** For classical vectors the Néel state with ordering vector $(\pi,\pi)$ has energy $e=-2J_1S^2+2J_2S^2$ per site, while the collinear stripe states with $(\pi,0)$ or $(0,\pi)$ have $e=-2J_2S^2$. They cross at $J_2=J_1/2$. At that point the Hamiltonian can be rewritten as a sum over the $N$ elementary plaquettes $\square$:

$$
H\Big|_{J_2=J_1/2}=\frac{J_1}{4}\sum_{\square}\Bigl(\sum_{i\in\square}\mathbf{S}_i\Bigr)^2-N J_1S(S+1),
$$

because each nearest-neighbour bond belongs to two plaquettes and each diagonal to one. Every classical configuration with zero total spin on every plaquette is a ground state: the classical degeneracy is extensive, and the spin-wave spectrum has lines of zero modes. Quantum fluctuations must select the ground state from this manifold, which is why neither a semiclassical expansion nor a single product-state starting point is reliable here.

**No Marshall sign rule.** For $J_2=0$ the Marshall rule gives the exact sign of every amplitude, $\operatorname{sgn}\Psi_0(\boldsymbol{\sigma})=(-1)^{N^A_\uparrow(\boldsymbol{\sigma})}$, with $N^A_\uparrow$ the number of up spins on sublattice $A$. The diagonal coupling $J_2$ connects sites of the same sublattice and violates the rule. The violation is small for $J_2/J_1\lesssim0.4$ and grows through the intermediate region; near $0.5$ a substantial weight of the ground state sits on configurations whose sign disagrees with Marshall's (Choo, Neupert, Carleo, arXiv:1903.06713). A positive ansatz multiplied by the Marshall sign is therefore a good starting point and a poor end point, and the quality of a method at this instance is essentially the quality of its sign structure (Szabó and Castelnovo, arXiv:2002.04613; Westerhout et al., arXiv:1907.08186; Bukov, Schmitt, Dupont, arXiv:2011.11214).

**No unbiased reference.** The same frustration gives stochastic series expansion and other world-line quantum Monte Carlo methods a sign problem, so there is no exact $10\times10$ energy. Exact diagonalization stops at $6\times6$. DMRG on a torus must carry the entanglement of a cut of length $2L$, and at $L=10$ its energies lie above the best NQS energies (table below). The instance is a genuine open benchmark: a lower energy is a better upper bound, and nothing else is known with certainty.

## Quantum phase diagram

Néel order is established for $J_2/J_1\lesssim0.45$ and stripe order for $J_2/J_1\gtrsim0.6$, with a nonmagnetic region in between. Whether that region is one phase or two has been debated for two decades. The point $J_2/J_1=0.5$ lies inside it, close to the Néel boundary:

- A gapped $\mathbb Z_2$ spin liquid from SU(2)-blind DMRG on cylinders (Jiang, Yao, Balents, arXiv:1112.2241).
- A gapless $\mathbb Z_2$ spin liquid for $0.45\lesssim J_2/J_1\lesssim0.6$ from Gutzwiller-projected fermionic states with Lanczos steps (Hu, Becca, Parola, Sorella, arXiv:1304.2630).
- A plaquette valence-bond solid for $0.5\lesssim J_2/J_1\lesssim0.61$, with near-critical behaviour at its Néel boundary, from SU(2) DMRG on cylinders up to width 14 (Gong, Zhu, Sheng, Motrunich, Fisher, arXiv:1311.5962).
- A gapless spin liquid for $0.46\lesssim J_2/J_1\lesssim0.52$ from level crossings of excited states on cylinders, followed by a region with many low-lying singlets up to the stripe phase at $\approx0.62$ (Wang and Sandvik, arXiv:1702.08197).
- A Dirac-type nodal spin liquid for $0.49\lesssim J_2/J_1\lesssim0.54$, a valence-bond solid up to $\approx0.61$, then stripe order, from RBM+pair-product states with correlation ratios and level spectroscopy (Nomura and Imada, arXiv:2005.14142, Fig. 1).

For the benchmark the conclusion is the relevant one: at $J_2/J_1=0.5$ the ground state is nonmagnetic, the lowest excitations are close in energy, and candidate ground states of different character are nearly degenerate on a $10\times10$ torus. Energy differences of order $10^{-4}J_1$ per site separate ansätze that describe qualitatively different physics. This is why the reported uncertainty and the energy variance must accompany every entry.

## Known energies for $10\times10$

Energies per site in units of $J_1$. The table is generated when the site is built from every reviewed Ketboard entry for this instance and from the energies of other methods recorded with them, highest first; it changes when an entry is added.

```ketboard
entries
instances: j1j2-square-10x10-pbc-j2-0p5-sz0
```

The DMRG energy on the torus lies above every modern NQS result, a consequence of the entanglement across a cut of length $2L$ on a torus (Gong et al. note truncation errors two orders of magnitude larger on the $10\times10$ torus than on a width-10 cylinder, arXiv:1311.5962, note 65). The exact diagonalization value for $6\times6$, $e_0=-0.503810$ (arXiv:1903.06713, Table I), remains the only exact number for this coupling on a finite torus.

At this level the ranking of methods changes with the number of parameters, the symmetry projection, the number of samples in the final evaluation, and the convention used to quote the uncertainty. Differences within one standard error do not establish a better ansatz; see the [benchmark conventions](../benchmark-conventions/).

## Reporting a result for this instance

1. State the operator convention ($\mathbf{S}$, not $\boldsymbol{\sigma}$), the bond counting, and the boundary conditions. A $10\times10$ torus with the diagonal bonds counted twice is a different instance.
2. State the symmetry sector of the optimized state and whether a projection was applied after optimization. A projected energy is a variational energy of the projected state; quote it as such and name the group.
3. Evaluate the final state with a dedicated run and the [binning analysis](../variational-monte-carlo/); report $e$, one standard error, the number of samples and $\operatorname{Var}(H)/N$.
4. Report the energy of the state you represent. Lanczos-improved states qualify; variance extrapolations, power-method estimates and energies quoted from other papers do not.
5. Give the printed digits exactly as in the paper, with the arXiv version, table and row, through the [Ketboard form](../../#submit).

## References

- P. Chandra, B. Doucot, *Possible spin-liquid state at large S for the frustrated square Heisenberg lattice*, Phys. Rev. B 38, 9335 (1988). The classical degeneracy at $J_2=J_1/2$.
- H.-C. Jiang, H. Yao, L. Balents, *Spin liquid ground state of the spin-1/2 square J₁–J₂ Heisenberg model*, arXiv:1112.2241 (2011). DMRG; gapped spin liquid.
- W.-J. Hu, F. Becca, A. Parola, S. Sorella, *Direct evidence for a gapless Z₂ spin liquid by frustrating Néel antiferromagnetism*, arXiv:1304.2630 (2013). Projected fermionic states with Lanczos steps; the reference variational and extrapolated energies.
- S.-S. Gong, W. Zhu, D. N. Sheng, O. I. Motrunich, M. P. A. Fisher, *Plaquette ordered phase and quantum phase diagram in the spin-1/2 J₁–J₂ square Heisenberg model*, arXiv:1311.5962 (2013). SU(2) DMRG; plaquette valence-bond solid.
- L. Wang, A. W. Sandvik, *Critical level crossings and gapless spin liquid in the square-lattice spin-1/2 J₁–J₂ Heisenberg antiferromagnet*, arXiv:1702.08197 (2017). Level spectroscopy of the intermediate region.
- K. Choo, T. Neupert, G. Carleo, *Study of the two-dimensional frustrated J₁–J₂ model with neural network quantum states*, arXiv:1903.06713 (2019). First NQS study of the model; Marshall-rule violation.
- Y. Nomura, M. Imada, *Dirac-type nodal spin liquid revealed by refined quantum many-body solver using neural-network wave function, correlation ratio, and level spectroscopy*, arXiv:2005.14142 (2020).
- A. Szabó, C. Castelnovo, *Neural network wave functions and the sign problem*, arXiv:2002.04613 (2020).
- T. Westerhout et al., *Neural quantum states of frustrated magnets: generalization and sign structure*, arXiv:1907.08186 (2019).
- M. Bukov, M. Schmitt, M. Dupont, *Learning the ground state of a non-stoquastic quantum Hamiltonian in a rugged neural network landscape*, arXiv:2011.11214 (2020).
- C. Roth, A. Szabó, A. H. MacDonald, *High-accuracy variational Monte Carlo for frustrated magnets with deep neural networks*, arXiv:2211.07749 (2022).
- L. L. Viteritti, R. Rende, F. Becca, *Transformer variational wave functions for frustrated quantum spin systems*, arXiv:2211.05504 (2022).
- A. Chen, M. Heyl, *Empowering deep neural quantum states through efficient optimization*, arXiv:2302.01941 (2023).
- R. Rende, L. L. Viteritti, L. Bardone, F. Becca, S. Goldt, *A simple linear algebra identity to optimize large-scale neural network quantum states*, arXiv:2310.05715 (2023).
- D. Wu et al., *Variational benchmarks for quantum many-body problems*, arXiv:2302.04919 (2023). J₁–J₂ energies and V-scores across methods.
