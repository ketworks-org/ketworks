# Homogeneous electron gas

> **In brief.** The homogeneous electron gas (jellium) is electrons in a uniform neutralizing background. It has one parameter, the density $r_s$. At high density it is close to a Slater determinant of plane waves; at low density it crystallizes, at $r_s=86.6(7)$ in three dimensions and $r_s\approx31$–$37$ in two according to the most recent estimates. Ketboard compares finite periodic cells at the $\Gamma$ point, energy per electron in Hartree, with the cell shape and $N_\uparrow$, $N_\downarrow$ fixed. The energies of other methods on these cells are mostly fixed-node diffusion Monte Carlo (DMC) computed for the same cell and, for 14 electrons at high density, transcorrelated FCIQMC. The tables on this page are generated from Ketboard and those energies, so they always show, cell by cell, whether a neural state or another method holds the lowest variational energy.

Notation follows the [conventions page](../notation/). The [continuous-space page](../continuous-space/) explains the ansätze, the local energy and the periodic boundary conditions used here. This page fixes the conventions of the electron-gas instances on Ketboard and summarizes what is known about their energies. Reviewed entries live in [Ketboard](../../#benchmarks?category=continuous-space), not here.

## Hamiltonian and instances

In Hartree atomic units, for $N$ electrons in a periodic cell of volume $\Omega$,

$$
H=-\frac12\sum_{i=1}^{N}\nabla_i^2+\frac12\sum_{i\neq j}v_E(\mathbf r_i-\mathbf r_j)+\frac N2\,v_M+E_{\mathrm b},
$$

where $v_E$ is the Ewald-summed Coulomb interaction of one electron with another and all its periodic images, $v_M$ the interaction of an electron with its own images (the Madelung term), and $E_{\mathrm b}$ the constant from the background, which cancels the $\mathbf G=0$ component. In three dimensions the density parameter is defined by $\tfrac43\pi r_s^3=\Omega/N$, in two by $\pi r_s^2=\Omega/N$, with $r_s$ in bohr.

- **Energy.** Total energy per electron, $e=E/N$, in Hartree, Madelung term included. Papers in Rydberg are converted with a factor $\tfrac12$, totals per cell are divided by $N$; the Ketboard entry keeps the printed digits and the conversion.
- **Boundary conditions.** Periodic at the $\Gamma$ point, i.e. no twist. A twist-averaged energy, an extrapolation to $N\to\infty$, or an energy with an analytic finite-size correction is a different quantity and is not an entry.
- **Sector.** $N_\uparrow$ and $N_\downarrow$ are fixed. "Polarized" means $N_\downarrow=0$, "unpolarized" $N_\uparrow=N_\downarrow$.
- **Cell.** The cell shape is part of the instance. At $N=27$ and $r_s=1$ the fully polarized gas has $e=1.26$ Ha in a body-centred cubic cell (Cassella et al., arXiv:2202.05183, Supplementary Table IV) and $1.05$ Ha in a simple cubic one (Pescia et al., arXiv:2305.07240, Table V).

The cells, electron numbers and densities that have entries are listed on [Ketboard](../../#benchmarks?category=continuous-space); the next section explains how the cells are chosen.

## Shells and crystals

At the $\Gamma$ point the noninteracting ground state fills plane waves $e^{i\mathbf G\cdot\mathbf r}$ in shells of equal $|\mathbf G|$. In a simple cubic cell the shells close at 1, 7, 19, 27, 33, 57, … electrons per spin, so 7, 19 and 27 polarized electrons and 14 and 54 unpolarized ones are closed-shell systems with a unique, translation-invariant Slater determinant. In a square cell the shells close at 1, 5, 9, 13, 21, 25, 29, 37, … per spin, and in a triangular cell at 1, 7, 13, 19, 31, 37, 43, 55, 61, 73, 85, 91, …, 163, 169, … per spin (our count of reciprocal-lattice vectors).

The other cells are chosen to hold a Wigner crystal. A body-centred cubic cell with $N=M^3$ polarized electrons contains an $M\times M\times M$ body-centred cubic crystal, the expected low-density structure (Cassella et al., arXiv:2202.05183, p. 5); $N=27$ is not a closed shell in that cell, whose shells close at 19 and 43 per spin. A simple cubic cell holds a body-centred cubic crystal of $2M^3$ sites, as for $N=54=2\times3^3$ and $N=128=2\times4^3$, where Pescia et al. centre Gaussian orbitals on the crystal sites; a $3:3:2$ box holds 18 conventional body-centred cubic cells, i.e. 36 sites, on which Liu, Qian and Wang do the same. In two dimensions the triangular cells of 16, 91 and 169 sites fit a triangular crystal without distortion (Li et al., arXiv:2607.25872, Appendix E, for $N=16$), and the 56-electron rectangle of Smith et al. is "constructed to be commensurate with a triangular lattice" (arXiv:2405.19397, Supplemental Material). In a cell that is not a closed shell the noninteracting ground state is degenerate, so the plane-wave reference determinant is itself a choice.

## Why the electron gas is a benchmark

**Two energy scales.** The kinetic energy per electron scales as $r_s^{-2}$ and the Coulomb energy as $r_s^{-1}$. In three dimensions the plane-wave Hartree–Fock energy of the unpolarized gas in the thermodynamic limit is $e_{\mathrm{HF}}=1.105/r_s^2-0.458/r_s$ Ha (Loos and Gill, arXiv:1601.03544). At high density the correlation energy is a small part of the total, about 7 per cent for 54 electrons at $r_s=1$, where the Hartree–Fock and backflow DMC energies are $0.5689(4)$ and $0.52989(4)$ Ha (López Ríos et al., arXiv:0801.0518, Table I). At low density the total energy is small and the competing states differ by microhartrees: on the triangular cell with 91 electrons at $r_s=30$, the self-attention state of Gaggioli, Azadi and Fu and their backflow DMC differ by $6\times10^{-7}$ Ha per electron (arXiv:2607.08616, Table I). Relative accuracies of $10^{-5}$ are needed to rank ansätze, and the printed error bars are of that order.

**Fluid and crystal.** A plane-wave determinant describes the fluid. At low density the electrons localize, and an ansatz must either break translation symmetry or learn the crystal from correlations. Pescia et al. use either plane waves or Gaussian orbitals centred on body-centred cubic sites under the same message-passing backflow; the Gaussian orbitals give the lower energy at $r_s=100$ for 54 electrons and at $r_s=110$ and $200$ for 128 electrons (arXiv:2305.07240, Tables II and III). Liu, Qian and Wang locate the crossing of the two for 36 electrons between $r_s=86.8$ and $87.0$ (arXiv:2604.15888, Supplemental Table V). In a small cell the transition can move far from its thermodynamic-limit value: for 27 polarized electrons in a body-centred cubic cell, the crystalline order parameter of FermiNet "rises sharply to a finite value at $r_s=2$" (Cassella et al., arXiv:2202.05183, Fig. 1), and the paper attributes this to finite-size effects. Optimizations near the transition get stuck in local minima (arXiv:2202.05183, p. 5), so the energy reported for one cell depends on the starting point.

**References are not exact.** Fixed-node DMC is exact only if the nodes of the trial function are; its energy is an upper bound and its error is the fixed-node error. The DMC references on these cells use Slater–Jastrow, Slater–Jastrow–backflow or iterative-backflow trial functions, and neural VMC energies below them are not a contradiction. The most accurate references at high density are transcorrelated FCIQMC energies for 14 electrons, extrapolated to the complete basis (Luo and Alavi, arXiv:1712.07524; tabulated by Liao et al., arXiv:2103.03176, Table I). They come from a non-Hermitian similarity-transformed Hamiltonian and an extrapolation in the basis, so they are estimates of the exact energy, not variational bounds.

**One cell, one instance.** Energies per electron at fixed $r_s$ change between cells of different size and shape by more than between ansätze on one cell: at $r_s=1$ the unpolarized gas has $0.569$ Ha per electron with 14 electrons and $0.530$ with 54, tens of millihartree apart, while the neural states on one cell differ by fractions of a millihartree. Twist averaging and extrapolation in $N$ remove most of the finite-size error but change the problem, which is why Ketboard keeps each cell separate and compares only within it.

## What is known in the thermodynamic limit

- **Correlation energy.** The diffusion Monte Carlo energies of Ceperley and Alder, including released-node calculations (Phys. Rev. Lett. 45, 566 (1980)), are the basis of the local density approximation through the parametrizations of Vosko, Wilk and Nusair (Can. J. Phys. 58, 1200 (1980)) and Perdew and Zunger (Phys. Rev. B 23, 5048 (1981)). At high density FCIQMC gives finite-cell energies at the complete-basis limit for 54 electrons at $r_s=0.5$ and $1$ (Shepherd, Booth, Grüneis, Alavi, arXiv:1109.2635), and benchmarks for 14 electrons at $0.5\le r_s\le5$ (Shepherd, Booth, Alavi, arXiv:1201.4691). Combining FCIQMC and DMC, Ruggeri, López Ríos and Alavi obtain correlation energies of the polarized gas in the thermodynamic limit of $-40.44(5)$ mHa at $r_s=0.5$ and $-31.70(4)$ mHa at $r_s=1$ (arXiv:1804.04938).
- **Three dimensions.** Drummond et al. found a transition from a fully polarized fluid to a body-centred cubic crystal at $r_s=106(1)$ (arXiv:0801.0377). Azadi and Drummond, with backflow trial functions and twist averaging, find instead a direct first-order transition from the paramagnetic fluid to the body-centred cubic crystal at $r_s=86.6(7)$, with no stable ferromagnetic fluid, and a possible transition from an antiferromagnetic to a ferromagnetic crystal at $r_s=93(3)$ (arXiv:2201.08743).
- **Two dimensions.** Tanatar and Ceperley placed crystallization at $r_s\approx37\pm5$ (Phys. Rev. B 39, 5005 (1989)). Drummond and Needs found a transition from the paramagnetic fluid to an antiferromagnetic triangular crystal at $r_s=31(1)$, a ferromagnetic crystal from $r_s=38(5)$, and no region where the polarized fluid is stable (arXiv:1002.2101). Azadi, Drummond and Vinko revise the transition to $r_s=35(1)$ (arXiv:2405.00425). Smith et al., with a message-passing neural state on 56 electrons and DMC-based finite-size corrections, find the crystal at $r_s=37\pm1$ and a liquid with nematic spin correlations at intermediate densities (arXiv:2405.19397).

## Known energies

The tables in this section are generated when the site is built, from the reviewed Ketboard entries and from the energies of other methods recorded with them, so they change when an entry is added. Energies are per electron in Hartree, for the same finite cell at $\Gamma$. For each density they give the lowest neural energy on Ketboard; the lowest upper bound from another method computed for the same cell, which is fixed-node DMC or VMC, and whether it lies below or above the neural energy; and, where available, an estimate of the exact energy. Values printed in Rydberg or as totals per cell are converted from the printed digits. Each row links to the Ketboard instance with every entry.

**Simple cubic, 7 + 7 electrons.** The iterative-backflow DMC of Wilson et al. uses the trial functions of Taddei et al. (arXiv:1501.02199); the transcorrelated FCIQMC energies of Luo and Alavi are extrapolated to the complete basis and are estimates, not bounds.

```ketboard
summary
instances: heg3d-sc-n14-unpol-rs*
row: r_s
```

**Simple cubic, 19 + 0 electrons.**

```ketboard
summary
instances: heg3d-sc-n19-pol-rs*
row: r_s
```

**Simple cubic, 7 + 0 electrons.**

```ketboard
summary
instances: heg3d-sc-n7-pol-rs*
row: r_s
```

**Simple cubic, 27 + 27 electrons.** The backflow DMC energies of López Ríos et al. include a three-electron Jastrow term from $r_s=5$. Pescia et al. also print a backflow DMC energy at $r_s=50$, $-0.0144877(1)$; it is the twist-averaged energy of 54 electrons in a face-centred cubic cell (Azadi and Drummond, arXiv:2201.08743, Table X), a different system, and is not used here.

```ketboard
summary
instances: heg3d-sc-n54-unpol-rs*
row: r_s
```

**Simple cubic, 27 + 0 and 64 + 64 electrons.**

```ketboard
summary
instances: heg3d-sc-n27-pol-rs*
row: r_s
```

```ketboard
summary
instances: heg3d-sc-n128-unpol-rs*
row: r_s
```

**Body-centred cubic, 27 + 0 electrons.** Cassella et al. computed DMC with a plane-wave (fluid) and a Gaussian (crystal) determinant; the table takes the lower of the two.

```ketboard
summary
instances: heg3d-bcc-n27-pol-rs*
row: r_s
```

**Rectangular $3:3:2$, 18 + 18 electrons.** The scan between $r_s=86.6$ and $87.1$ compares plane-wave and Gaussian reference orbitals across the transition (Liu, Qian, Wang, arXiv:2604.15888, Supplemental Table V).

```ketboard
summary
instances: heg3d-rect332-n36-unpol-rs*
row: r_s
```

**Two dimensions.** Smith et al. computed fixed-node DMC of the fluid and of the crystal for their 56-electron cell, and Gaggioli, Azadi and Fu Slater–Jastrow–backflow VMC and zero-time-step DMC for their triangular cells (the DMC values of arXiv:2607.08616v2 differ in the last digit from v1). With 91 electrons their state is a fluid at $r_s=30$ and a triangular crystal at $r_s=40$ (arXiv:2607.08616, Fig. 2).

```ketboard
summary
instances: heg2d-rect-n56-unpol-rs*
row: r_s
```

```ketboard
summary
instances: heg2d-rhombus-* heg2d-sq-*
row: label
```

For 16 polarized electrons in the triangular cell, fixed-phase DMC with the Fermi Sets state of Li et al. as guiding function gives $-0.03199636(7)$ Ha (arXiv:2607.25872, Table III); it is a projector energy and not an entry. Li et al. and Xie, Zhang and Wang compare with values of Tanatar and Ceperley (Phys. Rev. B 39, 5005 (1989)) without stating that these are for the same finite cell, so those values are not used.

## Reporting a result for these instances

1. State the dimension, the shape of the simulation cell and its lattice vectors, $N_\uparrow$ and $N_\downarrow$, and $r_s$. A cell of the same $N$ and $r_s$ but another shape is another instance.
2. State the boundary condition: $\Gamma$ point, or the twist. A twist-averaged energy, an extrapolation in $N$, or an energy with a finite-size correction is not an entry.
3. State the Coulomb conventions: Ewald summation, neutralizing background, Madelung term included. Give the energy per electron or the total per cell, and the unit.
4. State the reference orbitals (plane waves, Gaussians centred on crystal sites) and whether the state breaks translation symmetry.
5. Evaluate the final state with a dedicated run without clipping of the local energy, and give the error bar from a [binning analysis](../variational-monte-carlo/). Diffusion Monte Carlo with the neural state as trial function is a projector method and is not an entry.
6. Give the printed digits exactly as in the paper, with the arXiv version, table and row, through the [Ketboard form](../../#submit), which builds the instance from these quantities for a cell not yet on the board.

## References

- D. M. Ceperley, B. J. Alder, *Ground state of the electron gas by a stochastic method*, Phys. Rev. Lett. 45, 566 (1980).
- S. H. Vosko, L. Wilk, M. Nusair, *Accurate spin-dependent electron liquid correlation energies for local spin density calculations: a critical analysis*, Can. J. Phys. 58, 1200 (1980).
- J. P. Perdew, A. Zunger, *Self-interaction correction to density-functional approximations for many-electron systems*, Phys. Rev. B 23, 5048 (1981).
- B. Tanatar, D. M. Ceperley, *Ground state of the two-dimensional electron gas*, Phys. Rev. B 39, 5005 (1989).
- N. D. Drummond, Z. Radnai, J. R. Trail, M. D. Towler, R. J. Needs, *Diffusion quantum Monte Carlo study of three-dimensional Wigner crystals*, arXiv:0801.0377 (2004).
- P. López Ríos, A. Ma, N. D. Drummond, M. D. Towler, R. J. Needs, *Inhomogeneous backflow transformations in quantum Monte Carlo calculations*, arXiv:0801.0518 (2006). Backflow DMC for 54 electrons in a simple cubic cell.
- N. D. Drummond, R. J. Needs, *Phase diagram of the low-density two-dimensional homogeneous electron gas*, arXiv:1002.2101 (2009).
- J. J. Shepherd, G. Booth, A. Grüneis, A. Alavi, *Full configuration interaction perspective on the homogeneous electron gas*, arXiv:1109.2635 (2012).
- J. J. Shepherd, G. H. Booth, A. Alavi, *Investigation of the full configuration interaction quantum Monte Carlo method using homogeneous electron gas models*, arXiv:1201.4691 (2012).
- M. Taddei, M. Ruggeri, S. Moroni, M. Holzmann, *Iterative backflow renormalization procedure for many-body ground-state wave functions of strongly interacting normal Fermi liquids*, arXiv:1501.02199 (2015).
- H. Luo, A. Alavi, *Combining the transcorrelated method with full configuration interaction quantum Monte Carlo: application to the homogeneous electron gas*, arXiv:1712.07524 (2017).
- P.-F. Loos, P. M. W. Gill, *The uniform electron gas*, arXiv:1601.03544 (2016). Review; Hartree–Fock energies.
- M. Ruggeri, P. López Ríos, A. Alavi, *Correlation energies of the high-density spin-polarized electron gas to meV accuracy*, arXiv:1804.04938 (2018).
- K. Liao, T. Schraivogel, H. Luo, D. Kats, A. Alavi, *Towards efficient and accurate ab initio solutions to periodic systems via transcorrelation and coupled cluster theory*, arXiv:2103.03176 (2021). TC-FCIQMC and TC-DCD energies for 14 and 54 electrons.
- H. Xie, L. Zhang, L. Wang, *m\* of two-dimensional electron gas: a neural canonical transformation study*, arXiv:2201.03156 (2022).
- M. Wilson, S. Moroni, M. Holzmann, N. Gao, F. Wudarski, T. Vegge, A. Bhowmik, *Neural network ansatz for periodic wave functions and the homogeneous electron gas*, arXiv:2202.04622 (2022). WAP-net; iterative-backflow VMC and DMC for 7, 14 and 19 electrons.
- G. Cassella, H. Sutterud, S. Azadi, N. D. Drummond, D. Pfau, J. S. Spencer, W. M. C. Foulkes, *Discovering quantum phase transitions with fermionic neural networks*, arXiv:2202.05183 (2022).
- S. Azadi, N. D. Drummond, *Low-density phase diagram of the three-dimensional electron gas*, arXiv:2201.08743 (2022).
- X. Li, Z. Li, J. Chen, *Ab initio calculation of real solids via neural network ansatz*, arXiv:2203.15472 (2022). DeepSolid.
- G. Pescia, J. Nys, J. Kim, A. Lovato, G. Carleo, *Message-passing neural quantum states for the homogeneous electron gas*, arXiv:2305.07240 (2023).
- S. Azadi, N. D. Drummond, S. M. Vinko, *Quantum Monte Carlo study of the phase diagram of the two-dimensional uniform electron liquid*, arXiv:2405.00425 (2024).
- C. Smith, Y. Chen, R. Levy, Y. Yang, M. A. Morales, S. Zhang, *Ground state phases of the two-dimension electron gas with a unified variational approach*, arXiv:2405.19397 (2024).
- Z. Liu, D. Qian, J. Wang, *Enhancing neural-network variational Monte Carlo through basis transformation*, arXiv:2604.15888 (2026).
- F. Gaggioli, S. Azadi, L. Fu, *Accurate self-attention wavefunctions at large scale*, arXiv:2607.08616 (2026).
- Y.-S. Li, S. Poldmaa, T. Ong, A. Abouelkomsan, T.-R. Chang, H. Lin, L. Fu, *Scaling universal Fermi network toward ground states: a diffusion-Monte-Carlo assessment*, arXiv:2607.25872 (2026).
