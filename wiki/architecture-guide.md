# Architecture guide

> **In brief.** Start with the representation of the wavefunction: lattice configurations or continuous particle coordinates. Within each group, the pages explain how networks encode correlations, respect symmetries and produce amplitudes. Network family, antisymmetric construction and sampling scheme are separate choices that can be combined in one state.

Notation follows the [conventions page](../notation/).

## Start with the configuration

On a lattice the input is a discrete spin or occupation configuration, $\boldsymbol\sigma$ or $\mathbf n$. In continuous space it is a list of particle coordinates, $\mathbf R$. The architecture pages are grouped by the representation they develop; a network ingredient such as attention can occur in either group.

For the common variational framework, begin with [neural quantum states](../neural-quantum-states/), [variational Monte Carlo](../variational-monte-carlo/) and [optimization](../optimization/). The [continuous-space introduction](../continuous-space/) adds coordinate derivatives, cusps and boundary conditions.

## Lattice systems

| Page | What it develops |
| --- | --- |
| [Restricted Boltzmann machine](../restricted-boltzmann-machine/) | An analytic log-amplitude and symmetry through shared weights. |
| [Convolutional and group-convolutional networks](../convolutional-networks/) | Local filters, lattice translations and space-group symmetry. |
| [Lattice transformers](../transformer-wavefunctions/) | Attention between sites or patches, with symmetry restoration. |
| [Autoregressive and recurrent networks](../autoregressive-networks/) | Normalized conditional amplitudes and sequential direct sampling. |
| [Lattice fermionic states](../fermionic-neural-states/) | Determinants, hidden fermions, backflow and pairing in an occupation basis. |

For spin systems, the RBM page supplies a concrete starting point before convolutional or attention-based states. For lattice fermions, start with the fermionic-state construction, then follow its links to the network used to build the correlated orbitals or pair functions. The autoregressive page addresses a sampling construction that can itself use recurrent, convolutional or transformer networks.

## Continuous space

| Page | What it develops |
| --- | --- |
| [FermiNet and PauliNet](../neural-orbitals/) | Equivariant orbitals, molecular references and nodal changes. |
| [Attention in continuous space](../attention-continuous-space/) | Psiformer, LapNet and the cost of coordinate derivatives. |
| [Periodic neural states](../periodic-neural-states/) | Bosonic Deep Sets, DeepSolid, cell boundaries and twists. |
| [Message-passing backflow and pairing](../message-passing-backflow/) | Particle graphs, correlated coordinates and Pfaffian states. |
| [Electron–nuclear neural states](../electron-nuclear-neural-states/) | Coupled electron–proton architectures and quantum nuclei. |

For molecules, follow neural orbitals with electron attention. For the electron gas, begin with periodic states and then message-passing backflow. For solids with clamped nuclei, read the periodic-orbital construction; for solid hydrogen with quantum protons, continue to electron–nuclear states. These are reading paths, not rankings of methods.

## How the ingredients fit together

A network's name does not fully specify a wavefunction. Distinguish the feature map, the object that produces the amplitude, and the sampling rule. For example,

$$
\Psi_\theta(\mathbf R)=
e^{J_\theta(\mathbf R)}
\det\Phi_\theta(\mathbf R)
$$

can use attention or message passing to construct $\Phi_\theta$. Its determinant supplies the electron exchange sign, while its learned entries carry correlations. Attention alone does not make this state autoregressive; normalized conditional probabilities require a separate construction.

Similarly, periodic boundaries constrain the features and orbital phases, while quantum nuclei enlarge the configuration and the kinetic estimator. These requirements can coexist with several network families. The linked articles separate those choices and identify their physical assumptions.

Benchmark pages answer a different question: which Hamiltonian, geometry, sector and energy convention define a comparable calculation. Use [benchmark conventions](../benchmark-conventions/) and the relevant system page when comparing reported results.

## References

- D. Pfau, J. S. Spencer, A. G. D. G. Matthews, W. M. C. Foulkes, *Ab initio solution of the many-electron Schrödinger equation with deep neural networks*, arXiv:1909.02487v3 (2019). Equivariant neural orbitals and determinants.
- I. von Glehn, J. S. Spencer, D. Pfau, *A Self-Attention Ansatz for Ab-initio Quantum Chemistry*, arXiv:2211.13672v2 (2022). Attention as an orbital feature map.
- G. Pescia, J. Nys, J. Kim, A. Lovato, G. Carleo, *Message-Passing Neural Quantum States for the Homogeneous Electron Gas*, arXiv:2305.07240v3 (2023). Particle graphs and backflow.
