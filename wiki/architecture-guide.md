# Architecture guide

> **In brief.** A neural quantum state represents the wavefunction by a parameterized function of a many-body configuration. On a lattice, the configuration consists of discrete spins or occupations; in continuous space, it consists of particle coordinates. The architecture must represent correlations while satisfying the exchange symmetries and boundary conditions of the physical system.

Notation follows the [conventions page](../notation/).

## Configuration space

For a spin system, a basis configuration $\boldsymbol\sigma=(\sigma_1,\ldots,\sigma_N)$ specifies the spin at each lattice site. The wavefunction assigns a complex amplitude $\Psi_\theta(\boldsymbol\sigma)$ to every such configuration, with $\theta$ denoting the variational parameters. For particles in an occupation basis, the input is instead a vector $\mathbf n$ of occupation numbers. In continuous space, the wavefunction depends on the particle positions $\mathbf R=(\mathbf r_1,\ldots,\mathbf r_N)$.

This difference in configuration space has consequences for both the architecture and its evaluation. A lattice network can exploit the fixed arrangement of sites through shared convolutional filters. A network for identical particles in continuous space must account for permutations of its particle inputs, and its coordinate derivatives enter the kinetic energy. Both are [neural quantum states](../neural-quantum-states/) whose parameters can be [optimized](../optimization/) by minimizing the energy with [variational Monte Carlo](../variational-monte-carlo/).

## Lattice systems

The [restricted Boltzmann machine](../restricted-boltzmann-machine/) gives a simple example of a lattice wavefunction: summing over its hidden variables yields an explicit expression for the amplitude. More general [convolutional networks](../convolutional-networks/) apply local filters repeatedly across the lattice, allowing correlations to extend over larger distances as the depth increases. Weight sharing incorporates translation symmetry, and group convolutions extend this construction to other lattice symmetries. [Lattice transformers](../transformer-wavefunctions/) use attention to couple sites or patches, with weights that depend on the spin or occupation configuration.

These networks can parameterize the amplitude directly or form part of a more structured ansatz. In [lattice fermionic states](../fermionic-neural-states/), they can generate correlated orbitals or pair functions entering determinants and Pfaffians. In [autoregressive states](../autoregressive-networks/), they parameterize conditional probabilities for successive sites, which makes direct sampling possible. The same network family can therefore occur in wavefunctions with different algebraic forms and sampling procedures.

## Continuous space

In [continuous space](../continuous-space/), electronic wavefunctions are commonly built from determinants of orbitals that depend on all electron positions. This dependence allows the orbitals to describe correlations beyond a fixed Slater determinant. [FermiNet and PauliNet](../neural-orbitals/) construct such orbitals using permutation-equivariant networks, while [Psiformer and LapNet](../attention-continuous-space/) use attention to couple the electrons. [Message-passing backflow and pairing](../message-passing-backflow/) use particle graphs to construct correlated coordinates or pair functions.

The physical setting imposes further constraints. Molecular orbitals must have suitable decay far from the nuclei, whereas [periodic neural states](../periodic-neural-states/) must satisfy the boundary conditions of a simulation cell, including any twist. When nuclei are treated as quantum particles, their positions also become arguments of the wavefunction and their derivatives contribute to the kinetic energy. The [electron–nuclear architectures used for solid hydrogen](../electron-nuclear-neural-states/) describe this joint dependence on electron and proton coordinates.

## Correlations, antisymmetry and sampling

The role of a neural network in a fermionic wavefunction can be seen from a single-determinant ansatz. For $N$ identical fermions with the same spin, consider

$$
\Psi_\theta(\mathbf R)=
e^{J_\theta(\mathbf R)}
\det\Phi_\theta(\mathbf R),
\qquad
[\Phi_\theta(\mathbf R)]_{ia}=\phi_{\theta,a}(\mathbf r_i;\{\mathbf r_{j\ne i}\}),
$$

where $i$ labels particles, $a$ labels orbitals, and $J_\theta$ is a real function symmetric under particle exchange. Each orbital is symmetric in the coordinates of the other particles, denoted by $\{\mathbf r_{j\ne i}\}$. Exchanging two particles therefore exchanges two rows of $\Phi_\theta$ and leaves $J_\theta$ unchanged. The determinant changes sign, giving the required fermionic antisymmetry.

The factor $e^{J_\theta}$ changes the relative magnitudes of amplitudes but, being positive, cannot change the zeros of the determinant. Correlations in the neural orbitals can change those zeros and hence the nodal surface. Attention and message passing provide different ways of constructing the orbitals while preserving their permutation properties; the determinant supplies antisymmetry in either case (Pfau et al., arXiv:1909.02487v3; von Glehn et al., arXiv:2211.13672v2; Pescia et al., arXiv:2305.07240v3).

Evaluating this wavefunction at a given configuration does not by itself provide a way to draw independent configurations from $p_\theta(\mathbf R)\propto|\Psi_\theta(\mathbf R)|^2$. Such states are usually sampled by a Markov chain. An autoregressive lattice state instead parameterizes the normalized distribution as

$$
p_\theta(\boldsymbol\sigma)
=\prod_{i=1}^{N}p_\theta(\sigma_i\mid\sigma_1,\ldots,\sigma_{i-1}),
\qquad
\sum_{\sigma_i}p_\theta(\sigma_i\mid\sigma_1,\ldots,\sigma_{i-1})=1.
$$

Sampling each conditional in order produces a configuration from the full distribution, without a Markov chain. Recurrent networks and suitably masked transformers can both parameterize these conditionals. Direct sampling follows from this normalized factorization; using attention to construct orbitals in a determinant does not confer the same property.

## References

- D. Pfau, J. S. Spencer, A. G. D. G. Matthews, W. M. C. Foulkes, *Ab initio solution of the many-electron Schrödinger equation with deep neural networks*, arXiv:1909.02487v3 (2019). Equivariant neural orbitals and determinants.
- I. von Glehn, J. S. Spencer, D. Pfau, *A Self-Attention Ansatz for Ab-initio Quantum Chemistry*, arXiv:2211.13672v2 (2022). Attention as an orbital feature map.
- G. Pescia, J. Nys, J. Kim, A. Lovato, G. Carleo, *Message-Passing Neural Quantum States for the Homogeneous Electron Gas*, arXiv:2305.07240v3 (2023). Particle graphs and backflow.
