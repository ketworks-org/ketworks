# t–t′ Hubbard model at t′/t = −0.2 and 1/8 doping

> **In brief.** A next-nearest-neighbour hopping $t'=-0.2t$ breaks particle-hole symmetry and brings the square-lattice Hubbard model closer to the cuprate band structure. At $U/t=8$ and $\delta=1/8$ the controlled methods find superconductivity coexisting with partially filled stripes, and neural quantum states have carried the question to tori of 576 sites. On these clusters the variational energies of different ansätze differ at the $10^{-2}t$ level, states with nearly equal energies have qualitatively different correlations, and the symmetry breaking built into an ansatz decides what it finds. This is the active frontier of fermionic NQS.

Notation follows the [conventions page](../notation/). This page fixes the conventions of the Ketboard instances `hubbard-square-LxL-pbc-u8-tp-0p2-nNe-sz0` with $L=8,12,16,20,24$, explains what changes with respect to the [pure model](../hubbard-square-lattice/), and summarizes what is known about the energy. Reviewed entries live in [Ketboard](../../#benchmarks?system=hubbard-square-16x16-pbc-u8-tp-0p2-n224-sz0), not here.

## Hamiltonian and instances

$$
H=-t\sum_{\langle i,j\rangle,\sigma}\bigl(c^\dagger_{i\sigma}c_{j\sigma}+\mathrm{h.c.}\bigr)
-t'\sum_{\langle\!\langle i,j\rangle\!\rangle,\sigma}\bigl(c^\dagger_{i\sigma}c_{j\sigma}+\mathrm{h.c.}\bigr)
+U\sum_i n_{i\uparrow}n_{i\downarrow},
\qquad t=1,\quad t'=-0.2,\quad U=8 .
$$

- Sign convention: with $t'=-0.2t$ the matrix element of $H$ on each diagonal bond is $-t'=+0.2t$. Papers that write $+t'\sum$ with $t'=0.2$ describe the same Hamiltonian; the physical statement is that the diagonal and nearest-neighbour hopping matrix elements have opposite signs, the hole-doped cuprate case. A calculation with the other sign is the electron-doped model and a different instance.
- Lattices: $L\times L$ square tori, periodic in both directions, for $L=8,12,16,20,24$; nearest-neighbour and diagonal bonds each counted once per spin.
- Filling: $N_\uparrow=N_\downarrow=\tfrac{7}{16}N$, i.e. $28+28$, $63+63$, $112+112$, $175+175$ and $252+252$ electrons, a hole doping of $\delta=1/8$ on every cluster. At $t'=-0.2$ the noninteracting problem is closed-shell on $12\times12$ and $20\times20$ and open-shell on $8\times8$, $16\times16$ and $24\times24$; the mean-field starting point is a choice on the open-shell clusters.
- Sector: $S^z=0$ and fixed particle numbers; no momentum sector imposed. Energy per site in units of $t$; variational upper bound.

## What $t'$ changes

**The Fermi surface and the stripe filling.** The diagonal hopping shifts the van Hove singularity and removes the nesting of the half-filled square lattice. At $t'=0$ the doped model forms filled stripes (one hole per unit length, wavelength 8 at $\delta=1/8$) and does not superconduct; at $t'=-0.2$ the stripes become partially filled and coexist with $d$-wave pairing (Xu et al., arXiv:2303.08376). The two kinds of stripe are separated by about $10^{-2}t$ per site on a $16\times16$ torus, and the sign of the difference flips between $t'=0$ and $t'=-0.2$ (Roth, Chen, Sengupta, Georges, arXiv:2511.07566, Table V):

| $t'$ | Filled stripe | Half-filled stripe with pairing |
| --- | --- | --- |
| $0$ | $-0.7515(1)$ | $-0.7401(1)$ |
| $-0.1$ | $-0.7367(1)$ | $-0.7370(1)$ |
| $-0.2$ | $-0.7261(1)$ | $-0.7360(1)$ |

**Variational bias.** Because the competing states are close in energy and differ in symmetry breaking, what an ansatz converges to depends on what it can represent at the mean-field level. On the $8\times8$ torus three transformer-backflow states (a Slater determinant, its particle-hole transform, and a Pfaffian) reach energies within $10^{-3}t$ of one another yet show different spin, charge and pairing correlations; the determinant overestimates stripe order and underestimates pairing, the particle-hole determinant the reverse, and only after symmetry restoration and variance reduction do all three converge to coexisting superconducting and stripe order (Viteritti, Rende, Roth, Sengupta, Carleo, Georges, arXiv:2604.21978). The practical consequence for Ketboard is that an energy alone does not identify the phase, and that the symmetry projection applied to a state is part of its definition: on $8\times8$ the projections onto translations and onto translations plus rotations lower the energy by $3$ to $5\times10^{-3}t$, more than the differences between the three ansätze.

**Symmetry breaking in the ansatz.** Pinning fields, block-circulant mean-field orbitals and chosen unit cells guide an optimization into a stripe of a given wavelength and can trap it there. The symmetry-preserving backflow pairing state keeps translation invariance by construction, with a pairing matrix whose dependence on the relative displacement is explicit, and reaches energies below the pure stripe solutions on the same clusters up to $24\times24$ (Rende, Viteritti, Georges, arXiv:2608.12465). Tensor backflow without symmetry enforcement, started from unrestricted Hartree–Fock, reaches energies within $4.4\times10^{-3}$ relative of the symmetry-preserving state on $16\times16$ after one Lanczos step (Liang, arXiv:2609.22618).

**Superconductivity.** The DMRG and AFQMC study of Xu et al. finds superconducting order coexisting with stripes of filling 0.6 to 0.8 on the hole-doped side (arXiv:2303.08376). The hidden-fermion Pfaffian study finds the paired half-filled stripe favoured for $\lvert t'\rvert>0.1$ (arXiv:2511.07566). The symmetry-preserving backflow pairing study extrapolates the $d$-wave order parameter from $12\times12$ to $24\times24$ to a finite thermodynamic-limit value (arXiv:2608.12465). The tensor-backflow study sees enhanced $d$-wave pair fluctuations on $12\times12$ and $16\times16$ but no single eigenvalue of the pair density matrix scaling extensively (arXiv:2609.22618). The energies below are the quantitative basis of this discussion: a state that is lower in energy and has pairing is stronger evidence than one that is higher.

## Known energies

Energies per site in units of $t$, with the source of each number. Ketboard entries carry the arXiv version and the exact printed token; no uncertainty means none was printed or the table states that it is below the last digit.

**$8\times8$ torus, 28+28 electrons.**

| Method | Symmetry | $e$ | Source |
| --- | --- | --- | --- |
| Tensor backflow, $p=0$ | none | $-0.7374(4)$ | Liang, arXiv:2609.22618, Table II |
| Tensor backflow, $p=0$ | $T+R$ | $-0.7395(4)$ | Liang, arXiv:2609.22618, Table II |
| Tensor backflow, one Lanczos step | none | $-0.7424(3)$ | Liang, arXiv:2609.22618, Table II |
| Tensor backflow, one Lanczos step | $T+R$ | $-0.7441(8)$ | Liang, arXiv:2609.22618, Table II |
| Transformer backflow, Slater determinant | none / $T$ / $T+R$ | $-0.74512(1)$ / $-0.74834(1)$ / $-0.74993(1)$ | Viteritti et al., arXiv:2604.21978, Table I |
| Transformer backflow, particle-hole determinant | none / $T$ / $T+R$ | $-0.74649(1)$ / $-0.74934(1)$ / $-0.75026(1)$ | Viteritti et al., arXiv:2604.21978, Table I |
| Transformer backflow, Pfaffian | none / $T$ / $T+R$ | $-0.74705(1)$ / $-0.74952(1)$ / $-0.75058(1)$ | Viteritti et al., arXiv:2604.21978, Table I |

**$12\times12$ to $24\times24$ tori.**

| $L$ | Method | $e$ | Source |
| --- | --- | --- | --- |
| 12 | Symmetry-preserving backflow pairing | $-0.74425(1)$ | Rende, Viteritti, Georges, arXiv:2608.12465, Table I |
| 16 | Hidden-fermion Pfaffian, filled stripe | $-0.7261(1)$ | Roth et al., arXiv:2511.07566, Table V |
| 16 | Hidden-fermion Pfaffian, half-filled stripe with pairing | $-0.7360(1)$ | Roth et al., arXiv:2511.07566, Table V |
| 16 | Tensor backflow, pinning field, $p=0$ | $-0.7360(7)$ | Liang, arXiv:2609.22618, Table III |
| 16 | Sparse convolutional backflow (SCALE) | $-0.7373$ | Gu et al., arXiv:2604.25775, Table I |
| 16 | Tensor backflow, pinning field, one Lanczos step | $-0.7408(1)$ | Liang, arXiv:2609.22618, Table III |
| 16 | Deep convolutional backflow (ACE) | $-0.7430$ | Gu et al., arXiv:2604.25775, Table I |
| 16 | Symmetry-preserving backflow pairing | $-0.74411(1)$ | Rende, Viteritti, Georges, arXiv:2608.12465, Table I |
| 20 | Symmetry-preserving backflow pairing | $-0.74382(1)$ | Rende, Viteritti, Georges, arXiv:2608.12465, Table I |
| 24 | Symmetry-preserving backflow pairing | $-0.74397(1)$ | Rende, Viteritti, Georges, arXiv:2608.12465, Table I |

Three observations follow. On $16\times16$ the spread between ansätze is $1.8\times10^{-2}t$ per site, two orders of magnitude above the error bars; the instance discriminates between methods. The $8\times8$ torus sits far from the larger clusters ($-0.7506$ against $-0.744$) because of its shell structure, while the $12\times12$ to $24\times24$ energies of a single ansatz agree within $5\times10^{-4}t$, so the thermodynamic-limit energy of the model at this point is about $-0.744\,t$ with a variational error that cannot yet be separated from the finite-size trend. And the lowest energies on the large tori come from the state that keeps translation symmetry, not from a state with a stripe built in, which is the quantitative content of the "variational bias" argument.

## Reporting a result for this instance

1. State the sign convention for $t'$ explicitly, by writing the Hamiltonian or by stating that the diagonal hopping matrix element is $+0.2t$. A result for $t'=+0.2$ in the convention above is the electron-doped model and does not belong here.
2. State the boundary conditions in both directions, $N_\uparrow$ and $N_\downarrow$, and the energy normalization (per site).
3. State the mean-field starting point, any pinning field or imposed unit cell, and the pattern the state converged to (stripe wavelength and filling, or uniform). The reported energy must be that of $H$ alone.
4. State the symmetry projection, if any, as a separate number: an unprojected and a projected energy are two entries of the same paper.
5. Evaluate the final state with a dedicated run and the [binning analysis](../variational-monte-carlo/); report $e$, one standard error, the number of samples and $\operatorname{Var}(H)/N$. A Lanczos step qualifies; variance extrapolation does not.
6. Give the printed digits exactly as in the paper, with the arXiv version, table and row, through the [Ketboard form](../../#submit).

## References

- H. Xu, C.-M. Chung, M. Qin, U. Schollwöck, S. R. White, S. Zhang, *Coexistence of superconductivity with partially filled stripes in the Hubbard model*, arXiv:2303.08376 (2023). DMRG and AFQMC; the reference picture at $t'=-0.2$.
- B.-X. Zheng et al., *Stripe order in the underdoped region of the two-dimensional Hubbard model*, arXiv:1701.00054 (2016). Filled stripes at $t'=0$, for contrast.
- C. Roth, A. Chen, A. Sengupta, A. Georges, *Superconductivity in the two-dimensional Hubbard model revealed by neural quantum states*, arXiv:2511.07566 (2025). Hidden-fermion Pfaffians; filled versus half-filled stripes with pairing as a function of $t'$ on $16\times16$.
- L. L. Viteritti, R. Rende, C. Roth, A. Sengupta, G. Carleo, A. Georges, *Beyond variational bias: resolving intertwined orders in the Hubbard model*, arXiv:2604.21978 (2026). Three transformer-backflow ansätze on $8\times8$; symmetry restoration and variance reduction.
- Y. Gu et al., *Pareto frontier of neural quantum states: scalable, affordable, and accurate convolutional backflow for strongly correlated lattice fermions*, arXiv:2604.25775 (2026). SCALE and ACE on $16\times16$.
- R. Rende, L. L. Viteritti, A. Georges, *Superconductivity in the t–t′ Hubbard model from symmetry-preserving neural-network quantum states*, arXiv:2608.12465 (2026). Symmetry-preserving backflow pairing; tori up to $24\times24$; extrapolated $d$-wave order.
- X. Liang, *Probing d-wave pairing in the t–t′–U Hubbard model with tensor-backflow wave functions*, arXiv:2609.22618 (2026). Tensor backflow with symmetry projection and Lanczos step on $8\times8$, $12\times12$, $16\times16$.
- X. Liang, *Investigating the Fermi-Hubbard model by the tensor-backflow method*, arXiv:2507.01856 (2025). Tensor backflow at $t'=0$ and $t'=-0.2$ on tori up to 256 sites.
- J. P. F. LeBlanc et al., *Solutions of the two-dimensional Hubbard model: benchmarks and results from a wide range of numerical algorithms*, arXiv:1505.02290 (2015). The $t'=0$ benchmark that these instances extend.
