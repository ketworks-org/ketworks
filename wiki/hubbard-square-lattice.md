# Hubbard model on the square lattice at 1/8 doping

> **In brief.** At $U/t=8$ and filling $n=7/8$ the square-lattice Hubbard model is a doped Mott insulator in the regime most relevant to the cuprates, and the hardest point of the 2015 community benchmark. Its ground state is a filled stripe with wavelength 8 and no superconductivity; all controlled methods agree on $e_\infty=-0.767\pm0.004\,t$, but no exact energy exists for any torus beyond $4\times4$. Determinant and Pfaffian wavefunctions dressed by neural networks now give the lowest variational energies on tori, where DMRG cannot go, and the spread between ansätze on a fixed cluster is a hundred times the statistical error bars.

Notation follows the [conventions page](../notation/). This page fixes the conventions of the Ketboard instances `hubbard-square-8x8-pbc-u8-n56-sz0`, `hubbard-rectangular-Lx4-pbc-u8-nNe-sz0` with $L=8,12,16$, and `hubbard-square-16x16-pbc-u8-n224-sz0`, explains why this point of the phase diagram is hard, and summarizes what is known about its energy. The same clusters with a next-nearest-neighbour hopping have their [own page](../t-tprime-hubbard/). Reviewed entries live in [Ketboard](../../#benchmarks?system=hubbard-rectangular-16x4-pbc-u8-n56-sz0), not here.

## Hamiltonian and instances

$$
H=-t\sum_{\langle i,j\rangle,\sigma}\bigl(c^\dagger_{i\sigma}c_{j\sigma}+\mathrm{h.c.}\bigr)+U\sum_i n_{i\uparrow}n_{i\downarrow},
\qquad t=1,\quad U=8,\quad t'=0 .
$$

- Lattices: $8\times8$ (64 sites), the four-leg tori $8\times4$, $12\times4$ and $16\times4$ ($L$ along $x$ and 4 along $y$), and $16\times16$ (256 sites), periodic in both directions with no twist and no antiperiodic direction. Nearest-neighbour hopping only; each undirected bond counted once per spin.
- Filling: $N_\uparrow=N_\downarrow$ and $N_e=\tfrac78N$, i.e. 14+14 on $8\times4$, 21+21 on $12\times4$, 28+28 on the 64-site clusters and 112+112 on $16\times16$, a hole doping of $\delta=1/8$. On all five tori the noninteracting problem at this filling is open-shell (the Fermi level falls inside a degenerate set of $\mathbf k$ points), so the mean-field determinant from which a fermionic ansatz starts is itself a choice.
- Sector: $S^z=0$ and fixed particle numbers. No momentum or point-group sector is imposed by the instance; a projected or symmetry-restricted calculation must say which sector it targets, since the lowest state of a finite torus need not have zero momentum.
- Energy: reported per *site*, $e=E/N$, in units of $t$. Energies per electron, which differ by the factor $8/7$, must be converted. The variational energy is a strict upper bound to $e_0$.

Cylinders (periodic along $y$, open along $x$), used by DMRG, are different instances; a $16\times4$ cylinder and a $16\times4$ torus are not comparable (Moreno, Carleo, Georges, Stokes, arXiv:2111.10420, Table IV, lists both). Energies per site differ between the tori by up to $0.02\,t$ because of shell effects and because each cluster accommodates different stripe patterns, so results are compared only within one instance.

## Why $U/t=8$ and $n=7/8$

**No unbiased method on tori.** Away from half filling the auxiliary-field quantum Monte Carlo sign problem is severe and the constrained-path approximation is needed; it is accurate but not variational, and its bias is estimated by cross-checks with DMRG on cylinders (Zheng et al., arXiv:1701.00054; Qin et al., arXiv:1910.08931). DMRG itself is limited to cylinders of width 4 to 8. Exact diagonalization stops at $4\times4$. On a torus of 64 sites or more there is no exact energy, and a lower variational energy is the only strict statement available.

**Competing orders within $10^{-2}t$.** The doped Mott insulator has stripe states of different wavelengths, uniform antiferromagnetic states and paired states within about $0.01\,t$ per site of each other (arXiv:1701.00054, Fig. 3). Which state wins on a given cluster depends on whether its wavelength fits: a wavelength-8 filled stripe fits the $8\times8$ torus once, the $16\times4$ torus twice along $x$, and the $16\times16$ torus twice. Pinning fields, mean-field initializations with a chosen unit cell and boundary conditions all select a pattern, and a variational calculation can converge to a metastable stripe (arXiv:2111.10420, Sec. 3B; Sharma et al., arXiv:2510.11710). On the $16\times4$ torus the stripe ground state is well established; on the $8\times8$ torus Sharma et al. find features of a doped Mott insulator with antiferromagnetic correlations and suppressed density fluctuations rather than a clear stripe.

**A fermionic sign structure.** The amplitudes in the occupation-number basis are antisymmetric under particle exchange and have no simple sign rule at finite doping. Every competitive ansatz carries a determinant or a Pfaffian for this reason, and the network corrects the orbitals (backflow, hidden fermions) or multiplies the determinant by a Jastrow factor; see the [fermionic states page](../fermionic-neural-states/). The accuracy of an entry is therefore the accuracy of its orbital correction, and the open-shell starting point makes the optimization landscape rugged.

## What is known

- **Filled stripes, no superconductivity.** Combining DMRG, AFQMC, DMET and iPEPS, Zheng et al. found a vertical stripe of wavelength 8 (one hole per unit length of the stripe, "filled") as the ground state at $U/t=8$, $\delta=1/8$, with the wavelength-5 to wavelength-10 stripes within $0.01\,t$ per site and all methods agreeing on an energy in the range $-0.767\pm0.004\,t$ (arXiv:1701.00054). Qin et al. established with AFQMC and DMRG that the pure model has no superconducting long-range order at intermediate to strong coupling near optimal doping (arXiv:1910.08931).
- **The 2015 benchmark.** LeBlanc et al. tabulate thermodynamic-limit energies at $U/t=8$, $n=0.875$: AFQMC $-0.766(1)$, DMRG $-0.759(4)$, fixed-node $-0.749(2)$, and DMET $-0.749(7)$ with the caveat that different clusters show different orders (arXiv:1505.02290, Table V). These are the reference numbers behind every "relative error" quoted on this instance; none of them is a finite-torus energy.
- **Large tori with neural networks.** Convolutional backflow states reach $32\times32$ at this doping and find horizontal and vertical filled stripes degenerate within their resolution (Gu et al., arXiv:2604.25775); hidden-fermion Pfaffian states on $16\times16$ find the filled stripe $0.011\,t$ per site below the half-filled stripe with pairing at $t'=0$ (Roth, Chen, Sengupta, Georges, arXiv:2511.07566, Table V); tensor backflow on $16\times16$ finds the linear stripe from an unrestricted Hartree–Fock start (Liang, arXiv:2507.01856).

## Known energies

Energies per site in units of $t$, with the source of each number. Ketboard entries carry the arXiv version and the exact printed token; no uncertainty means none was printed.

**$16\times4$ torus, 28+28 electrons.** The DMRG reference for the $\infty\times4$ cylinder, $-0.7659(4\times10^{-5})$, is quoted by Luo and Clark (arXiv:1807.10770, Fig. 2) and is not a torus energy.

| Method | $e$ | Source |
| --- | --- | --- |
| Hidden-fermion determinant state, 16 hidden fermions | $-0.753(2)$ | Moreno et al., arXiv:2111.10420, Table IV |
| Tensor backflow, one Lanczos step | $-0.7597$, $-0.7618$ | Zhou, Zhou, Liang, arXiv:2308.11823, Table III, two backflow forms |
| Deep neural backflow with low-rank multi-determinant updates | $-0.7598$; $-0.7622$ with one Lanczos step | Huang, Ou, Ozolins, arXiv:2609.26544, p. 6 |
| MLP neural backflow, single determinant, 8192 hidden units | $-0.76258(1)$ | Loehr and Clark, arXiv:2510.26906, p. 3 |
| Transformer neural backflow | $-0.76298$ | Gu et al., arXiv:2507.02644, p. 31 |
| MLP neural backflow, four determinants from optimized symmetries | $-0.76340(2)$ | Loehr and Clark, arXiv:2510.26906, p. 5 |
| Hidden-fermion Pfaffian state, group-convolutional backbone | $-0.76413(3)$ | Chen, Wan, Sengupta, Georges, Roth, arXiv:2507.10705, Table IV |
| MLP neural backflow, 32 determinants from optimized symmetries | $-0.76486(2)$ | Loehr and Clark, arXiv:2510.26906, p. 5 |
| Same state projected onto the fully symmetric sector | $-0.76560(1)$ | Loehr and Clark, arXiv:2510.26906, p. 5 |

**$8\times4$ torus, 14+14 electrons.**

| Method | $e$ | Source |
| --- | --- | --- |
| Tensor backflow, one Lanczos step | $-0.7591$, $-0.7633$ | Zhou, Zhou, Liang, arXiv:2308.11823, Table III, two backflow forms |
| Hidden-fermion determinant state | $-0.7633(7)$ | Moreno et al., arXiv:2111.10420, Table IV |
| Deep neural backflow | $-0.7659$; $-0.7671$ with one Lanczos step | Huang, Ou, Ozolins, arXiv:2609.26544, p. 6 |
| Hidden-fermion Pfaffian state | $-0.76690(1)$ | Chen et al., arXiv:2507.10705, Table IV |
| MLP neural backflow, fully symmetrized, 128 determinants | $-0.768337(2)$ | Loehr and Clark, arXiv:2510.26906, p. 6 |

**$12\times4$ torus, 21+21 electrons.**

| Method | $e$ | Source |
| --- | --- | --- |
| Tensor backflow, one Lanczos step | $-0.7608$, $-0.7636$ | Zhou, Zhou, Liang, arXiv:2308.11823, Table III, two backflow forms |
| Deep neural backflow | $-0.7640$; $-0.7662$ with one Lanczos step | Huang, Ou, Ozolins, arXiv:2609.26544, p. 6 |
| Hidden-fermion Pfaffian state | $-0.76608(1)$ | Chen et al., arXiv:2507.10705, Table IV |

**$8\times8$ torus, 28+28 electrons.** All from Sharma et al., arXiv:2510.11710, Appendix E, Table I.

| Method | $e$ |
| --- | --- |
| Hidden-fermion determinant state, ViT backbone | $-0.736(1)$ |
| Jastrow–backflow determinant, ViT backbone | $-0.7422(3)$ |
| Hidden-fermion determinant state | $-0.7454(9)$ |
| Jastrow–backflow determinant | $-0.7458(6)$ |

**$16\times16$ torus, 112+112 electrons.**

| Method | $e$ | Source |
| --- | --- | --- |
| Hidden-fermion Pfaffian, half-filled stripe with pairing | $-0.7401(1)$ | Roth et al., arXiv:2511.07566, Table V |
| Tensor backflow, $p=0$ | $-0.7509$ | Liang, arXiv:2507.01856, Table I |
| Hidden-fermion Pfaffian, filled stripe | $-0.7515(1)$ | Roth et al., arXiv:2511.07566, Table V |
| Sparse convolutional backflow (SCALE) | $-0.7529$ | Gu et al., arXiv:2604.25775, Table I |
| Tensor backflow, one Lanczos step | $-0.7552$ | Liang, arXiv:2507.01856, Table I |
| Deep convolutional backflow (ACE) | $-0.7573$ | Gu et al., arXiv:2604.25775, Table I |

Three observations follow. On a fixed cluster the ansätze differ by up to $10^{-2}t$ per site while the printed error bars are $10^{-4}t$ or smaller, so the ranking is informative here in a way it is not for the [J₁–J₂ instance](../j1j2-square-lattice/). The four-leg series is not monotonic in $L$: for every ansatz that reports all three, the $8\times4$ energy lies below the $12\times4$ energy, which lies below the $16\times4$ energy, a shell effect of the four-leg torus rather than a loss of accuracy; the Loehr–Clark $8\times4$ state sits $8\times10^{-5}$ above their own variance-extrapolated estimate, so that cluster is essentially solved. And the best $16\times16$ energy is $0.01\,t$ above the thermodynamic-limit range; the finite-size correction and the variational error are of the same order and cannot be separated without a size series at fixed ansatz.

## Reporting a result for this instance

1. State the boundary conditions in both directions (periodic, antiperiodic, or twisted), the orientation of a rectangular cluster, and the sign of the hopping. A $16\times4$ cylinder, a $4\times16$ torus and a $16\times4$ torus are three different things; only the last two are the same instance.
2. State $N_\uparrow$ and $N_\downarrow$ and the energy normalization (per site, not per electron).
3. State the mean-field starting point, any pinning field, and the stripe pattern the state converged to (wavelength and orientation). The reported energy must be that of $H$ alone, with every pinning field switched off in the final evaluation.
4. State the symmetry sector and whether a projection was applied after optimization. A Lanczos step is a variational improvement and qualifies; diffusion Monte Carlo, variance extrapolation and energies quoted from other papers do not.
5. Evaluate the final state with a dedicated run and the [binning analysis](../variational-monte-carlo/); report $e$, one standard error, the number of samples and $\operatorname{Var}(H)/N$.
6. Give the printed digits exactly as in the paper, with the arXiv version, table and row, through the [Ketboard form](../../#submit).

## References

- J. P. F. LeBlanc et al., *Solutions of the two-dimensional Hubbard model: benchmarks and results from a wide range of numerical algorithms*, arXiv:1505.02290 (2015). The community benchmark; thermodynamic-limit energies at $U/t=8$, $n=0.875$.
- B.-X. Zheng et al., *Stripe order in the underdoped region of the two-dimensional Hubbard model*, arXiv:1701.00054 (2016). Filled stripes of wavelength 8; the $-0.767\pm0.004\,t$ energy range.
- M. Qin et al., *Absence of superconductivity in the pure two-dimensional Hubbard model*, arXiv:1910.08931 (2019).
- D. Luo, B. K. Clark, *Backflow transformations via neural networks for quantum many-body wave functions*, arXiv:1807.10770 (2018). Neural backflow; the first NQS results on $L\times4$ Hubbard clusters at this doping.
- J. R. Moreno, G. Carleo, A. Georges, J. Stokes, *Fermionic wave functions from neural-network constrained hidden states*, arXiv:2111.10420 (2021). Hidden-fermion determinant states; $4\times L$ tori and cylinders.
- Y.-T. Zhou, Z.-W. Zhou, X. Liang, *Solving Fermi-Hubbard-type models by tensor representations of backflow corrections*, arXiv:2308.11823 (2023).
- X. Liang, *Investigating the Fermi-Hubbard model by the tensor-backflow method*, arXiv:2507.01856 (2025). $16\times16$ tori at $t'=0$ and $t'=-0.2$.
- Y. Gu et al., *Solving the Hubbard model with neural quantum states*, arXiv:2507.02644 (2025). Transformer neural backflow.
- A. Chen, Z.-Q. Wan, A. Sengupta, A. Georges, C. Roth, *Neural network-augmented Pfaffian wave-functions for scalable simulations of interacting fermions*, arXiv:2507.10705 (2025). Hidden-fermion Pfaffian states; the $L\times4$ series.
- L. Sharma, A. Shokry, R. Nutakki, O. Simard, M. Ferrero, F. Vicentini, *Comparing symmetrized determinant neural quantum states for the Hubbard model*, arXiv:2510.11710 (2025). Hidden-fermion versus Jastrow–backflow determinants with transformer backbones; $8\times8$ torus.
- K. Loehr, B. K. Clark, *Enhancing neural network backflow*, arXiv:2510.26906 (2025). Multi-determinant backflow from symmetry projection and Lanczos steps.
- C. Roth, A. Chen, A. Sengupta, A. Georges, *Superconductivity in the two-dimensional Hubbard model revealed by neural quantum states*, arXiv:2511.07566 (2025). Hidden-fermion Pfaffians on $16\times16$; filled versus half-filled stripes as a function of $t'$.
- Y. Gu et al., *Pareto frontier of neural quantum states: scalable, affordable, and accurate convolutional backflow for strongly correlated lattice fermions*, arXiv:2604.25775 (2026). SCALE and ACE convolutional backflow; tori up to $32\times32$.
- T. Huang, X. Ou, V. Ozolins, *Neural network backflow with low-rank multi-determinant updates*, arXiv:2609.26544 (2026).
