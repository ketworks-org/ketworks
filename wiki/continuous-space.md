# Neural quantum states in continuous space

> **In brief.** In first quantization a configuration is the list of particle positions, and the wavefunction is a function of $dN$ real coordinates instead of a table over a discrete basis. Everything on the lattice pages carries over: the network gives $\log\Psi_\theta$, variational Monte Carlo samples $|\Psi_\theta|^2$, and the same optimizers apply. Four things change. Fermionic antisymmetry is built from determinants whose orbitals depend on all positions through permutation-equivariant networks. The kinetic energy puts the Laplacian of the network in the local energy. Coulomb singularities impose cusp conditions on the wavefunction. A periodic system needs periodic inputs and Ewald sums. Ketboard compares energies per electron for extended systems such as the [electron gas](../homogeneous-electron-gas/) and total energies for finite ones such as molecules and quantum dots.

Notation follows the [conventions page](../notation/).

## Configurations and Hamiltonian

A configuration of $N$ particles in $d$ dimensions is $\mathbf R=(\mathbf r_1,\dots,\mathbf r_N)$, $\mathbf r_i\in\mathbb R^d$ or a point of a periodic cell, and the state is the function $\Psi_\theta(\mathbf R)$. For electrons with a spin-independent Hamiltonian the spin coordinates can be fixed: the first $N_\uparrow$ positions belong to spin-up electrons and the remaining $N_\downarrow$ to spin-down ones, and $\Psi_\theta$ only has to be antisymmetric under exchanges within each group. Every expectation value of a spin-independent operator is the same as for the fully antisymmetrized state. An instance therefore fixes $N_\uparrow$ and $N_\downarrow$, i.e. the $S^z$ sector; total spin is not imposed.

In Hartree atomic units ($\hbar=m_e=e=4\pi\varepsilon_0=1$, energies in Hartree, lengths in bohr)

$$
H=-\frac12\sum_{i=1}^{N}\nabla_i^2+\sum_{i}v_{\mathrm{ext}}(\mathbf r_i)+\sum_{i<j}\frac{1}{|\mathbf r_i-\mathbf r_j|},
$$

with $v_{\mathrm{ext}}$ the potential of fixed nuclei, a harmonic trap, or a uniform neutralizing background. One Hartree is two Rydberg; papers on the electron gas often print Rydberg. The [benchmark conventions](../benchmark-conventions/) list what an instance in continuous space must specify.

## Antisymmetry: determinants of equivariant orbitals

A Slater determinant $\det[\phi_k(\mathbf r_i)]$ is antisymmetric, but its nodal surface, where $\Psi=0$, is that of a mean-field state, and a positive Jastrow factor $e^{J(\mathbf R)}$ cannot move it. The neural ansätze in use keep the determinant and let every orbital depend on all positions:

$$
\Psi_\theta(\mathbf R)=\sum_{k=1}^{n_{\det}}\det\Bigl[\phi^{k}_{\mu}\bigl(\mathbf r_i;\{\mathbf r_{/i}\}\bigr)\Bigr]_{\mu,i},
$$

where $\{\mathbf r_{/i}\}$ is the set of the other positions. The determinant stays antisymmetric as long as each orbital is symmetric under permutations of the other particles; the network has to be permutation-equivariant, mapping a permutation of its inputs to the same permutation of its outputs. This is the continuum form of the backflow idea on the [fermionic states page](../fermionic-neural-states/), and with enough determinants it represents any antisymmetric function (Pfau et al., arXiv:1909.02487, Appendix B).

The architectures differ in how the equivariant features are built:

- **FermiNet** runs a one-electron stream (positions relative to the nuclei and their norms) and a two-electron stream (relative positions $\mathbf r_i-\mathbf r_j$ and distances), and at each layer concatenates each electron's features with the means over the electrons of each spin (Pfau, Spencer, Matthews, Foulkes, arXiv:1909.02487, Sec. II A). Orbitals are multiplied by exponentially decaying envelopes so that the state is normalizable. A JAX implementation with a simplified network cut the training cost by an order of magnitude (Spencer, Pfau, Botev, Foulkes, arXiv:2011.07125).
- **PauliNet** starts from a multireference Hartree–Fock expansion, adds a neural backflow and a neural Jastrow factor, and builds the cusp conditions in: the nuclear cusps through corrected molecular orbitals and the electronic cusps through a fixed cusp function, with cuspless networks on top (Hermann, Schätzle, Noé, arXiv:1909.08423).
- **Psiformer** replaces the FermiNet layers by self-attention over the electrons (von Glehn, Spencer, Pfau, arXiv:2211.13672).
- **Message passing.** For the electron gas, graph networks pass messages along all electron pairs and produce backflow coordinates for plane-wave orbitals (Pescia et al., arXiv:2305.07240).

