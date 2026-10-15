# Benchmark conventions

A benchmark is a precise physical problem. Ketboard compares original, directly evaluated NQS variational energies for the same problem.

## Fix the Hamiltonian

State the operators, couplings, energy units, and any constant offset. For example, a spin-half Heisenberg Hamiltonian written with spin operators is

$$
H=J\sum_{\langle i,j\rangle}\mathbf{S}_i\cdot\mathbf{S}_j,
\qquad \mathbf{S}_i=\frac{1}{2}\boldsymbol{\sigma}_i.
$$

Replacing $\mathbf{S}$ by Pauli operators without adjusting the coefficient changes the Hamiltonian. Also specify how bonds are counted.

## Fix the instance

Record the lattice and its primitive vectors or bond list, number of sites, boundary conditions, coupling values, and symmetry or particle-number sector. A cylinder and a torus are different benchmarks. Finite clusters and thermodynamic extrapolations are different quantities.

## Energy and uncertainty

For a system with $N$ sites, the per-site energy is

$$
e=\frac{E}{N},\qquad \delta e=\frac{\delta E}{N}.
$$

Keep the printed energy and uncertainty as decimal strings. State whether an uncertainty is a standard error, standard deviation, confidence interval, or an unspecified reported uncertainty. Missing error bars remain unknown.

A numerical ordering of estimates does not establish a statistically significant improvement. Ketboard displays the reported uncertainty and its interpretation alongside the energy.

## Eligibility

Accepted results evaluate $\langle\Psi_\theta|H|\Psi_\theta\rangle/\langle\Psi_\theta|\Psi_\theta\rangle$ for an explicit neural variational state. Neural fermionic wavefunctions and neural backflow can qualify.

Excluded results include non-NQS states, projection-method energies, extrapolated energies, and comparison values credited to earlier papers. A neural guide or sampler alone does not make a projected calculation an NQS variational result.

## Provenance and review

Every entry links to an exact paper version and source location. Both bot discoveries and human submissions enter through GitHub pull requests. Curators check the transcription, eligibility, and instance matching before merge. This review is distinct from independent reproduction.
