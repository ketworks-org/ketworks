# Solids

> **In brief.** For crystals Ketboard compares the energy of electrons and nuclei in a finite periodic simulation cell, at a stated twist, without finite-size corrections. The instances are the solids for which neural-network energies with error bars are printed for a fully specified cell. They are:
> - **Dense atomic hydrogen** on a body-centred cubic lattice at $r_s=1.31$, with clamped and with quantum protons. Here two independent neural-network papers report energies for the same cell.
> - **The periodic hydrogen chain.**
> - **Rock-salt lithium hydride.**
> - **Graphene.**
>
> The tables below are generated from Ketboard and from the diffusion and reptation Monte Carlo energies recorded with it. They always show the current lowest neural energy in each cell and whether another method is lower.

Notation follows the [conventions page](../notation/). The [continuous-space page](../continuous-space/) explains the ansätze, periodic boundary conditions with a twist, and Ewald sums. Reviewed entries live in [Ketboard](../../#benchmarks?family=Solids), not here.

## Hamiltonian and instances

In Hartree atomic units, for electrons at $\mathbf r_i$ and nuclei of charge $Z_A$ at $\mathbf R_A$ in a simulation cell with lattice vectors $\mathbf L_1,\mathbf L_2,\mathbf L_3$,

$$
H=\sum_i\Bigl(-\tfrac12\nabla_i^2-\sum_A\frac{Z_A}{|\mathbf r_i-\mathbf R_A|}\Bigr)+\sum_{i<j}\frac{1}{|\mathbf r_i-\mathbf r_j|}+\sum_{A<B}\frac{Z_AZ_B}{|\mathbf R_A-\mathbf R_B|},
$$

where every Coulomb term is summed over the periodic images by Ewald summation. This includes each charge's interaction with its own images. The cell is neutral, so no background is needed. The wavefunction picks up the phase $e^{i\mathbf k_s\cdot\mathbf L_a}$ when one electron moves by a lattice vector, with the twist $\mathbf k_s$.

- **Cell.** The lattice vectors and the positions of all nuclei in the cell are part of the instance. Ketboard stores them and shows them, with an extended-XYZ file to download. The same crystal in a larger supercell is another instance: the energy per cell changes with the size of the cell by much more than between ansätze.
- **Twist.** Each twist is its own instance. A fraction such as $(\tfrac13,\tfrac13,0)$ is in units of the reciprocal vectors of the simulation cell. A twist-averaged energy needs its grid and weights, and is a different quantity.
- **Energy.** The energy per primitive cell (one LiH, two carbon atoms of graphene) or per atom (hydrogen), in Hartree: the total energy of the simulation cell divided by the number of primitive cells or atoms.
- **No corrections.** Structure-factor and Hartree–Fock finite-size corrections, zero-point vibrational energies and extrapolations in the cell size are reported separately in the papers, and they are not part of an entry.
- **Hamiltonian.** All electrons, nonrelativistic. A pseudopotential changes the Hamiltonian: an entry with one belongs to an instance that names the pseudopotential, and none is on the board yet.
- **Quantum nuclei.** For hydrogen, a second set of instances treats the protons as quantum particles of mass $M=1836\,m_e$. The Hamiltonian then has the kinetic term $-\sum_A\nabla_A^2/2M$. The protons are treated as distinguishable (no exchange), and the state is a crystal whose nuclear wavefunction is localized on the listed sites. Proton exchange is expected to be small in the crystal (Linteau et al., arXiv:2504.07062).
- **Spin.** All instances have $N_\uparrow=N_\downarrow$.

**Geometries.**
- **Dense hydrogen.** A cubic cell of volume $4\pi Nr_s^3/3$ holds $M\times M\times M$ conventional body-centred cubic cells, with $N=2M^3=16$, $54$ and $128$ protons (Linteau et al., Method; Fu, arXiv:2601.02508, Supplementary Material). Neither paper prints coordinates. Ketboard builds them from the lattice and rounds them to $10^{-8}$ bohr, corners first and body centres second, the order Fu uses.
- **Hydrogen chain.** $N$ atoms spaced $R=1.8$ bohr apart along $x$, periodic along the chain. The paper does not state the cross-section of the cell; DeepSolid's code (`config/hydrogen_chain.py`) uses a 100-bohr square, and the instances take it.
- **Lithium hydride.** The rock-salt primitive cell of Li, Li and Chen (arXiv:2203.15472, Supplementary Table 7): vectors $(0,\tfrac L2,\tfrac L2)$ and permutations, Li at the origin and H at $(\tfrac L2,\tfrac L2,\tfrac L2)$. It is repeated $2\times2\times2$ times at eight values of $L$ from $3.4$ to $4.8$ Å, and $3\times3\times3$ times at $L=4.061$ Å.
- **Graphene.** The primitive cell of the same paper (Supplementary Table 5: C–C distance $1.421$ Å, $52.9177$ Å, i.e. 100 bohr, of vacuum), repeated $2\times2$ times, at the three inequivalent twists of their $\Gamma$-centred $3\times3$ grid.

The paper does not state the twist of its lithium hydride and hydrogen-chain calculations. The instances use the $\Gamma$ point, which is the default of the DeepSolid code. Gerard et al. state that the lithium hydride calculation used the $\Gamma$ point only (arXiv:2405.07599). Each of these entries records the inference.

## Why these systems

**Dense hydrogen** is the simplest solid: one electron and one proton per atom. At $r_s=1.31$ the protons on a body-centred cubic lattice form an atomic metal "around metallization" (Linteau et al.).
- **Earlier references.** Its quantum Monte Carlo history provides them on the same cells:
  - fixed-node diffusion Monte Carlo with Slater–Jastrow and backflow trial functions (Holzmann et al., arXiv:cond-mat/0304165);
  - reptation Monte Carlo with backflow-augmented PBE orbitals;
  - with quantum protons, coupled electron–ion calculations (Holzmann, Pierleoni, Ceperley, arXiv:cond-mat/0410530).
- **Neural states.** Linteau et al. use a message-passing backflow network over electrons and protons. Fu trains one Fermi Sets network on the equilibrium lattice and three displaced ones. Chai et al. extend the DeepSolid ansatz with a network for the protons (arXiv:2512.17703).
- **Quantum protons.** Variational Monte Carlo treats them without the Born–Oppenheimer approximation, and its convergence does not depend on the nuclear mass as that of projector methods does (Linteau et al.). In the 16- and 54-atom cells the quantum protons raise the neural energy by about 11 mHa per atom (Linteau et al., Tables I and II).

**The hydrogen chain** is the one-dimensional benchmark of the Simons Collaboration on the Many-Electron Problem (Motta et al., arXiv:1705.01608). At $R=1.8$ bohr, close to the minimum of its equation of state (Motta et al.), the Ketboard instances form a size series from 10 to 50 atoms. Li, Li and Chen print the lattice-regularized diffusion Monte Carlo and variational energies of Motta et al. for the same sizes (Supplementary Table 4). In the thermodynamic limit Motta et al. give:
- auxiliary-field QMC: $-0.56569(30)$ Ha per atom;
- lattice-regularized DMC: $-0.56515(3)$ (final equation-of-state table).

These are extrapolations, not entries. Gerard et al. extrapolate their transferable network to $-565.24(2)$ mHa with twist averaging. They show their energies at each size only in a figure.

**Lithium hydride** is an ionic insulator and a common test case of quantum Monte Carlo for solids. Li, Li and Chen computed its equation of state in the $2\times2\times2$ cell. They apply a Hartree–Fock finite-size correction and fit a Birch–Murnaghan equation of state, which gives a lattice constant of $4.022$ Å and a bulk modulus of $36.89$ GPa, against $4.061(1)$ Å and $33$–$38$ GPa from experiment (Supplementary Table 9). The $3\times3\times3$ cell has 108 electrons.

**Graphene** is a two-dimensional semimetal. Its energy in a $2\times2$ cell depends strongly on the twist, as the table below shows. Li, Li and Chen twist-average over a $3\times3$ grid with weights $\tfrac19$, $\tfrac23$, $\tfrac29$ and add a structure-factor correction of $0.00122$ Ha per atom to compare the cohesive energy with experiment.

## Known energies

The tables in this section are generated when the site is built, from the reviewed Ketboard entries and the energies of other methods stored with them; they change when an entry is added. Energies are in Hartree per atom (hydrogen) or per primitive cell (lithium hydride, graphene). Fixed-node diffusion and reptation Monte Carlo energies are upper bounds.

**Dense hydrogen, clamped protons**, body-centred cubic, $r_s=1.31$, $\Gamma$ point:

```ketboard
summary
instances: solid-hydrogen-bcc-rs-1p31-2x2x2-conventional-cells-gamma solid-hydrogen-bcc-rs-1p31-3x3x3-conventional-cells-gamma solid-hydrogen-bcc-rs-1p31-4x4x4-conventional-cells-gamma
row: cell
```

Every entry and reference for the 16-atom cell, where two neural states are on the board:

```ketboard
entries
instances: solid-hydrogen-bcc-rs-1p31-2x2x2-conventional-cells-gamma
```

Fu trained one network on four geometries at once; the other entries were optimized for the lattice alone.

**Dense hydrogen, quantum protons**, same lattices and density:

```ketboard
summary
instances: solid-hydrogen-bcc-rs-1p31-2x2x2-conventional-cells-gamma-quantum-nuclei solid-hydrogen-bcc-rs-1p31-3x3x3-conventional-cells-gamma-quantum-nuclei
row: cell
```

```ketboard
entries
instances: solid-hydrogen-bcc-rs-1p31-3x3x3-conventional-cells-gamma-quantum-nuclei
```

Chai et al. print the standard error of their energy without the autocorrelation correction; their Supplemental Material gives the corrected value, $6.9\times10^{-6}$ Ha per atom.

**Hydrogen chain**, $R=1.8$ bohr, $\Gamma$ point. The references were computed by Motta et al. in a cell with a 40-bohr cross-section; they state that the interaction between periodic images is then below $0.1$ mHa per atom.

```ketboard
summary
instances: solid-hydrogen-linear-chain-r-1p8-bohr-10x1x1-primitive-cells-gamma solid-hydrogen-linear-chain-r-1p8-bohr-18x1x1-primitive-cells-gamma solid-hydrogen-linear-chain-r-1p8-bohr-30x1x1-primitive-cells-gamma solid-hydrogen-linear-chain-r-1p8-bohr-50x1x1-primitive-cells-gamma
row: cell
```

**Lithium hydride**, rock salt, $\Gamma$ point, before the Hartree–Fock finite-size correction:

```ketboard
summary
instances: solid-lithium-hydride-rock-salt-l-3p4-a-2x2x2-primitive-cells-gamma solid-lithium-hydride-rock-salt-l-3p6-a-2x2x2-primitive-cells-gamma solid-lithium-hydride-rock-salt-l-3p8-a-2x2x2-primitive-cells-gamma solid-lithium-hydride-rock-salt-l-4p0-a-2x2x2-primitive-cells-gamma solid-lithium-hydride-rock-salt-l-4p2-a-2x2x2-primitive-cells-gamma solid-lithium-hydride-rock-salt-l-4p4-a-2x2x2-primitive-cells-gamma solid-lithium-hydride-rock-salt-l-4p6-a-2x2x2-primitive-cells-gamma solid-lithium-hydride-rock-salt-l-4p8-a-2x2x2-primitive-cells-gamma solid-lithium-hydride-rock-salt-l-4p061-a-3x3x3-primitive-cells-gamma
row: lattice
```

**Graphene**, $2\times2$ cell, before twist averaging and the structure-factor correction:

```ketboard
summary
instances: solid-graphene-honeycomb-c-c-1p421-a-2x2x1-primitive-cells-gamma solid-graphene-honeycomb-c-c-1p421-a-2x2x1-primitive-cells-k1o3-1o3-0 solid-graphene-honeycomb-c-c-1p421-a-2x2x1-primitive-cells-k2o3-1o3-0
row: twist
```

**Not recorded.**
- **Gerard et al. on graphene** (arXiv:2405.07599). They recompute these graphene twists with one network trained across a $12\times12$ grid of twists. Their energies without corrections, $-76.1572$, $-76.2572$ and $-76.2590$ Ha per cell at $\mathbf k_s=0$, $(\tfrac13,\tfrac13,0)$ and $(\tfrac23,\tfrac13,0)$, are printed without error bars (Supplementary Information). The energies with error bars in their main table include structure-factor and zero-point corrections.
- **Gerard et al. on lithium hydride.** Their energies are twist-averaged on a $5\times5\times5$ grid.
- **Other quantities:**
  - cohesive energies;
  - extrapolations to the thermodynamic limit or to zero variance (Fu, Ren, Chen, arXiv:2308.02471);
  - the three displaced hydrogen geometries of Fu, whose displacements are listed by atom index without the site of each index beyond corners and body centres;
  - enthalpies from cell optimizations at fixed pressure (Chai et al.);
  - calculations in a finite basis set (second quantization).

## Candidates not yet on Ketboard

- **Stretched hydrogen chains.** Li, Li and Chen print the 10-atom chain from $R=1.4$ to $2.8$ with the references of Motta et al. (Supplementary Table 3). The column header says Å, but the values are in bohr: the $1.8$ row equals the $1.8$-bohr entry of Supplementary Table 4. At large $R$ the chain is an insulator (Motta et al.; Gerard et al., Fig. 1b).
- **Other hydrogen lattices.** Linteau et al. print clamped-proton energies in their appendix table for:
  - face-centred cubic (32 atoms), diamond (64 and 8 atoms) and simple cubic (8 atoms) lattices;
  - a 54-atom body-centred cubic cell;
  - $r_s=1.0$ and $1.4$, at the $\Gamma$ point and twist-averaged on a $6\times6\times6$ grid;
  - with reptation Monte Carlo references.

  Each is a single-paper instance.
- **Moiré materials.** Continuum models with a moiré potential have neural-network energies with error bars and exact-diagonalization or Hartree–Fock references, for example Geier et al., arXiv:2502.05383, Table I, and Li et al., arXiv:2406.11134. They are effective Hamiltonians without nuclei and need their own conventions.

## Reporting a result for these instances

1. Give the simulation cell: its lattice vectors and the positions of all nuclei, in bohr or Å, and how they were built (primitive cell and supercell). A cell with different vectors or a different lattice constant is another instance.
2. State the twist. For a twist-averaged result, give the energy at each twist with its error bar, so that each can be an entry.
3. State that the calculation is all-electron, or name the pseudopotential. For quantum nuclei, give the mass and the statistics.
4. Give the energy per primitive cell or per atom, or the total energy of the cell, with its error bar, from a dedicated evaluation run of the final state, as on the [continuous-space page](../continuous-space/). Report finite-size corrections, zero-point energies and twist averages separately.
5. Give the printed digits exactly as in the paper, with the arXiv version, table and row, through the [Ketboard form](../../#submit). "Add an instance like this one" on an instance page starts from its cell and nuclei.

## References

- M. Holzmann, D. M. Ceperley, C. Pierleoni, K. Esler, *Backflow correlations for the electron gas and metallic hydrogen*, Phys. Rev. E 68, 046707 (2003), arXiv:cond-mat/0304165. Fixed-node DMC of static hydrogen.
- M. Holzmann, C. Pierleoni, D. M. Ceperley, *Coupled electron–ion Monte Carlo calculations of atomic hydrogen*, Comput. Phys. Commun. 169, 421 (2005), arXiv:cond-mat/0410530. Quantum protons.
- V. Natoli, R. M. Martin, D. Ceperley, *Crystal structure of molecular hydrogen at high pressure*, Phys. Rev. Lett. 74, 1601 (1995). Cited by Linteau et al. for the Slater–Jastrow DMC energies with LDA orbitals. Not on arXiv.
- M. A. Morales, R. Clay, C. Pierleoni, D. M. Ceperley, *First principles methods: a perspective from quantum Monte Carlo*, Entropy 16, 287 (2014). Backflow-augmented PBE trial functions; the reptation Monte Carlo energies were provided to Linteau et al. by C. Pierleoni.
- M. Motta et al., *Towards the solution of the many-electron problem in real materials: equation of state of the hydrogen chain with state-of-the-art many-body methods*, arXiv:1705.01608 (2017).
- X. Li, Z. Li, J. Chen, *Ab initio calculation of real solids via neural network ansatz*, arXiv:2203.15472 (2022). DeepSolid; hydrogen chains, lithium hydride, graphene.
- W. Fu, W. Ren, J. Chen, *Variance extrapolation method for neural-network variational Monte Carlo*, arXiv:2308.02471 (2023).
- L. Gerard, M. Scherbela, H. Sutterud, W. M. C. Foulkes, P. Grohs, *Transferable neural wavefunctions for solids*, arXiv:2405.07599 (2024).
- D. Linteau, S. Moroni, G. Carleo, M. Holzmann, *Neural wave functions for high-pressure atomic hydrogen*, arXiv:2504.07062 (2025).
- S. Chai, C. Lin, X. Dong, Y. Li, W. Ouyang, L. Wang, X. C. Xie, *Revisiting the broken symmetry phase of solid hydrogen: a neural network variational Monte Carlo study*, arXiv:2512.17703 (2025).
- L. Fu, *Fermi Sets: universal and interpretable neural architectures for fermions*, arXiv:2601.02508 (2026).
