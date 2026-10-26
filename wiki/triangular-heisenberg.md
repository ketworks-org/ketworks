# Heisenberg antiferromagnet on the triangular lattice

> **In brief.** The nearest-neighbour Heisenberg antiferromagnet on the triangular lattice is the original frustrated magnet. Its ground state has three-sublattice $120^\circ$ order with an ordered moment well below the classical value, but the lattice is not bipartite: there is no Marshall sign rule, quantum Monte Carlo has a sign problem, and exact diagonalization stops at 36 sites. The Ketboard series of $L\times L$ tori from $6\times6$ to $42\times42$ tests whether an ansatz keeps its accuracy as the system grows. The thermodynamic-limit energy per site is now known to about $10^{-4}J$, $e_\infty\approx-0.5517$, from neural quantum states and infinite PEPS.

Notation follows the [conventions page](../notation/). This page fixes the conventions of the Ketboard instances `heisenberg-triangular-LxL-pbc-sz0` with $L=6,12,18,24,30,42$, explains why the model is hard, and summarizes what is known about its energy and its order parameter. Reviewed entries live in [Ketboard](../../#benchmarks?system=heisenberg-triangular-6x6-pbc-sz0), not here.

## Hamiltonian and instances

$$
H=J\sum_{\langle i,j\rangle}\mathbf{S}_i\cdot\mathbf{S}_j,\qquad \mathbf{S}_i=\tfrac12\boldsymbol{\sigma}_i,\qquad J=1 .
$$

- Lattice: $L\times L$ triangular Bravais lattice spanned by $\mathbf a_1=(1,0)$ and $\mathbf a_2=(\tfrac12,\tfrac{\sqrt3}{2})$, sites $\mathbf r=n_1\mathbf a_1+n_2\mathbf a_2$ with $0\le n_1,n_2<L$, periodic along both primitive vectors. The sum runs over the $3N$ nearest-neighbour bonds along $\mathbf a_1$, $\mathbf a_2$ and $\mathbf a_1-\mathbf a_2$, each undirected bond counted once. Each site has six neighbours and belongs to six triangles.
- Commensurability: $L$ must be a multiple of 3 for the three-sublattice $120^\circ$ pattern to fit the torus (Viteritti, Rende, Sachdev, Carleo, arXiv:2602.02665, Sec. III). The Ketboard instances have $L$ a multiple of 6, so that $N=L^2$ is even and the $S^z=0$ sector exists.
- Operators: spin-$\tfrac12$ operators $\mathbf S=\boldsymbol\sigma/2$. Pauli-matrix energies are four times larger. The varbench instance `triangular_36_P` lists the exact diagonalization total energy $-80.6937689612426$ in the Pauli convention; divided by $4\times36$ it is the $e_0=-0.5603734$ per site of the $6\times6$ instance (Wu et al., arXiv:2302.04919).
- Sector: total $S^z=0$. The ground state is a singlet. On the torus the $120^\circ$ order shows up as the Anderson tower of states: low-lying levels at momenta $\mathbf 0$ and $\pm\mathbf K$ whose energies collapse onto the ground state as $S(S+1)/N$ (Bernu, Lhuillier, Pierre, Phys. Rev. Lett. 69, 2590 (1992)).
- Energy: reported per site, $e=E/N$, in units of $J$. The variational energy is a strict upper bound to $e_0(L)$.

Other cluster shapes appear in the literature: the 36-site cluster of exact diagonalization is this $6\times6$ rhombus, but 108-site clusters, cylinders for DMRG, and clusters with open boundaries are different instances and are not compared with the tori.

## Why the triangular lattice

**Frustration without a sign rule.** Three antiparallel spins cannot sit on one triangle, so the classical ground state is the coplanar $120^\circ$ state, with energy $e=-\tfrac32JS^2$ per site. On a bipartite lattice the Marshall rule gives the sign of every ground-state amplitude in the $S^z$ basis; on the triangular lattice no such rule exists. The usual remedy is the three-sublattice rotation $U_{\mathrm{tri}}$, a rotation of the spins on two sublattices by $\pm2\pi/3$ about the $z$ axis, which turns the classical $120^\circ$ state into a ferromagnet and makes the dominant off-diagonal matrix elements negative. It is a unitary transformation, so the energy is unchanged and an ansatz may be defined in either basis. The remaining off-diagonal elements keep both signs, and the ground-state sign structure in the rotated basis is not reproduced by any local rule: the analysis of the optimized transformer wavefunction in arXiv:2602.02665 (Sec. V C) indicates a genuinely non-local sign structure. Anderson's resonating-valence-bond proposal (1973) was made for exactly this model, and the question whether quantum fluctuations destroy the order was open until the Green's function Monte Carlo study of Capriotti, Trumper and Sorella (arXiv:cond-mat/9901068).

**No unbiased method at large size.** World-line quantum Monte Carlo has a sign problem on any non-bipartite lattice. Green's function Monte Carlo needs a guiding function and a fixed-node or stochastic-reconfiguration constraint. DMRG on cylinders handles widths up to about 9 and must extrapolate in width and in truncation error (White and Chernyshev, arXiv:0705.2746; Huang, Qian, Qin, arXiv:2310.11774). Infinite PEPS works directly in the thermodynamic limit but must extrapolate in the bond dimension (Hasik and Corboz, arXiv:2311.05534; Naumann, Eisert, Schmoll, arXiv:2510.04907). The exact finite-torus energy is known only for $L=6$.

**The size series.** For an ordered antiferromagnet the finite-size energy on a torus behaves as $e(L)=e_\infty-c/L^3+\dots$, with the correction set by the spin-wave velocity, and the order parameter as $M(L)=M_0+a/L+\dots$ (Bernu et al., arXiv:cond-mat/9407028; Capriotti et al., arXiv:cond-mat/9901068). A controlled extrapolation needs several clusters with $L\gtrsim18$, which is why Ketboard lists the whole series rather than one size. The difficulty is size-consistent accuracy: most ansätze lose accuracy as $L$ grows, and an error that grows with $L$ biases both $e_\infty$ and $M_0$ (arXiv:2602.02665, Fig. 2b).

## Ground-state properties

Every controlled method finds $120^\circ$ long-range order; the debate is about how much of the classical moment survives. Estimates of the sublattice magnetization $M_0$ in the thermodynamic limit, normalized so that the classical value is $\tfrac12$:

| Method | $M_0$ | Source |
| --- | --- | --- |
| Spin-wave theory to second order in $1/S$ | $0.2497$ | Miyake (1992); Chernyshev and Zhitomirsky, arXiv:0901.4803, Eq. (53) |
| Green's function Monte Carlo + SR | $0.205(10)$ | Capriotti, Trumper, Sorella, arXiv:cond-mat/9901068 |
| Series expansion | $0.19(2)$ | Zheng et al., arXiv:cond-mat/0608008 |
| DMRG on cylinders | $0.205(15)$ | White and Chernyshev, arXiv:0705.2746 |
| DMRG on cylinders | $0.208(8)$ | Huang, Qian, Qin, arXiv:2310.11774 |
| iPEPS | $0.178(2)$, $0.159(6)$ | Hasik and Corboz, arXiv:2311.05534, two extrapolations, as tabulated in arXiv:2505.20406, Table VI |
| RNN wavefunction, tori up to $30\times30$ | $0.192(2)$, $0.198(2)$ | Moss et al., arXiv:2505.20406, two estimators |
| Transformer wavefunction, tori up to $42\times42$ | $0.148(1)$ | Viteritti et al., arXiv:2602.02665 |

The spread is larger than the error bars because the estimators differ: $M^2$ from the structure factor at $\mathbf K$, correlation functions at maximal distance, or a pinned moment in iPEPS, extrapolated with different finite-size forms. The transformer study argues that less accurate variational states systematically overestimate the order, which would explain why the lowest value comes from the lowest energies (arXiv:2602.02665). A variational energy bounds $e_0$; a variational magnetization bounds nothing, and this is the second reason the energy series matters.

Adding a next-nearest-neighbour coupling $J_2$ suppresses the order and opens a nonmagnetic region around $J_2/J_1\approx1/8$ whose nature is debated (Kaneko, Morita, Imada, arXiv:1407.0318; Iqbal et al., arXiv:1601.06018). The $6\times6$ cluster at $J_2=J_1/8$ is a common secondary test (Roth, Szabó, MacDonald, arXiv:2211.07749, Table III); it is not a Ketboard instance.

## Known energies

Energies per site in units of $J$. The tables are generated when the site is built from the reviewed Ketboard entries and from the energies of other methods recorded with them; they change when an entry is added.

**$6\times6$, 36 sites.** The exact energy is from exact diagonalization (Bernu, Lecheminant, Lhuillier, Pierre, arXiv:cond-mat/9407028).

```ketboard
entries
instances: heisenberg-triangular-6x6-pbc-sz0
```

**Larger tori.** The lowest neural energy on each torus against the lowest energy of another variational method. Moss et al. show their recurrent-network energies for $L\ge12$ only in figures; the Ketboard entries for these sizes are taken from the authors' data release. Viteritti et al. tabulate the same energies for $L=18$, $24$ and $30$ with smaller error bars, $-0.54861(1)$, $-0.54810(1)$ and $-0.54793(1)$ (arXiv:2602.02665, Table I).

```ketboard
summary
instances: heisenberg-triangular-12x12-pbc-sz0 heisenberg-triangular-18x18-pbc-sz0 heisenberg-triangular-24x24-pbc-sz0 heisenberg-triangular-30x30-pbc-sz0 heisenberg-triangular-42x42-pbc-sz0
row: size
```

**Thermodynamic limit.** These are extrapolations, not variational energies, and are excluded from Ketboard; they are the yardstick for the series above.

| Method | $e_\infty$ | Source |
| --- | --- | --- |
| Green's function Monte Carlo + SR | $-0.5458(1)$ | Capriotti, Trumper, Sorella, arXiv:cond-mat/9901068 |
| Series expansion | $-0.5502(4)$ | Zheng et al., arXiv:cond-mat/0608008 |
| DMRG on cylinders | $-0.5503(8)$ | Huang, Qian, Qin, arXiv:2310.11774 |
| iPEPS, extrapolated in bond dimension | $-0.55161(6)$ | Hasik and Corboz, arXiv:2311.05534 |
| RNN, zero-variance extrapolation of tori up to $30\times30$ | $-0.5517569(9)$ | Moss et al., arXiv:2505.20406 |
| Transformer, zero-variance extrapolation of tori up to $42\times42$ | $-0.55168(2)$ | Viteritti et al., arXiv:2602.02665 |

On the $6\times6$ torus the best network energies are close to the exact value, so that instance mainly tests the symmetry construction.

The large tori separate the ansätze. In the comparison of Viteritti et al., their transformer lies $3.1\times10^{-3}$ below the recurrent network of Moss et al. at $L=18$ and $3.6\times10^{-3}$ below it at $L=30$, so the two states diverge with size.

Finite-size energies lie below the thermodynamic value, as the $-c/L^3$ correction requires, so on a large torus a variational energy above $e_\infty$ measures a variational error at least as large as the distance. The $42\times42$ transformer energy of Viteritti et al. is $2.5\times10^{-4}$ above the extrapolated $e_\infty$, consistent with the relative error of about $5\times10^{-4}$ from their own variance extrapolation.

## Reporting a result for this instance

1. State the cluster: $L\times L$ rhombus with periodic boundaries along both primitive vectors, bond counting, and the operator convention ($\mathbf S$, not $\boldsymbol\sigma$). A $36$-site cluster of a different shape is a different instance.
2. State the basis. An ansatz defined after the three-sublattice rotation $U_{\mathrm{tri}}$ targets the same energy; say so, and say which sublattices were rotated.
3. State the symmetry sector and whether translations or $C_{6v}$ were restored by projection after optimization. A projected energy is the energy of the projected state; quote it as such and give both numbers if both were measured.
4. Evaluate the final state with a dedicated run and the [binning analysis](../variational-monte-carlo/); report $e$, one standard error, the number of samples and $\operatorname{Var}(H)/N$.
5. Report the energy of the state you represent. Zero-variance extrapolations and thermodynamic-limit estimates are context, not entries.
6. Give the printed digits exactly as in the paper, with the arXiv version, table and row, through the [Ketboard form](../../#submit).

## References

- P. W. Anderson, *Resonating valence bonds: a new kind of insulator?*, Mater. Res. Bull. 8, 153 (1973). The RVB proposal, made for this model.
- B. Bernu, C. Lhuillier, L. Pierre, *Signature of Néel order in exact spectra of quantum antiferromagnets on finite lattices*, Phys. Rev. Lett. 69, 2590 (1992); B. Bernu, P. Lecheminant, C. Lhuillier, L. Pierre, *Exact spectra, spin susceptibilities, and order parameter of the quantum Heisenberg antiferromagnet on the triangular lattice*, Phys. Rev. B 50, 10048 (1994), arXiv:cond-mat/9407028. Tower of states; the exact 36-site energy.
- L. Capriotti, A. E. Trumper, S. Sorella, *Long-range Néel order in the triangular Heisenberg model*, Phys. Rev. Lett. 82, 3899 (1999), arXiv:cond-mat/9901068. Green's function Monte Carlo; the first controlled evidence for order.
- W. Zheng, J. O. Fjærestad, R. R. P. Singh, R. H. McKenzie, R. Coldea, *Excitation spectra of the spin-1/2 triangular-lattice Heisenberg antiferromagnet*, Phys. Rev. B 74, 224420 (2006), arXiv:cond-mat/0608008. Series expansion.
- S. J. Miyake, *Spin-wave results for the staggered magnetization of triangular Heisenberg antiferromagnet*, J. Phys. Soc. Jpn. 61, 983 (1992). Not on arXiv.
- A. L. Chernyshev, M. E. Zhitomirsky, *Spin waves in a triangular lattice antiferromagnet: decays, spectrum renormalization, and singularities*, arXiv:0901.4803 (2009). Second-order spin-wave magnetization, Eq. (53).
- S. R. White, A. L. Chernyshev, *Néel order in square and triangular lattice Heisenberg models*, arXiv:0705.2746 (2007). DMRG on cylinders with pinning fields.
- J. Huang, X. Qian, M. Qin, *On the magnetization of the 120° order of the spin-1/2 triangular lattice Heisenberg model: a DMRG revisit*, J. Phys.: Condens. Matter 36, 185602 (2024), arXiv:2310.11774.
- J. Hasik, P. Corboz, *Incommensurate order with translationally invariant projected entangled-pair states: spiral states and quantum spin liquid on the anisotropic triangular lattice*, Phys. Rev. Lett. 133, 176502 (2024), arXiv:2311.05534. iPEPS for spirals; the isotropic triangular lattice is one point of the anisotropic model.
- J. Naumann, J. Eisert, P. Schmoll, *Variational optimization of projected entangled-pair states on the triangular lattice*, arXiv:2510.04907 (2025).
- R. Kaneko, S. Morita, M. Imada, *Gapless spin-liquid phase in an extended spin-1/2 triangular Heisenberg model*, arXiv:1407.0318 (2014).
- Y. Iqbal, W.-J. Hu, R. Thomale, D. Poilblanc, F. Becca, *Spin liquid nature in the Heisenberg J₁–J₂ triangular antiferromagnet*, Phys. Rev. B 93, 144411 (2016), arXiv:1601.06018. Projected fermionic states and DMRG on the 36-site cluster.
- F. Mezzacapo, J. I. Cirac, *Ground-state properties of the spin-1/2 antiferromagnetic Heisenberg model on the triangular lattice: a variational study based on entangled-plaquette states*, New J. Phys. 12, 103039 (2010), arXiv:1006.4480.
- F. Ferrari, F. Becca, J. Carrasquilla, *Neural Gutzwiller-projected variational wave functions*, arXiv:1906.00463 (2019).
- C. Roth, A. H. MacDonald, *Group convolutional neural networks improve quantum state accuracy*, arXiv:2104.05085 (2021).
- C. Roth, A. Szabó, A. H. MacDonald, *High-accuracy variational Monte Carlo for frustrated magnets with deep neural networks*, arXiv:2211.07749 (2022).
- C. Fu, X. Zhang, H. Zhang, H. Ling, S. Xu, S. Ji, *Lattice convolutional networks for learning ground states of quantum many-body systems*, arXiv:2206.07370 (2022).
- M. Hibat-Allah, R. G. Melko, J. Carrasquilla, *Supplementing recurrent neural network wave functions with symmetry and annealing to improve accuracy*, arXiv:2207.14314 (2022). RNNs on the triangular lattice.
- M. S. Moss, R. Wiersema, M. Hibat-Allah, J. Carrasquilla, R. G. Melko, *Leveraging recurrence in neural network wavefunctions for large-scale simulations of Heisenberg antiferromagnets on the triangular lattice*, arXiv:2505.20406 (2025). RNN energies on tori up to $30\times30$ and the literature table reproduced above.
- L. L. Viteritti, R. Rende, S. Sachdev, G. Carleo, *Approaching the thermodynamic limit with neural-network quantum states*, arXiv:2602.02665 (2026). Spatial-attention transformer on tori up to $42\times42$; finite-size scaling of energy and magnetization.
- D. Wu et al., *Variational benchmarks for quantum many-body problems*, arXiv:2302.04919 (2023). The varbench instance and exact energy for $6\times6$.
