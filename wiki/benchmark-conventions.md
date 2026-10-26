# Benchmark conventions

> **In brief.** Ketboard compares energies only between calculations of the same explicitly defined problem. An entry is a directly evaluated variational energy of a neural quantum state, with its uncertainty, its paper version and its location in the paper. Extrapolations, projections and numbers quoted from other papers are not entries.

Notation follows the [conventions page](../notation/).

## An instance is a complete specification

A benchmark instance fixes everything that changes the number:

1. **Hamiltonian and operator convention.** The operators ($\mathbf S$ versus $\boldsymbol\sigma$, fermionic sign conventions), every coupling with its value and sign, and any constant offset. For spin-$\tfrac12$ bilinear terms the Pauli convention gives energies four times larger than the spin convention.
2. **Lattice, cluster and boundaries.** Primitive vectors or an explicit bond list, the number of sites, and periodic, open, cylindrical or twisted boundaries. A $10\times10$ torus and a $10\times10$ cylinder are different instances. Bond counting must be stated: each undirected bond once.
3. **Sector.** Total $S^z$, particle numbers, momentum and point-group representation when the calculation is restricted to one. For bosons, also the cutoff on the occupation of a site, if any, since it changes the Hamiltonian. A projected state is reported as the energy of the projected state, with the group named.
4. **Normalization and units.** Energy per site or total, and the coupling that sets the unit.

Each instance has a key such as `j1j2-square-10x10-pbc-j2-0p5-sz0` that appears on the board and in the data files. Instances of the same model with different sizes or couplings share the system name and are listed separately.

## Instances in continuous space

For the homogeneous electron gas an instance fixes the dimension, the number of electrons $N$ and its spin polarization ($N_\uparrow$, $N_\downarrow$), the density $r_s$, the shape of the simulation cell (simple cubic, body-centred cubic, rectangular, rhombic), and the boundary condition. The cell shape matters: at $N=27$ and $r_s=1$ a body-centred cubic cell and a simple cubic cell differ by $0.2$ Ha per electron. Energies are in Hartree per electron, with the Coulomb interaction summed by Ewald's method, a uniform neutralizing background and the Madelung self-image term included; sources in Rydberg are converted with a factor $\tfrac12$. The [electron gas page](../homogeneous-electron-gas/) lists the cells and densities on Ketboard and the known energies.

The electron-gas instances are at the $\Gamma$ point. A twist-averaged energy is a different instance from the $\Gamma$-point one at the same $N$ and $r_s$. A single twist other than $\Gamma$ is an instance only when it is a point of a stated twist grid, as for the graphene instances on the [solids page](../solids/). Energies with an analytic finite-size correction added, extrapolations to $N\to\infty$, and correlation energies relative to a Hartree–Fock energy that the paper does not print are not entries.

Other systems in continuous space are described the same way, in first quantization: the particles and their spin populations, the space (a periodic cell or free space), the external potential, the interaction, and the energy unit. For a quantum dot the instance fixes the trap frequency $\omega$ and the electron numbers $N_\uparrow$, $N_\downarrow$. For an atom or a molecule it fixes the nuclei (charges and positions, in bohr or ångström), the electron numbers and hence the charge and spin, and the geometry; two bond lengths are two instances. A crystal fixes the lattice vectors of the simulation cell, every nucleus in it, the twist and the pseudopotential, if any; its energy is per primitive cell or per atom, and the cell is neutral, so no background enters (see the [solids page](../solids/)). Nuclei are fixed point charges (Born–Oppenheimer, no relativistic terms), unless the instance treats them as quantum particles of stated mass, and the energy of a molecule is the total electronic energy including the nuclear repulsion, in Hartree, not divided by the number of electrons. Results in a basis set (second quantization) are a different problem from the first-quantized one and are not compared with it. The [continuous-space page](../continuous-space/) explains the ansätze and estimators for these systems, and the [molecules page](../molecules/) lists the molecular instances. Optimizers in continuous space often clip outlying local energies; the reported energy must come from an evaluation without clipping, since a clipped mean is not the variational energy.

