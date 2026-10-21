# Homogeneous electron gas

> **In brief.** The homogeneous electron gas (jellium) is electrons in a uniform neutralizing background. It has one parameter, the density $r_s$. At high density it is close to a Slater determinant of plane waves; at low density it crystallizes, at $r_s=86.6(7)$ in three dimensions and $r_s\approx31$–$37$ in two according to the most recent estimates. Ketboard compares finite periodic cells at the $\Gamma$ point, energy per electron in Hartree, with the cell shape and $N_\uparrow$, $N_\downarrow$ fixed. The references on these cells are fixed-node diffusion Monte Carlo (DMC) energies computed for the same cell and, for 14 electrons at high density, transcorrelated FCIQMC. Neural states are below Slater–Jastrow DMC on most cells, and on several also below backflow DMC; iterative-backflow DMC remains below every neural energy for 19 polarized electrons, and for 14 electrons at $r_s\ge10$.

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

**Two energy scales.** The kinetic energy per electron scales as $r_s^{-2}$ and the Coulomb energy as $r_s^{-1}$. In three dimensions the plane-wave Hartree–Fock energy of the unpolarized gas in the thermodynamic limit is $e_{\mathrm{HF}}=1.105/r_s^2-0.458/r_s$ Ha (Loos and Gill, arXiv:1601.03544). At high density the correlation energy is a small part of the total, about 7 per cent for 54 electrons at $r_s=1$, where the Hartree–Fock and backflow DMC energies are $0.5689(4)$ and $0.52989(4)$ Ha (López Ríos et al., arXiv:0801.0518, Table I). At low density the total energy is small and the competing states differ by microhartrees: on the triangular cell with 91 electrons at $r_s=30$ the neural energy and the backflow DMC energy differ by $6\times10^{-7}$ Ha per electron (Gaggioli, Azadi, Fu, arXiv:2607.08616, Table I). Relative accuracies of $10^{-5}$ are needed to rank ansätze, and the printed error bars are of that order.

**Fluid and crystal.** A plane-wave determinant describes the fluid. At low density the electrons localize, and an ansatz must either break translation symmetry or learn the crystal from correlations. Pescia et al. use either plane waves or Gaussian orbitals centred on body-centred cubic sites under the same message-passing backflow; the Gaussian orbitals give the lower energy at $r_s=100$ for 54 electrons and at $r_s=110$ and $200$ for 128 electrons (arXiv:2305.07240, Tables II and III). Liu, Qian and Wang locate the crossing of the two for 36 electrons between $r_s=86.8$ and $87.0$ (arXiv:2604.15888, Supplemental Table V). In a small cell the transition can move far from its thermodynamic-limit value: for 27 polarized electrons in a body-centred cubic cell, the crystalline order parameter of FermiNet "rises sharply to a finite value at $r_s=2$" (Cassella et al., arXiv:2202.05183, Fig. 1), and the paper attributes this to finite-size effects. Optimizations near the transition get stuck in local minima (arXiv:2202.05183, p. 5), so the energy reported for one cell depends on the starting point.

**References are not exact.** Fixed-node DMC is exact only if the nodes of the trial function are; its energy is an upper bound and its error is the fixed-node error. The DMC references on these cells use Slater–Jastrow, Slater–Jastrow–backflow or iterative-backflow trial functions, and neural VMC energies below them are not a contradiction. The most accurate references at high density are transcorrelated FCIQMC energies for 14 electrons, extrapolated to the complete basis (Luo and Alavi, arXiv:1712.07524; tabulated by Liao et al., arXiv:2103.03176, Table I). They come from a non-Hermitian similarity-transformed Hamiltonian and an extrapolation in the basis, so they are estimates of the exact energy, not variational bounds.

