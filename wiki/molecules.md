# Molecules

> **In brief.** For atoms and molecules Ketboard compares the total energy of the all-electron, nonrelativistic Hamiltonian with clamped nuclei, at a fixed geometry and in a fixed spin sector. The instances are those at which neural-network papers print energies with error bars: atoms from lithium to argon, potassium and four transition metals, with some of their cations; small molecules at the geometries printed by Pfau et al. and by von Glehn et al., from LiH to carbon tetrachloride; cyclobutadiene at its rectangular minimum and its square transition state; and systems studied by one paper, such as rectangular H₄ and the potential curves of LiH and BeO. The tables below are generated from Ketboard and from the energies of other methods recorded with it, so they always show the current lowest neural energy, how it compares with the exact energy or an estimate where one exists, and the cyclobutadiene barrier of each state.

Notation follows the [conventions page](../notation/). The [continuous-space page](../continuous-space/) explains the ansätze, cusps, the Laplacian in the local energy and pretraining. Reviewed entries live in [Ketboard](../../#benchmarks?family=Atoms%20and%20molecules), not here.

## Hamiltonian and instances

In Hartree atomic units, for electrons at positions $\mathbf r_i$ and nuclei of charge $Z_A$ fixed at $\mathbf R_A$,

$$
H=\sum_i\Bigl(-\tfrac12\nabla_i^2-\sum_A\frac{Z_A}{|\mathbf r_i-\mathbf R_A|}\Bigr)+\sum_{i<j}\frac{1}{|\mathbf r_i-\mathbf r_j|}+\sum_{A<B}\frac{Z_AZ_B}{|\mathbf R_A-\mathbf R_B|}.
$$

- **Energy.** The total energy, including the repulsion between nuclei, in Hartree, not divided by the number of electrons.
- **Hamiltonian.** All electrons, no pseudopotential or effective core potential, no relativistic terms. A calculation with a pseudopotential, or in a finite basis set (second quantization), solves another problem and is not an entry.
- **Geometry.** The positions of the nuclei are part of the instance. Two bond lengths, or two sources for "the equilibrium geometry", are two instances.
- **Spin.** $N_\uparrow$ and $N_\downarrow$ are fixed. The closed-shell molecules have $N_\uparrow=N_\downarrow$. An open-shell atom is an instance in the sector $M_S=S$ of its ground term, $N_\uparrow-N_\downarrow=2S$, which is the sector that FermiNet-family codes assign by Hund's rule; the same atom in a lower $M_S$ has the same exact energy but is another instance. Most papers do not print $N_\uparrow$ and $N_\downarrow$ for atoms, and each entry says whether its sector is stated, implied by the ground term, or inferred from the code.

**Geometries.** N₂ at $R=2.068$ bohr, LiH at $3.015$, Li₂ at $5.051$ and CO at $2.173$ bohr, as in Pfau et al. (arXiv:1909.02487, Table II); NH₃, CH₄, ethene, methylamine, ozone and bicyclobutane at the G3 geometries printed by Pfau et al. (Tables VII to XIII); benzene, toluene, naphthalene and CCl₄ at the G3 geometries printed by von Glehn, Spencer and Pfau (arXiv:2211.13672, Table VIII); cyclobutadiene at the rectangular $D_{2h}$ minimum and the square $D_{4h}$ transition state distributed with the FermiNet code (`configs/organic.py`). Atoms have their nucleus at the origin. The coordinates are stored with each Ketboard instance, with their unit: bohr, except for methylamine and for the water molecule of Schätzle, Hermann and Noé (arXiv:2010.05316, Table VII), which are in ångström. Pfau et al. head the methylamine table "Position ($a_0$)", but the numbers are in ångström: the C–N distance they give is $1.464$, the bond length of methylamine in ångström, which read in bohr would be $0.775$ Å. Later papers state that they use the geometries of Pfau et al. or of von Glehn et al.; each entry records that statement. None of the papers with entries prints the cyclobutadiene coordinates. The FermiNet code distributes them with a comment attributing them to MR-BWCCSD(T) optimizations of Bhaskaran-Nair et al. and identifying them with those of PauliNet (Hermann, Schätzle, Noé, arXiv:1909.08423), and Ren et al. state that they used that code's cyclobutadiene setup (arXiv:2204.13903, Supplementary Note 9). That the cyclobutadiene entries share one geometry is therefore an inference, and the entries say so.

## Why these molecules

**Atoms** isolate the electron correlation of a single centre and have the most precise references: estimates of the exact nonrelativistic energies by Chakravorty et al. (Phys. Rev. A 47, 3649 (1993)), as printed by Pfau et al. (Table I) and Jiang et al. (arXiv:2508.02570, Supplementary Table 4). These are estimates, not bounds: the variational energies of Jiang et al. for neon to argon lie below them. Ionization energies, the difference between an atom and its cation, test whether the error of an ansatz is the same with one electron fewer (von Glehn et al., Table I; Li et al., arXiv:2307.08214, Supplementary Table 7). V⁺, Co⁺ and Ni⁺ are not instances: the FermiNet code gives a cation the spin of the isoelectronic neutral atom, which for these three is not the ground term, and the papers do not say which sector they used.

**N₂** is the reference case for a triple bond. At equilibrium the correlation is mostly dynamic and an estimate of the exact nonrelativistic energy exists, $-109.542347$ Ha (Pfau et al., Table II, from Filippi and Umrigar, J. Chem. Phys. 105, 213 (1996)), so the error of an entry is known in absolute terms. Stretching the bond makes the problem strongly multireference; see below for why the stretched geometry is not yet an instance.

**Ozone and bicyclobutane** are among the molecules of the original FermiNet benchmark where the network was furthest from CCSD(T) extrapolated to the complete basis: it recovered $98.42$ and $96.94$ per cent of the correlation energy relative to CCSD(T)/CBS, $19$ and $31$ mHa short (Pfau et al., Table II). Ozone has a ground state with partial diradical character, for which single-reference coupled cluster is a less certain reference; bicyclobutane is a strained bicyclic hydrocarbon with 30 electrons.

**Benzene** tests size: with 42 electrons it is among the largest molecules for which several neural states have been optimized at the same geometry, and a self-attention network lowered the FermiNet energy by about $20$ mHa (von Glehn et al., Table II).

**Cyclobutadiene** is antiaromatic. Its square $D_{4h}$ structure, the transition state of the automerization between the two rectangular minima, has strong diradical character, and single-reference methods fail there: CCSD(T) gives barriers of $15.8$ and $18.3$ kcal/mol in the cc-pVDZ and cc-pVTZ bases (as tabulated by Jiang et al., arXiv:2508.02570, Supplementary Table 8), against a theoretical best estimate of $8.93$ kcal/mol in the aug-cc-pVTZ basis, based on CCSDTQ (Monino et al., arXiv:2204.05098, Table II). That estimate is for geometries optimized at the CC3/aug-cc-pVTZ level, not those of the Ketboard instances. Experiment places the barrier between $1.6$ and $10$ kcal/mol (Whitman and Carpenter, J. Am. Chem. Soc. 104, 6473 (1982), as quoted by Monino et al.).

## Known energies

The tables in this section are generated when the site is built, from the reviewed Ketboard entries and from the energies of other methods stored with them; they change when an entry is added. Total energies are in Hartree. Pfau et al. used the original FermiNet with 16 block-diagonal determinants; von Glehn et al. reran FermiNet with dense determinants in a small and a large configuration and introduced the Psiformer. CCSD(T) extrapolated to the complete basis is not an upper bound, and for ozone its own error is not small, so a distance to it is not an error.

```ketboard
summary
instances: mol-lih-r-3p015-bohr-s0 mol-li2-r-5p051-bohr-s0 mol-co-r-2p173-bohr-s0 mol-n2-r-2p068-bohr-s0 mol-nh3-g3-s0 mol-ch4-g3-s0 mol-ethene-g3-s0 mol-methylamine-g3-s0 mol-ozone-g3-s0 mol-bicyclobutane-g3-s0 mol-benzene-g3-s0 mol-toluene-g3-s0 mol-naphthalene-g3-s0 mol-ccl4-g3-s0 mol-cyclobutadiene-rectangle-s0 mol-cyclobutadiene-square-s0
row: molecule
```

**Atoms**, against the estimates of Chakravorty et al. where they are printed; for potassium and the transition metals no estimate of the exact energy is printed with the entries.

```ketboard
summary
instances: mol-li-isolated-atom-s1 mol-be-isolated-atom-s0 mol-b-isolated-atom-s1 mol-c-isolated-atom-s2 mol-c-isolated-atom-q1-s1 mol-n-isolated-atom-s3 mol-o-isolated-atom-s2 mol-f-isolated-atom-s1 mol-ne-isolated-atom-s0 mol-na-isolated-atom-s1 mol-mg-isolated-atom-s0 mol-al-isolated-atom-s1 mol-si-isolated-atom-s2 mol-p-isolated-atom-s3 mol-s-isolated-atom-s2 mol-cl-isolated-atom-s1 mol-ar-isolated-atom-s0 mol-k-isolated-atom-s1 mol-k-isolated-atom-q1-s0 mol-v-isolated-atom-s3 mol-fe-isolated-atom-s4 mol-fe-isolated-atom-q1-s5 mol-co-isolated-atom-s3 mol-ni-isolated-atom-s2 mol-zn-isolated-atom-s0 mol-zn-isolated-atom-q1-s1
```

**N₂, $R=2.068$ bohr**, every entry against the estimated exact energy:

```ketboard
entries
instances: mol-n2-r-2p068-bohr-s0
```

**Cyclobutadiene.** The barrier is the difference between the two instances for the same state, i.e. the same paper and variant. Errors largely cancel between the two geometries, so the barriers of different entries are much closer than their total energies.

```ketboard
difference
instances: mol-cyclobutadiene-square-s0 mol-cyclobutadiene-rectangle-s0
row: molecule
scale: 627.509
unit: kcal/mol
```

Jiang et al. extrapolate their energies in the network size to a barrier of $9.2$ kcal/mol; an extrapolated energy is not an entry.

**Not recorded.** Totals printed without an error bar (Gerard et al., arXiv:2205.09438; the larger networks of Jiang et al., Supplementary Table 7); scaling-law extrapolations; diffusion Monte Carlo energies with a neural trial function, which are projector energies (Ren et al.); values quoted from other papers, such as the FermiNet cyclobutadiene energies of Spencer et al. (arXiv:2011.07125) reproduced by Ren et al.; energies at other geometries, such as N₂ at $2.016$ bohr (Goldshlager, Abrahamsen, Lin, arXiv:2401.10190) or benzene at unstated or different geometries; ethanol, of which Pfau et al. print eight of the nine atoms (Table XII); molecules whose coordinates are not printed in the paper, such as the bond-breaking paths and LiCN geometries of NucleoNet (arXiv:2610.12985, Tables S6 and S7) and the reaction and dimer sets of Li et al.; ground states of multi-state calculations (Pfau et al., arXiv:2308.16848) and of networks trained jointly on many systems; atoms computed in a lower $M_S$ sector than the instance (C, N and O of Entwistle et al., arXiv:2203.09472); energies printed per atom (the widely spaced hydrogen chains of Pfau et al., Table VI); values printed without their minus sign; and calculations with pseudopotentials or in a finite basis set.

## Candidates not yet on Ketboard

- **Stretched N₂.** At $R=4.0$ bohr the bond is broken and the state strongly multireference. The references are an r12-MR-ACPF energy of $-109.1947$ Ha and $-109.2021$ Ha derived from an experimental potential curve (both as tabulated by J. Lin, Goldshlager, L. Lin, arXiv:2112.03491, Table VII), which disagree by $7$ mHa. The neural energies printed at this geometry have no error bars, so the instance would start empty.
- **Hydrogen chains.** H₁₀ at spacings from $1.8$ to $3.6$ bohr has accurate references from AFQMC, DMRG and MRCI (Motta et al., arXiv:1705.01608, Table III), but only one neural entry with an error bar.

## Reporting a result for these instances

1. Use the coordinates of the instance, in the unit stored with it, and say so; a geometry from another source or another optimization is another instance.
2. State that the calculation is all-electron and nonrelativistic, and give $N_\uparrow$ and $N_\downarrow$; for an open-shell atom, the sector is part of the instance.
3. Give the total energy with its error bar, from a dedicated evaluation run of the final state without clipping of the local energy, as on the [continuous-space page](../continuous-space/).
4. Do not submit energies from diffusion Monte Carlo with the neural state as trial function, extrapolations in the network size, or values quoted from other papers.
5. Give the printed digits exactly as in the paper, with the arXiv version, table and row, through the [Ketboard form](../../#submit); "Add an instance like this one" on an instance page starts from its coordinates.

## References

- S. J. Chakravorty, S. R. Gwaltney, E. R. Davidson, F. A. Parpia, C. F. Fischer, *Ground-state correlation energies for atomic ions with 3 to 18 electrons*, Phys. Rev. A 47, 3649 (1993). Estimated exact nonrelativistic energies of the atoms.
- C. Filippi, C. J. Umrigar, *Multiconfiguration wave functions for quantum Monte Carlo calculations of first-row diatomic molecules*, J. Chem. Phys. 105, 213 (1996).
- D. W. Whitman, B. K. Carpenter, *Limits on the activation parameters for automerization of cyclobutadiene-1,2-d2*, J. Am. Chem. Soc. 104, 6473 (1982).
- M. Motta et al., *Towards the solution of the many-electron problem in real materials: equation of state of the hydrogen chain with state-of-the-art many-body methods*, arXiv:1705.01608 (2017).
- D. Pfau, J. S. Spencer, A. G. D. G. Matthews, W. M. C. Foulkes, *Ab initio solution of the many-electron Schrödinger equation with deep neural networks*, arXiv:1909.02487 (2019). FermiNet; Table II and the G3 coordinates of Appendix G.
- J. Hermann, Z. Schätzle, F. Noé, *Deep neural network solution of the electronic Schrödinger equation*, arXiv:1909.08423 (2019). PauliNet.
- Z. Schätzle, J. Hermann, F. Noé, *Convergence to the fixed-node limit in deep variational Monte Carlo*, arXiv:2010.05316 (2020). PauliNet on H₂ and water; the water geometry of Table VII.
- J. S. Spencer, D. Pfau, A. Botev, W. M. C. Foulkes, *Better, faster fermionic neural networks*, arXiv:2011.07125 (2020). FermiNet in JAX; cyclobutadiene automerization.
- J. Lin, G. Goldshlager, L. Lin, *Explicitly antisymmetrized neural network layers for variational Monte Carlo simulation*, arXiv:2112.03491 (2021).
- M. Entwistle, Z. Schätzle, P. A. Erdman, J. Hermann, F. Noé, *Electronic excited states in deep variational Monte Carlo*, arXiv:2203.09472 (2022). Atoms in the sectors of their CASSCF baselines (Supplementary Table VIII).
- W. Ren, W. Fu, X. Wu, J. Chen, *Towards the ground state of molecules via diffusion Monte Carlo on neural networks*, arXiv:2204.13903 (2022).
- E. Monino, M. Boggio-Pasqua, A. Scemama, D. Jacquemin, P.-F. Loos, *Reference energies for cyclobutadiene: automerization and excited states*, arXiv:2204.05098 (2022).
- L. Gerard, M. Scherbela, P. Marquetand, P. Grohs, *Gold-standard solutions to the Schrödinger equation using deep learning: how much physics do we need?*, arXiv:2205.09438 (2022).
- I. von Glehn, J. S. Spencer, D. Pfau, *A self-attention ansatz for ab-initio quantum chemistry*, arXiv:2211.13672 (2022). Psiformer; FermiNet small and large with dense determinants.
- R. Li et al., *Forward Laplacian: a new computational framework for neural network-based variational Monte Carlo*, arXiv:2307.08214 (2023). LapNet.
- D. Pfau, S. Axelrod, H. Sutterud, I. von Glehn, J. S. Spencer, *Accurate computation of quantum excited states with neural networks*, arXiv:2308.16848 (2023). Multi-state natural excited states VMC.
- G. Goldshlager, N. Abrahamsen, L. Lin, *A Kaczmarz-inspired approach to accelerate the optimization of neural network wavefunctions*, arXiv:2401.10190 (2024).
- D. Jiang et al., *Neural scaling laws surpass chemical accuracy for the many-electron Schrödinger equation*, arXiv:2508.02570 (2025). LAVA.
- Q. Gao, Y. Huang, E. Hou, Y. Liu, J. Chen, H. Wang, *NucleoNet: a nuclear-aware determinant ansatz for multi-geometry neural variational Monte Carlo*, arXiv:2610.12985 (2026).
