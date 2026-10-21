# Bose–Hubbard model

> **In brief.** The Bose–Hubbard model describes bosons hopping on a lattice with an on-site repulsion. At unit filling on the square lattice it has a quantum phase transition between a superfluid and a Mott insulator at $U_c/J=16.74(1)$. Ketboard compares tori of $L\times L$ sites at unit filling, energy per site in units of $J$, with no cutoff on the occupation of a site. The ground state has no sign problem, so Green-function Monte Carlo gives the exact energy up to a controlled bias where it has been computed. The tables on this page are generated from Ketboard and from those references.

Notation follows the [conventions page](../notation/). Reviewed entries live in [Ketboard](../../#benchmarks?family=Bose%E2%80%93Hubbard), not here.

## Hamiltonian and instances

For bosons with annihilation operators $b_i$ and occupations $n_i=b_i^\dagger b_i$,

$$
H=-J\sum_{\langle i,j\rangle}\left(b_i^\dagger b_j+b_j^\dagger b_i\right)+\frac U2\sum_i n_i(n_i-1),
$$

where $\langle i,j\rangle$ runs over nearest-neighbour bonds, each counted once.

- **Energy.** Energy per site $E/L^2$ in units of $J$. Without interactions the ground-state energy per site is $-4J$ at unit filling on the square lattice.
- **Sector.** The number of bosons $N$ is fixed: canonical, with no chemical-potential term. Unit filling means $N=L^2$. Grand-canonical energies at fixed $\mu$ contain $-\mu N$ and are another quantity.
- **Boundary conditions.** Periodic in both directions.
- **Local Hilbert space.** The occupation of a site is not truncated. A cutoff $n_{\max}$ changes the Hamiltonian, so a calculation with one belongs to an instance that states it: the [submission form](../../#submit) puts $n_{\max}$ in the key. Hard-core bosons ($n_{\max}=1$) are a different model.

**Conventions to check.** Capello, Becca, Fabrizio and Sorella write the hopping as $-\tfrac t2\sum_{\langle i,j\rangle}(b_i^\dagger b_j+\mathrm{h.c.})$ and place the two-dimensional transition at $U_c/t\sim8.5$ (arXiv:0801.0952, Eq. 1). Their $t$ is $2J$, so their $U/t$ is $U/2J$ and their energies in units of $t$ are half those in units of $J$. Several papers write the hopping as $-J\sum_{\langle i,j\rangle}b_ib_j^\dagger$. That is the convention above only if $\langle i,j\rangle$ runs over both orders of each pair, and the paper should say so.

## Why the Bose–Hubbard model

**A transition at the centre of the benchmark.** At unit filling and large $U/J$ each site holds one boson, and the ground state is a Mott insulator with a gap. At small $U/J$ the bosons condense into a superfluid. The transition between the two belongs to the three-dimensional XY universality class. Its position, $J_c/U=0.05974(3)$, i.e. $U_c/J=16.74(1)$, comes from quantum Monte Carlo extrapolated to zero temperature (Capogrosso-Sansone et al., arXiv:0710.2703, as quoted by Denis and Carleo, arXiv:2404.07869). Near $U_c$ the correlations are long-ranged on any finite torus, and variational energies are hardest to converge there. In the V-score analysis of Denis and Carleo, the worst case is on the Mott side of the transition.

**Unbounded occupations.** Unlike spins or fermions, a site can hold any number of bosons. A neural state must represent configurations with multiply occupied sites without a cutoff, or the cutoff becomes part of the problem.

**Exact references.** For $J>0$ the off-diagonal matrix elements of $H$ in the occupation basis are non-positive. The ground state then has non-negative amplitudes, and projector and worldline quantum Monte Carlo methods have no sign problem. Green-function Monte Carlo (GFMC) energies are exact up to a controllable systematic bias (Denis and Carleo). Where they exist, a neural energy can be compared with the exact value, not only with other variational states.

## Known energies

The tables are generated when the site is built, from the reviewed Ketboard entries and the reference energies stored with them; they change when an entry is added. Energies per site in units of $J$.

**$8\times8$, against GFMC.** The GFMC energies are by F. Becca, printed in Table 1 of Denis and Carleo.

```ketboard
summary
instances: bosehubbard-square-8x8-pbc-u8p5-n64 bosehubbard-square-8x8-pbc-u17-n64
```

At $U/J=17$ the neural energy is below the GFMC energy, by less than twice the GFMC error bar. A variational energy below an exact one measures the error bar or the residual bias of the GFMC estimate; it does not violate the variational principle.

**Near the transition, $U/J=16.8$**, from $8\times8$ to $20\times20$:

```ketboard
summary
instances: bosehubbard-square-8x8-pbc-u16p8-n64 bosehubbard-square-12x12-pbc-u16p8-n144 bosehubbard-square-16x16-pbc-u16p8-n256 bosehubbard-square-20x20-pbc-u16p8-n400
row: size
```

Each depth of the residual backflow network that Denis and Carleo print is an entry. On the $20\times20$ torus the energy decreases with the depth $D$:

```ketboard
entries
instances: bosehubbard-square-20x20-pbc-u16p8-n400
```

**$10\times10$**, on both sides of the transition:

```ketboard
summary
instances: bosehubbard-square-10x10-pbc-u16-n100 bosehubbard-square-10x10-pbc-u20-n100
```

**Not recorded.**
- **Pei and Clark.** Denis and Carleo compare their $10\times10$ energies with restricted-Boltzmann-machine variants of Pei and Clark: $-0.5721(3)$ (NQS-OH) at $U/J=16$ and $-0.4068(9)$ (NQS-B) at $U/J=20$, from data shared by S. R. Clark (arXiv:2404.07869, Table 1). Pei and Clark show their energies only in figures (arXiv:2402.15424), so these values are quoted, not entries.
- **Jastrow baselines.** The depth-zero rows of Table 2 of Denis and Carleo are a two-body Jastrow state without a neural network.
- **Figure-only data.** Energies, V-scores and condensate fractions shown only in figures: Denis and Carleo, Figs. 2–5; Saito, arXiv:1707.09723; Saito and Kato, arXiv:1709.05468; Choo et al., arXiv:1807.03325; McBrian, Carleo and Khatami, arXiv:1903.03076; Vargas-Calderón, Vinck-Posada and González, arXiv:2004.12556.
- **Other energies.** Grand-canonical energies, and energies computed by summing over the whole Hilbert space of a few sites without sampling.

## Candidates not yet on Ketboard

- **One-dimensional chains** at unit filling. Exact diagonalization and DMRG references are available, but the neural energies so far are shown in figures.
- **Bosons in a gauge field.** The Hofstadter–Bose–Hubbard model with soft-core or hard-core bosons (Döschl et al., arXiv:2405.04472; Ledinauskas and Anisimovas, arXiv:2405.01981) has neural energies in figures, compared with exact diagonalization and DMRG.
- **Z₂ lattice gauge theory with hard-core bosons** (Kebrič et al., arXiv:2602.13192). The Supplementary Material tabulates DMRG and neural energies on a $5\times4$ cylinder, and two neural architectures on a $6\times6$ torus. These are hard-core bosons coupled to gauge fields, a model of its own.

## Reporting a result for these instances

1. State the Hamiltonian with its hopping convention, the lattice $L\times L$ with periodic boundaries, and $N$.
2. State whether the occupation per site is truncated, and at which $n_{\max}$; a truncated calculation belongs to the instance with that cutoff.
3. Give the energy per site in units of $J$ with its error bar, from a dedicated evaluation of the final state, and the number of samples; the [binning analysis](../variational-monte-carlo/) applies.
4. Report the variance or the V-score if available (Wu et al., arXiv:2302.04919).
5. Give the printed digits exactly as in the paper, with the arXiv version, table and row, through the [Ketboard form](../../#submit). "Add an instance like this one" on an instance page starts from its lattice, $U/J$ and $N$.

## References

- B. Capogrosso-Sansone, Ş. G. Söyler, N. Prokof'ev, B. Svistunov, *Monte Carlo study of the two-dimensional Bose-Hubbard model*, arXiv:0710.2703 (2007). The critical point at unit filling.
- M. Capello, F. Becca, M. Fabrizio, S. Sorella, *Mott transition in bosonic systems: insights from the variational approach*, arXiv:0801.0952 (2008). Jastrow wave functions; the hopping written as $-\tfrac t2\sum$.
- H. Saito, *Solving the Bose–Hubbard model with machine learning*, arXiv:1707.09723 (2017).
- H. Saito, M. Kato, *Machine learning technique to find quantum many-body ground states of bosons on a lattice*, arXiv:1709.05468 (2017).
- K. Choo, G. Carleo, N. Regnault, T. Neupert, *Symmetries and many-body excited states with neural-network quantum states*, arXiv:1807.03325 (2018).
- K. McBrian, G. Carleo, E. Khatami, *Ground state phase diagram of the one-dimensional Bose-Hubbard model from restricted Boltzmann machines*, arXiv:1903.03076 (2019).
- V. Vargas-Calderón, H. Vinck-Posada, F. A. González, *Phase diagram reconstruction of the Bose-Hubbard model with a restricted Boltzmann machine wavefunction*, arXiv:2004.12556 (2020).
- D. Wu et al., *Variational benchmarks for quantum many-body problems*, arXiv:2302.04919 (2023). The V-score.
- M. Y. Pei, S. R. Clark, *Specialising neural-network quantum states for the Bose Hubbard model*, arXiv:2402.15424 (2024).
- Z. Denis, G. Carleo, *Accurate neural quantum states for interacting lattice bosons*, arXiv:2404.07869 (2024). Neural backflow Jastrow states up to $20\times20$, without truncation.
- E. Ledinauskas, E. Anisimovas, *Universal performance gap of neural quantum states applied to the Hofstadter-Bose-Hubbard model*, arXiv:2405.01981 (2024).
- F. Döschl, F. A. Palm, H. Lange, F. Grusdt, A. Bohrdt, *Neural network quantum states for the interacting Hofstadter model with higher local occupations and long-range interactions*, arXiv:2405.04472 (2024).
- M. Kebrič, F. Döschl, U. Borla, J. C. Halimeh, U. Schollwöck, A. Bohrdt, F. Grusdt, *Matter-induced plaquette terms in a $\mathbb{Z}_2$ lattice gauge theory*, arXiv:2602.13192 (2026).