**One cell, one instance.** Energies per electron at fixed $r_s$ change between cells of different size and shape by more than between ansätze on one cell: at $r_s=1$ the unpolarized gas has $0.569$ Ha per electron with 14 electrons and $0.530$ with 54, while the neural states on either cell agree within $0.3$ mHa. Twist averaging and extrapolation in $N$ remove most of the finite-size error but change the problem, which is why Ketboard keeps each cell separate and compares only within it.

## What is known in the thermodynamic limit

- **Correlation energy.** The diffusion Monte Carlo energies of Ceperley and Alder, including released-node calculations (Phys. Rev. Lett. 45, 566 (1980)), are the basis of the local density approximation through the parametrizations of Vosko, Wilk and Nusair (Can. J. Phys. 58, 1200 (1980)) and Perdew and Zunger (Phys. Rev. B 23, 5048 (1981)). At high density FCIQMC gives finite-cell energies at the complete-basis limit for 54 electrons at $r_s=0.5$ and $1$ (Shepherd, Booth, Grüneis, Alavi, arXiv:1109.2635), and benchmarks for 14 electrons at $0.5\le r_s\le5$ (Shepherd, Booth, Alavi, arXiv:1201.4691). Combining FCIQMC and DMC, Ruggeri, López Ríos and Alavi obtain correlation energies of the polarized gas in the thermodynamic limit of $-40.44(5)$ mHa at $r_s=0.5$ and $-31.70(4)$ mHa at $r_s=1$ (arXiv:1804.04938).
- **Three dimensions.** Drummond et al. found a transition from a fully polarized fluid to a body-centred cubic crystal at $r_s=106(1)$ (arXiv:0801.0377). Azadi and Drummond, with backflow trial functions and twist averaging, find instead a direct first-order transition from the paramagnetic fluid to the body-centred cubic crystal at $r_s=86.6(7)$, with no stable ferromagnetic fluid, and a possible transition from an antiferromagnetic to a ferromagnetic crystal at $r_s=93(3)$ (arXiv:2201.08743).
- **Two dimensions.** Tanatar and Ceperley placed crystallization at $r_s\approx37\pm5$ (Phys. Rev. B 39, 5005 (1989)). Drummond and Needs found a transition from the paramagnetic fluid to an antiferromagnetic triangular crystal at $r_s=31(1)$, a ferromagnetic crystal from $r_s=38(5)$, and no region where the polarized fluid is stable (arXiv:1002.2101). Azadi, Drummond and Vinko revise the transition to $r_s=35(1)$ (arXiv:2405.00425). Smith et al., with a message-passing neural state on 56 electrons and DMC-based finite-size corrections, find the crystal at $r_s=37\pm1$ and a liquid with nematic spin correlations at intermediate densities (arXiv:2405.19397).

## Known energies

Energies per electron in Hartree. The neural entries are the best of each paper on each cell; Ketboard lists all variants with the arXiv version and the printed token. Values converted from Rydberg or from totals per cell are exact conversions of the printed digits. The reference columns are for the same finite cell at $\Gamma$ unless stated.

**Simple cubic, 7 + 7 electrons.** WAP-net: Wilson et al., arXiv:2202.04622, Table III. MP-NQS: Pescia et al., arXiv:2305.07240, Table I. FermiNet with basis transformation: Liu, Qian, Wang, arXiv:2604.15888, Supplemental Table III ($r_s=15$ is only in this source, $-0.04086193(14)$). Iterative-backflow DMC, with the trial functions of Taddei et al. (arXiv:1501.02199): Wilson et al., Table III. TC-FCIQMC: Liao et al., arXiv:2103.03176, Table I, complete-basis limit.