The determinant fixes the cost: $O(N^3)$ per evaluation, and every orbital changes when one electron moves, so the low-rank updates of Slater–Jastrow codes do not apply and these ansätze are usually sampled with moves of all electrons at once.

## Cusps

The Coulomb potential diverges when two particles meet. The local energy stays finite only if the wavefunction has a cusp there that cancels the divergence (Kato, Commun. Pure Appl. Math. 10, 151 (1957)). For two electrons of opposite spin in three dimensions the spherically averaged wavefunction behaves as $\Psi\propto1+\tfrac12 r_{ij}$ at small separation $r_{ij}$; for parallel spins, where $\Psi$ vanishes linearly, the coefficient is $\tfrac14$. Networks with smooth activations do not produce a cusp by themselves. FermiNet supplies distances $|\mathbf r_i-\mathbf r_j|$ as inputs, from which the network can build an approximate cusp; PauliNet and many later ansätze multiply by a Jastrow factor that satisfies the cusp conditions exactly. A violated cusp does not bias the variational energy, but it makes the local energy heavy-tailed near coalescence, which inflates the variance and the error bar.

## The local energy

With $\Psi_\theta=e^{\log\Psi_\theta}$ the kinetic term becomes

$$
E_{\mathrm{loc}}(\mathbf R)=-\frac12\sum_{i=1}^{N}\Bigl[\nabla_i^2\log\Psi_\theta(\mathbf R)+\bigl(\nabla_i\log\Psi_\theta(\mathbf R)\bigr)^2\Bigr]+V(\mathbf R),
$$

which is the continuum version of the sum over connected configurations on the [variational Monte Carlo page](../variational-monte-carlo/). There is no sum over matrix elements; instead each local energy needs the gradient and the Laplacian of the network with respect to its $dN$ inputs. With automatic differentiation the Laplacian is the trace of the Hessian, computed column by column with $dN$ Hessian-vector products, so a local energy costs $O(dN)$ network passes. Li et al. identify this Laplacian as the bottleneck of neural-network VMC; their Forward Laplacian propagates the value, the gradient and the Laplacian through the network in a single forward pass and reports a speed-up of more than an order of magnitude (arXiv:2307.08214).

The zero-variance property holds as on the lattice. Because the local energy can be heavy-tailed, optimizers usually clip outliers when they compute the gradient. FermiNet clips local energies further than five times the mean absolute deviation from the median, and only in the gradient, "but not when evaluating the total energy of the system" (arXiv:1909.02487, Appendix A). The distinction matters for Ketboard: a mean of clipped local energies is not the variational energy, and an entry must come from an unclipped evaluation of the final state.

## Sampling

The configuration space is continuous, so the Metropolis proposals are continuous too: typically a Gaussian displacement of all electrons, with a width adjusted during the run to keep the acceptance rate near a target, and many walkers in parallel. In a periodic cell positions are wrapped back into the cell after each move. The autocorrelation analysis on the [variational Monte Carlo page](../variational-monte-carlo/) applies unchanged; with all-electron moves and a fixed width, the autocorrelation time grows with $N$, and a reported error bar should come from a binning analysis of the evaluation run.

## Periodic systems

A crystal or a homogeneous fluid is simulated in a cell with lattice vectors $\mathbf L_a$, and the wavefunction obeys

$$
\Psi(\mathbf r_1,\dots,\mathbf r_i+\mathbf L_a,\dots,\mathbf r_N)=e^{i\mathbf k_s\cdot\mathbf L_a}\,\Psi(\mathbf r_1,\dots,\mathbf r_N)
$$

for every particle and lattice vector, with the twist $\mathbf k_s$. At the $\Gamma$ point, $\mathbf k_s=0$, $\Psi$ is periodic. Networks impose this by feeding the coordinates through periodic functions, for example $\sin$ and $\cos$ of $\mathbf b_a\cdot\mathbf r$ with the reciprocal vectors $\mathbf b_a$, and by taking orbitals of plane-wave form $e^{i\mathbf k\cdot\mathbf r}$ for wave vectors $\mathbf k$ of the cell (Wilson et al., arXiv:2202.04622; Cassella et al., arXiv:2202.05183; Li, Li, Chen, arXiv:2203.15472). Distances enter through periodic surrogates that are smooth across the cell boundary, since the minimum-image distance has kinks.

The Coulomb energy of a periodic array of charges is conditionally convergent and is computed by Ewald summation. Two conventions must be fixed: a uniform neutralizing background cancels the $\mathbf G=0$ term, and the interaction of each charge with its own periodic images (the Madelung term) is included. Leaving out the Madelung term shifts the energy per particle by a constant of order $1/L$, which on a small cell exceeds the differences between ansätze.