## What is reported

- The variational energy $E_\theta=\langle\Psi_\theta|H|\Psi_\theta\rangle/\langle\Psi_\theta|\Psi_\theta\rangle$, evaluated on the final fixed state with its own Monte Carlo run. Not the last value of the optimization trace.
- The statistical uncertainty, with its meaning: one standard error of the mean from a [binning analysis](../variational-monte-carlo/), a standard deviation, a confidence interval, or an unspecified reported uncertainty. Every entry must have one; an energy printed without an error bar is not accepted. A bound stated in the text, such as a caption saying that statistical errors are below the last printed digit, counts and is recorded as an upper bound.
- The energy variance $\operatorname{Var}_\theta(H)$, optional, recorded in the same normalization as the energy ($\operatorname{Var}_\theta(H)/N$ for a per-site energy) when the paper prints it. It is the only intrinsic accuracy measure when $E_0$ is unknown, and with a reference energy $E_\infty$ it gives the V-score $N\operatorname{Var}_\theta(H)/(E-E_\infty)^2$ of Wu et al. (arXiv:2302.04919).
- The printed digits exactly as they appear, as a decimal string, with the parenthesized uncertainty preserved in the original token. The site converts total energies to energies per site. When the source uses another operator convention than the instance, for example Pauli matrices for a spin-$\tfrac12$ Heisenberg instance defined with $\mathbf S=\boldsymbol\sigma/2$, the entry records the printed value and a conversion factor ($\tfrac14$ in that example; the variance takes its square), and the board shows the converted value.
- The number of parameters, the architecture class, the symmetry treatment and the sampling budget, when available.

## Eligibility

An entry represents a state $|\Psi_\theta\rangle$ whose amplitude is given by a neural network, possibly multiplied by a determinant, Pfaffian, Jastrow factor or sign prior, and whose energy is the expectation value of $H$ in that state. Lanczos-improved states $(1+\alpha_1H+\dots)|\Psi_\theta\rangle$ with explicitly evaluated energies qualify.

Not eligible: energies extrapolated in the variance, the system size, the bond dimension or the number of Lanczos steps; energies from projection methods (Green's function, diffusion or auxiliary-field Monte Carlo) even when a neural state is the guiding function; non-neural variational states; and comparison values credited to earlier work. Such numbers belong in the benchmark pages as context, clearly marked.

## Comparing entries

The variational energy is an upper bound, so a lower energy is a better bound. It is not evidence that one method is better in general: results differ in parameter count, sampling budget, symmetry projection and optimization time, and differences within one or two standard errors are not resolved. Ketboard orders by energy and shows the uncertainty next to it; the reader draws the conclusion.

Two caveats specific to this field. The sample mean of the local energy can lie below $E_0$ by a statistical fluctuation; this is not a violation of the variational principle. And an energy quoted to more digits than its uncertainty supports is recorded as printed, with the uncertainty displayed alongside.

## Provenance and review

Every entry links to a specific arXiv version and to a table, figure or equation in it, or to the data release published with that paper version: the Varbench energies (arXiv:2302.04919), and the recurrent-network energies that Moss et al. only plot (arXiv:2502.17144, arXiv:2505.20406), are recorded from the files of their data repositories, with the file and commit named in the entry. Bot-proposed entries carry a checksum of the source file; human entries carry the exact versioned source URL. A curator checks eligibility, instance matching and transcription before merging. Review confirms that the number is what the paper says for the problem the instance defines; it is not an independent reproduction.

## Adding an instance

Propose the definition in `data/benchmarks.json` with the result that needs it: the symbolic Hamiltonian in LaTeX, the parameter values, the cluster, the boundaries, the sector, the unit, and a plain-text statement of every convention. Keep the system name free of sizes and couplings; put those in the instance label. A benchmark page in the wiki, linked from the instance, gives the physics context and the non-variational reference values.