| $r_s$ | WAP-net | MP-NQS | FermiNet + basis transf. | Iterative-backflow DMC | TC-FCIQMC |
| --- | --- | --- | --- | --- | --- |
| 1 | $0.5689560(45)$ | $0.568967(6)$ | $0.5688507(14)$ | $0.568975(5)$ | $0.56861(1)$ |
| 2 | $-0.0083330(25)$ | $-0.008391(1)$ | $-0.00841643(71)$ | $-0.008325(5)$ | $-0.00868(2)$ |
| 5 | $-0.0798360(5)$ | $-0.0798544(4)$ | $-0.07986300(21)$ | $-0.0798420(15)$ | $-0.08002(2)$ |
| 10 | $-0.0552038(3)$ | $-0.0552126(6)$ | $-0.05517993(21)$ | $-0.0552180(5)$ | |
| 20 | $-0.03244415(15)$ | $-0.0324553(2)$ | $-0.0323600(29)$ | $-0.03245785(25)$ | |
| 50 | $-0.014622225(30)$ | $-0.01462631(6)$ | | $-0.01462865(10)$ | |
| 100 | $-0.007730240(15)$ | $-0.00773018(3)$ | | $-0.007734295(25)$ | |

Up to $r_s=5$ the basis-transformed FermiNet is the lowest variational energy, and TC-FCIQMC lies $0.16$ to $0.26$ mHa below it. From $r_s=10$ the iterative-backflow DMC energy is below every neural entry.

**Simple cubic, 19 + 0 and 7 + 0 electrons.** Same sources as above (MP-NQS: Table IV); IB-DMC is the iterative-backflow DMC of Wilson et al. For 19 polarized electrons the iterative-backflow DMC energy is below both neural states at every density, at $r_s=2$ by less than the error bars; for 7 polarized electrons WAP-net is below it at every density.

| $r_s$ | 19 + 0: WAP-net | 19 + 0: MP-NQS | 19 + 0: IB-DMC | 7 + 0: WAP-net | 7 + 0: IB-DMC |
| --- | --- | --- | --- | --- | --- |
| 1 | $1.0462415(25)$ | $1.046262(2)$ | $1.0462250(5)$ | $1.1203575(35)$ | $1.120400(5)$ |
| 2 | $0.096303(1)$ | $0.096307(1)$ | $0.0963025(15)$ | $0.110850(1)$ | $0.110879(2)$ |
| 5 | $-0.06725105(25)$ | $-0.0672489(3)$ | $-0.0672540(5)$ | $-0.0664225(5)$ | $-0.0664055(5)$ |
| 10 | $-0.05286035(10)$ | $-0.0528624(2)$ | $-0.0528652(3)$ | $-0.05314360(25)$ | $-0.0531380(5)$ |
| 20 | $-0.03201095(5)$ | $-0.0320101(1)$ | $-0.03201665(10)$ | $-0.03226895(15)$ | $-0.0322665(20)$ |
| 50 | $-0.01456571(2)$ | $-0.01456685(3)$ | $-0.014569195(40)$ | $-0.014660890(15)$ | $-0.0146604(1)$ |
| 100 | $-0.007717605(10)$ | $-0.00771832(2)$ | $-0.007721425(10)$ | $-0.007746545(10)$ | $-0.00774625(5)$ |

**Simple cubic, 27 + 27 electrons.** DeepSolid: Li, Li, Chen, arXiv:2203.15472, Supplementary Table 11. MP-NQS with plane-wave or body-centred cubic Gaussian orbitals: Pescia et al., Table II. Backflow DMC: López Ríos et al., arXiv:0801.0518, Table I (with a three-body Jastrow factor from $r_s=5$). Slater–Jastrow DMC: Pescia et al., Table II. TC-FCIQMC: Liao et al., Table II.