A finite cell has finite-size errors: the kinetic energy depends on which plane waves are occupied, so the energy per particle oscillates with $N$, and the exchange-correlation hole is truncated by the cell. Twist averaging, extrapolation in $N$ and analytic corrections remove most of this for an estimate of the thermodynamic limit, but each changes the problem. Ketboard compares the finite cell at the stated twist as it is.

## Optimization and pretraining

The [optimizers](../optimization/) are the same as on the lattice. FermiNet introduced a Kronecker-factored approximation to natural gradient (KFAC, Martens and Grosse, arXiv:1503.05671) adapted to unnormalized densities (arXiv:1909.02487, Sec. II); stochastic reconfiguration in its kernel form (Chen and Heyl, arXiv:2302.01941) and the SPRING optimizer (Goldshlager, Abrahamsen, Lin, arXiv:2401.10190) handle networks with many parameters. Molecular ansätze are often pretrained to match Hartree–Fock orbitals before the energy is minimized. In FermiNet this was needed for numerical stability: without it the determinants of large systems underflowed and the optimization failed, and pretraining started the minimization from a region of low variance (arXiv:1909.02487, Appendix A).

## Systems on Ketboard

- **The homogeneous electron gas** in two and three dimensions, in finite periodic cells at the $\Gamma$ point, compared per electron: see its [benchmark page](../homogeneous-electron-gas/).
- **Atoms and molecules** with fixed nuclei, and **quantum dots** (electrons in a harmonic trap), compared as total energies. The [submission form](../../#submit) describes these from the particles, the space, the external potential and the interaction; no instance is on the board yet.

Neural states in continuous space are also used for ultracold Fermi gases (Kim et al., arXiv:2305.08831) and, at finite temperature, for the electron gas (Xie, Zhang, Wang, arXiv:2105.08644). Results computed in a finite basis set (second quantization) solve a different problem and are not compared with first-quantized ones.

## References

- D. Pfau, J. S. Spencer, A. G. D. G. Matthews, W. M. C. Foulkes, *Ab initio solution of the many-electron Schrödinger equation with deep neural networks*, arXiv:1909.02487 (2019). FermiNet; KFAC for unnormalized densities; clipping in the gradient only.
- J. S. Spencer, D. Pfau, A. Botev, W. M. C. Foulkes, *Better, faster fermionic neural networks*, arXiv:2011.07125 (2020).
- J. Hermann, Z. Schätzle, F. Noé, *Deep neural network solution of the electronic Schrödinger equation*, arXiv:1909.08423 (2019). PauliNet.
- I. von Glehn, J. S. Spencer, D. Pfau, *A self-attention ansatz for ab-initio quantum chemistry*, arXiv:2211.13672 (2022). Psiformer.
- R. Li et al., *Forward Laplacian: a new computational framework for neural network-based variational Monte Carlo*, arXiv:2307.08214 (2023).
- T. Kato, *On the eigenfunctions of many-particle systems in quantum mechanics*, Commun. Pure Appl. Math. 10, 151 (1957). Cusp conditions.
- J. Martens, R. Grosse, *Optimizing neural networks with Kronecker-factored approximate curvature*, arXiv:1503.05671 (2015).
- A. Chen, M. Heyl, *Empowering deep neural quantum states through efficient optimization*, arXiv:2302.01941 (2023). minSR.
- G. Goldshlager, N. Abrahamsen, L. Lin, *A Kaczmarz-inspired approach to accelerate the optimization of neural network wavefunctions*, arXiv:2401.10190 (2024). SPRING.
- M. Wilson, S. Moroni, M. Holzmann, N. Gao, F. Wudarski, T. Vegge, A. Bhowmik, *Neural network ansatz for periodic wave functions and the homogeneous electron gas*, arXiv:2202.04622 (2022).
- G. Cassella, H. Sutterud, S. Azadi, N. D. Drummond, D. Pfau, J. S. Spencer, W. M. C. Foulkes, *Discovering quantum phase transitions with fermionic neural networks*, arXiv:2202.05183 (2022).
- X. Li, Z. Li, J. Chen, *Ab initio calculation of real solids via neural network ansatz*, arXiv:2203.15472 (2022). DeepSolid.
- G. Pescia, J. Nys, J. Kim, A. Lovato, G. Carleo, *Message-passing neural quantum states for the homogeneous electron gas*, arXiv:2305.07240 (2023).
- J. Kim, G. Pescia, B. Fore, J. Nys, G. Carleo, S. Gandolfi, M. Hjorth-Jensen, A. Lovato, *Neural-network quantum states for ultra-cold Fermi gases*, arXiv:2305.08831 (2023).
- H. Xie, L. Zhang, L. Wang, *Ab-initio study of interacting fermions at finite temperature with neural canonical transformation*, arXiv:2105.08644 (2021).