| $r_s$ | DeepSolid | MP-NQS, plane waves | MP-NQS, Gaussians | Backflow DMC | Slater–Jastrow DMC |
| --- | --- | --- | --- | --- | --- |
| 0.5 | $3.221226(2)$ | | | $3.22112(4)$ | |
| 1 | $0.530019(1)$ | $0.52973(1)$ | | $0.52989(4)$ | $0.53094(2)$ |
| 2 | $-0.013840(1)$ | $-0.014046(8)$ | $-0.01390(1)$ | $-0.013966(9)$ | $-0.01326(2)$ |
| 5 | $-0.0788354(2)$ | $-0.079090(2)$ | $-0.079064(4)$ | $-0.079036(3)$ | $-0.07867(1)$ |
| 10 | $-0.0542785(1)$ | $-0.054448(1)$ | $-0.054445(1)$ | $-0.054443(2)$ | $-0.054269(8)$ |
| 20 | $-0.0316886(1)$ | $-0.0320524(5)$ | $-0.0320480(6)$ | $-0.032047(2)$ | $-0.031976(8)$ |
| 50 | | $-0.0145015(1)$ | $-0.0144999(1)$ | | $-0.01387(2)$ |
| 100 | | $-0.0076793(1)$ | $-0.00769203(5)$ | | $-0.007674(3)$ |

The TC-FCIQMC energy at $r_s=1$ is $0.52973(3)$, equal to MP-NQS. At $r_s=50$, Pescia et al. also print a backflow DMC energy, $-0.0144877(1)$; it is the twist-averaged energy of 54 electrons in a face-centred cubic cell (Azadi and Drummond, arXiv:2201.08743, Table X), a different system, and is not listed here.

**Simple cubic, 27 + 0 and 64 + 64 electrons.** MP-NQS against Slater–Jastrow DMC computed by Pescia et al. (Tables III and V). The neural state is lower at every density.

| Electrons | $r_s$ | MP-NQS | Slater–Jastrow DMC |
| --- | --- | --- | --- |
| 27 + 0 | 1 | $1.051771(4)$ | $1.05200(3)$ |
| 27 + 0 | 5 | $-0.0665523(6)$ | $-0.066429(4)$ |
| 27 + 0 | 30 | $-0.0228184(1)$ | $-0.0228080(8)$ |
| 27 + 0 | 90 | $-0.00853156(2)$ | $-0.0085314(5)$ |
| 64 + 64 | 110 | $-0.0071121(2)$, Gaussians | $-0.007009518(1)$ |
| 64 + 64 | 200 | $-0.0040615(1)$, Gaussians | $-0.0039923(7)$ |

**Body-centred cubic, 27 + 0 electrons.** FermiNet with 16 dense determinants, complex for $r_s\le1$, against Slater–Jastrow–backflow DMC with a plane-wave (gas) or a Gaussian (crystal) determinant, all from Cassella et al., arXiv:2202.05183, Supplementary Table IV. FermiNet is lowest for $r_s\le1$; from $r_s=2$ the crystal DMC energy is lower by 5 to 21 μHa.

| $r_s$ | FermiNet | DMC, gas | DMC, crystal |
| --- | --- | --- | --- |
| 0.2 | $44.18067(2)$ | $44.18224(1)$ | $44.18468(3)$ |
| 0.5 | $6.318704(2)$ | $6.319754(7)$ | $6.32130(6)$ |
| 1 | $1.261547(1)$ | $1.261975(2)$ | $1.26254(2)$ |
| 2 | $0.152086(1)$ | $0.152344(3)$ | $0.152077(4)$ |
| 3 | $-0.006961(2)$ | $-0.0067419(7)$ | $-0.006966(2)$ |
| 5 | $-0.057691(4)$ | $-0.0575023(4)$ | $-0.057702(1)$ |
| 10 | $-0.050320(5)$ | $-0.0502038(1)$ | $-0.0503349(8)$ |
| 30 | $-0.022541(5)$ | $-0.02249870(5)$ | $-0.0225620(2)$ |
| 50 | $-0.014478(4)$ | $-0.01444409(5)$ | $-0.0144918(1)$ |
| 70 | $-0.010693(3)$ | $-0.0106735(1)$ | $-0.0107118(1)$ |
| 90 | $-0.008496(1)$ | $-0.0084862(1)$ | $-0.0085137(2)$ |

**Rectangular $3:3:2$, 18 + 18 electrons.** Only Liu, Qian and Wang (arXiv:2604.15888, Supplemental Tables IV and V), with no reference energy; their best energies run from $-0.07562667(56)$ at $r_s=5$ to $-0.007692872(11)$ at $r_s=100$, and the scan between $r_s=86.6$ and $87.1$ compares plane-wave and Gaussian reference orbitals across the transition.

**Two dimensions.** Smith et al. compare their (MP)²NQS state with fixed-node DMC of the fluid and of the crystal, with Slater–Jastrow–backflow trial functions, computed for the same 56-electron cell (arXiv:2405.19397, Supplemental Table I). Gaggioli, Azadi and Fu compare a self-attention state with Slater–Jastrow–backflow VMC and DMC, the DMC extrapolated to zero time step, for the same triangular cells at $\Gamma$ (arXiv:2607.08616v2, Table I; the DMC values differ in the last digit from v1).

| Cell | $r_s$ | Neural state | DMC, fluid | DMC, crystal |
| --- | --- | --- | --- | --- |
| rectangle, 28 + 28 | 20 | $-0.04637(2)$ | $-0.046342(1)$ | $-0.0462847(9)$ |
| rectangle, 28 + 28 | 30 | $-0.03197(1)$ | $-0.0319493(6)$ | $-0.031949(1)$ |
| rectangle, 28 + 28 | 40 | $-0.024451(2)$ | $-0.0244356(7)$ | $-0.0244496(4)$ |
| rectangle, 28 + 28 | 50 | $-0.019829(1)$ | | $-0.0198283(3)$ |
| triangle, 91 + 0 | 30 | $-0.03193763(3)$ | $-0.0319370(1)$ | |
| triangle, 91 + 0 | 40 | $-0.02443814(2)$ | $-0.0244377(2)$ | |
| triangle, 169 + 0 | 30 | $-0.03192077(3)$ | $-0.0319197(1)$ | |

Smith et al. report energies below DMC at all densities, by about $2\times10^{-5}$ Ha in the fluid and by about one neural error bar or less from $r_s=35$. Gaggioli et al. are below DMC by $0.4$ to $1.1$ μHa. For 91 electrons the state at $r_s=30$ is a fluid and the one at $r_s=40$ a triangular crystal (arXiv:2607.08616, Fig. 2).

Two further cells have one neural entry each. For 16 polarized electrons in a triangular cell at $r_s=30$, the Fermi Sets state of Li et al. reaches $-0.031990687(3)$ (arXiv:2607.25872, Table III); fixed-phase DMC with that state as guiding function gives $-0.03199636(7)$, which is a projector energy and not an entry. For 37 polarized electrons in a square cell at $r_s=5$, the neural canonical transformation of Xie, Zhang and Wang gives $-0.28746(8)$ Ry, i.e. $-0.14373(4)$ Ha (arXiv:2201.03156, Fig. 2b). Both papers compare with values of Tanatar and Ceperley (Phys. Rev. B 39, 5005 (1989)) without stating that these are for the same finite cell, so they are not listed as references.

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
- N. D. Drummond, Z. Radnai, J. R. Trail, M. D. Towler, R. J. Needs, *Diffusion quantum Monte Carlo study of three-dimensional Wigner crystals*, arXiv:0801.0377; Phys. Rev. B 69, 085116 (2004).
- P. López Ríos, A. Ma, N. D. Drummond, M. D. Towler, R. J. Needs, *Inhomogeneous backflow transformations in quantum Monte Carlo calculations*, arXiv:0801.0518; Phys. Rev. E 74, 066701 (2006). Backflow DMC for 54 electrons in a simple cubic cell.
- N. D. Drummond, R. J. Needs, *Phase diagram of the low-density two-dimensional homogeneous electron gas*, arXiv:1002.2101; Phys. Rev. Lett. 102, 126402 (2009).
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
